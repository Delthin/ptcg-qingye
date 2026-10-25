import { Card } from '../card/card';
import { GameError } from '../../game-error';
import { GameMessage } from '../../game-message';
import { Prompt } from './prompt';
import { PlayerType, SlotType, CardTarget } from '../actions/play-card-action';
import { State } from '../state/state';
import { energyTarget, validEnergySelection, validEnergyTarget } from './energy-prompt-utils';
import { FilterType } from './choose-cards-prompt';
import { CardList } from '../state/card-list';


export const DiscardEnergyPromptType = 'Discard energy';

export type DiscardEnergyResultType = { from: CardTarget, index: number }[];

export interface DiscardEnergyTransfer {
  from: CardTarget;
  card: Card;
}

export interface DiscardEnergyOptions {
  allowCancel: boolean;
  min: number;
  max: number | undefined;
  blockedFrom: CardTarget[];
  blockedMap: { source: CardTarget, blocked: number[] }[];
}

export class DiscardEnergyPrompt extends Prompt<DiscardEnergyTransfer[]> {

  readonly type: string = DiscardEnergyPromptType;

  public options: DiscardEnergyOptions;
  public cardList!: CardList;

  constructor(
    playerId: number,
    public message: GameMessage,
    public playerType: PlayerType,
    public slots: SlotType[],
    public filter: FilterType,
    options?: Partial<DiscardEnergyOptions>
  ) {
    super(playerId);

    // Default options
    this.options = Object.assign({}, {
      allowCancel: true,
      min: 0,
      max: undefined,
      blockedFrom: [],
      blockedMap: [],
    }, options);
  }

  public decode(result: DiscardEnergyResultType | null, state: State): DiscardEnergyTransfer[] | null {
    if (result === null) {
      return result;  // operation cancelled
    }
    if (!Array.isArray(result)) throw new GameError(GameMessage.INVALID_PROMPT_RESULT);
    const transfers: DiscardEnergyTransfer[] = result.map(t => {
      if (!t || !Number.isInteger(t.index) || t.index < 0
        || !validEnergyTarget(t.from, this.playerType, this.slots, this.options.blockedFrom, this.getPerspectivePlayerId(), state)) {
        throw new GameError(GameMessage.INVALID_PROMPT_RESULT);
      }
      const card = energyTarget(state, this.getPerspectivePlayerId(), t.from)!.cards[t.index];
      return { from: t.from, card };
    });
    if (!this.validate(transfers, state)) throw new GameError(GameMessage.INVALID_PROMPT_RESULT);
    return transfers;
  }

  public validate(result: DiscardEnergyTransfer[] | null, state?: State): boolean {
    if (result === null) {
      return this.options.allowCancel;  // operation cancelled
    }
    if (!Array.isArray(result) || result.length < this.options.min || (this.options.max !== undefined && result.length > this.options.max)) {
      return false;
    }
    const selected = new Set<Card>();
    return result.every(r => {
      if (!r || !validEnergyTarget(r.from, this.playerType, this.slots, this.options.blockedFrom, this.getPerspectivePlayerId(), state)
        || selected.has(r.card)
        || !validEnergySelection(r.card, r.from, this.filter, this.options.blockedMap, this.getPerspectivePlayerId(), state)) return false;
      selected.add(r.card);
      return true;
    });
  }
}
