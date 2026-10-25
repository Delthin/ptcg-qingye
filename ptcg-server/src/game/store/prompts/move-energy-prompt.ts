import { Card } from '../card/card';
import { GameError } from '../../game-error';
import { GameMessage } from '../../game-message';
import { Prompt } from './prompt';
import { PlayerType, SlotType, CardTarget } from '../actions/play-card-action';
import { State } from '../state/state';
import { energyTarget, sameEnergyTarget, validEnergySelection, validEnergyTarget } from './energy-prompt-utils';
import { FilterType } from './choose-cards-prompt';

export const MoveEnergyPromptType = 'Move energy';

export type MoveEnergyResultType = { from: CardTarget, to: CardTarget, index: number }[];

export interface CardTransfer {
  from: CardTarget;
  to: CardTarget;
  card: Card;
}

export interface MoveEnergyOptions {
  allowCancel: boolean;
  min: number;
  max: number | undefined;
  blockedFrom: CardTarget[];
  blockedTo: CardTarget[];
  blockedMap: { source: CardTarget, blocked: number[] }[];
}

export class MoveEnergyPrompt extends Prompt<CardTransfer[]> {

  readonly type: string = MoveEnergyPromptType;

  public options: MoveEnergyOptions;

  constructor(
    playerId: number,
    public message: GameMessage,
    public playerType: PlayerType,
    public slots: SlotType[],
    public filter: FilterType,
    options?: Partial<MoveEnergyOptions>
  ) {
    super(playerId);

    // Default options
    this.options = Object.assign({}, {
      allowCancel: true,
      min: 0,
      max: undefined,
      blockedFrom: [],
      blockedTo: [],
      blockedMap: [],
    }, options);
  }

  public decode(result: MoveEnergyResultType | null, state: State): CardTransfer[] | null {
    if (result === null) {
      return result;  // operation cancelled
    }
    if (!Array.isArray(result)) throw new GameError(GameMessage.INVALID_PROMPT_RESULT);
    const transfers: CardTransfer[] = result.map(t => {
      if (!t || !Number.isInteger(t.index) || t.index < 0
        || !validEnergyTarget(t.from, this.playerType, this.slots, this.options.blockedFrom, this.getPerspectivePlayerId(), state)
        || !validEnergyTarget(t.to, this.playerType, this.slots, this.options.blockedTo, this.getPerspectivePlayerId(), state)) {
        throw new GameError(GameMessage.INVALID_PROMPT_RESULT);
      }
      const card = energyTarget(state, this.getPerspectivePlayerId(), t.from)!.cards[t.index];
      return { from: t.from, to: t.to, card };
    });
    if (!this.validate(transfers, state)) throw new GameError(GameMessage.INVALID_PROMPT_RESULT);
    return transfers;
  }

  public validate(result: CardTransfer[] | null, state?: State): boolean {
    if (result === null) {
      return this.options.allowCancel;  // operation cancelled
    }
    if (!Array.isArray(result) || result.length < this.options.min
      || (this.options.max !== undefined && result.length > this.options.max)) return false;
    const selected = new Set<Card>();
    return result.every(r => {
      if (!r || !validEnergyTarget(r.from, this.playerType, this.slots, this.options.blockedFrom, this.getPerspectivePlayerId(), state)
        || !validEnergyTarget(r.to, this.playerType, this.slots, this.options.blockedTo, this.getPerspectivePlayerId(), state)
        || sameEnergyTarget(r.from, r.to) || selected.has(r.card)
        || !validEnergySelection(r.card, r.from, this.filter, this.options.blockedMap, this.getPerspectivePlayerId(), state)) return false;
      selected.add(r.card);
      return true;
    });
  }

}
