import { GameError } from '../../game-error';
import { GameMessage } from '../../game-message';
import { Prompt } from './prompt';
import { PlayerType, SlotType, CardTarget } from '../actions/play-card-action';
import { State } from '../state/state';
import { validateDamageTransfers } from './damage-prompt-validation';

export const MoveDamagePromptType = 'Move damage';

export type MoveDamageResultType = DamageTransfer[];

export interface DamageTransfer {
  from: CardTarget;
  to: CardTarget;
}

export interface DamageMap {
  target: CardTarget;
  damage: number;
}

export interface MoveDamageOptions {
  allowCancel: boolean;
  min: number;
  max: number | undefined;
  blockedFrom: CardTarget[];
  blockedTo: CardTarget[];
  singleSourceTarget: boolean;
  singleDestinationTarget: boolean;
  damageMultiple?: number;
  fixedSourceCounters?: number;
}

export class MoveDamagePrompt extends Prompt<DamageTransfer[]> {

  readonly type: string = MoveDamagePromptType;

  public options: MoveDamageOptions;

  constructor(
    playerId: number,
    public message: GameMessage,
    public playerType: PlayerType,
    public slots: SlotType[],
    public maxAllowedDamage: DamageMap[],
    options?: Partial<MoveDamageOptions>
  ) {
    super(playerId);

    // Default options
    this.options = Object.assign({}, {
      allowCancel: true,
      min: 0,
      max: undefined,
      blockedFrom: [],
      blockedTo: [],
      singleSourceTarget: false,
      singleDestinationTarget: false,
      damageMultiple: 10
    }, options);
  }

  public decode(result: MoveDamageResultType | null, state: State): DamageTransfer[] | null {
    if (result === null) {
      return result;  // operation cancelled
    }
    const player = state.players.find(p => p.id === this.getPerspectivePlayerId());
    if (player === undefined) {
      throw new GameError(GameMessage.INVALID_PROMPT_RESULT);
    }
    return result;
  }

  public validate(result: DamageTransfer[] | null, state: State): boolean {
    return validateDamageTransfers(state, this.getPerspectivePlayerId(), result, {
      ...this.options,
      playerType: this.playerType,
      slots: this.slots,
      maxAllowedDamage: this.maxAllowedDamage,
    });
  }

}
