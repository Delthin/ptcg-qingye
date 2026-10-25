import { GameError } from '../../game-error';
import { GameMessage } from '../../game-message';
import { Prompt } from './prompt';
import { PlayerType, SlotType, CardTarget } from '../actions/play-card-action';
import { State } from '../state/state';
import { validateDamageTransfers } from './damage-prompt-validation';
import { DamageMap, DamageTransfer } from './move-damage-prompt';

export const RemoveDamagePromptType = 'Remove damage';

export type RemoveDamageResultType = DamageTransfer[];

// export interface DamageTransfer {
//   from: CardTarget;
//   to: CardTarget;
// }

// export interface DamageMap {
//   target: CardTarget;
//   damage: number;
// }

export interface RemoveDamageOptions {
  allowCancel: boolean;
  min: number;
  max: number | undefined;
  blockedFrom: CardTarget[];
  blockedTo: CardTarget[];
  sameTarget: boolean;
  sameSource: boolean;
}

export class RemoveDamagePrompt extends Prompt<DamageTransfer[]> {

  readonly type: string = RemoveDamagePromptType;

  public options: RemoveDamageOptions;

  constructor(
    playerId: number,
    public message: GameMessage,
    public playerType: PlayerType,
    public slots: SlotType[],
    public maxAllowedDamage: DamageMap[],
    options?: Partial<RemoveDamageOptions>
  ) {
    super(playerId);

    // Default options
    this.options = Object.assign({}, {
      allowCancel: true,
      min: 0,
      max: undefined,
      blockedFrom: [],
      blockedTo: [],
      sameTarget: false,
      sameSource: false
    }, options);
  }

  public decode(result: RemoveDamageResultType | null, state: State): DamageTransfer[] | null {
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
      singleSourceTarget: this.options.sameSource,
      singleDestinationTarget: this.options.sameTarget,
    });
  }

}
