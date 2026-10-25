import { GameMessage } from '../../game-message';
import { Prompt } from './prompt';
import { PlayerType, SlotType, CardTarget } from '../actions/play-card-action';
import { State } from '../state/state';
import { damageTargetCap, damageTargetsEqual, getDamagePromptTarget, isDamageStep } from './damage-prompt-validation';
import { DamageMap } from './move-damage-prompt';

export const PutDamagePromptType = 'Put damage';

export interface PutDamageOptions {
  allowCancel: boolean;
  blocked: CardTarget[];
  allowPlacePartialDamage?: boolean | undefined;
  damageMultiple?: number;
  maxTargets?: number;
}

export class PutDamagePrompt extends Prompt<DamageMap[]> {

  readonly type: string = PutDamagePromptType;

  public options: PutDamageOptions;

  constructor(
    playerId: number,
    public message: GameMessage,
    public playerType: PlayerType,
    public slots: SlotType[],
    public damage: number,
    public maxAllowedDamage: DamageMap[],
    options?: Partial<PutDamageOptions>
  ) {
    super(playerId);

    // Default options
    this.options = Object.assign({}, {
      allowCancel: true,
      blocked: [],
      allowPlacePartialDamage: false,
      damageMultiple: 10,
    }, options);
  }

  public decode(result: DamageMap[] | null, state: State): DamageMap[] | null {
    return result;
  }

  public validate(result: DamageMap[] | null, state: State): boolean {
    if (result === null) return this.options.allowCancel;
    const step = this.options.damageMultiple === undefined ? 10 : this.options.damageMultiple;
    if (!Array.isArray(result) || !isDamageStep(step)
      || !Number.isSafeInteger(this.damage) || this.damage < 0 || this.damage % 10 !== 0
      || state.players.every(player => player.id !== this.getPerspectivePlayerId())) return false;
    if (this.options.maxTargets !== undefined
      && (!Number.isSafeInteger(this.options.maxTargets) || this.options.maxTargets < 1
        || result.length > this.options.maxTargets)) return false;
    let total = 0;
    const targets = new Set<object>();
    for (const entry of result) {
      if (entry === null || typeof entry !== 'object' || !isDamageStep(entry.damage)
        || entry.damage % step !== 0) return false;
      const target = getDamagePromptTarget(state, this.getPerspectivePlayerId(), entry.target);
      if (target === undefined || targets.has(target)
        || (this.playerType !== PlayerType.ANY && entry.target.player !== this.playerType)
        || !this.slots.includes(entry.target.slot)
        || this.options.blocked.some(blocked => damageTargetsEqual(blocked, entry.target))) return false;
      targets.add(target);
      total += entry.damage;
      const cap = damageTargetCap(entry.target, this.maxAllowedDamage);
      if (!Number.isSafeInteger(total) || total > this.damage
        || (cap !== undefined && (!Number.isFinite(cap) || target.damage + entry.damage > cap))) return false;
    }
    return this.options.allowPlacePartialDamage === true || total === this.damage;
  }

}
