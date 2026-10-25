import { ToolKnockOutReceipt, captureToolKnockOut, reactToToolKnockOut } from '../../../game/store/prefabs/tool-counter-effects';
import { AfterDamageEffect } from '../../../game/store/effects/attack-effects';
import { PlaceDamageCountersEffect } from '../../../game/store/effects/game-effects';
import { TrainerCard } from '../../../game/store/card/trainer-card';
import { TrainerType } from '../../../game/store/card/card-types';
import { StoreLike } from '../../../game/store/store-like';
import { State } from '../../../game/store/state/state';
import { Effect } from '../../../game/store/effects/effect';
import { KnockOutEffect } from '../../../game/store/effects/game-effects';

export class VengefulPunch extends TrainerCard {

  public regulationMark = 'G';

  public trainerType: TrainerType = TrainerType.TOOL;

  public set: string = 'OBF';

  public cardImage: string = 'assets/cardback.png';

  public setNumber: string = '197';

  public name = 'Vengeful Punch';

  public fullName = 'Vengeful Punch OBF';

  public text: string =
    'If the Pokémon this card is attached to is Knocked Out by damage from an attack from your opponent\'s Pokémon, put 4 damage counters on the Attacking Pokémon.';

  public damageDealt = false;

  private counterReceipt?: ToolKnockOutReceipt;

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AfterDamageEffect && effect.target.tools.includes(this)) {
      this.counterReceipt = captureToolKnockOut(store, state, effect, 'any');
    }
    if (effect instanceof KnockOutEffect && effect.target.tools.includes(this)) {
      const receipt = this.counterReceipt;
      this.counterReceipt = undefined;
      return reactToToolKnockOut(store, state, effect, this, receipt, (next, owner, attacker) => {
      if (!attacker) return next;
      const counters = new PlaceDamageCountersEffect(owner, attacker, 40);
      counters.origin = 'trainer'; counters.effectName = this.name;
      return store.reduceEffect(next, counters);
      });
    }
    return state;
  }
}