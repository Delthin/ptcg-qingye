import { TrainerCard } from '../../../game/store/card/trainer-card';
import { TrainerType } from '../../../game/store/card/card-types';
import { StoreLike } from '../../../game/store/store-like';
import { State } from '../../../game/store/state/state';
import { Effect } from '../../../game/store/effects/effect';
import { PutCountersEffect } from '../../../game/store/effects/attack-effects';
import { PlaceDamageCountersEffect } from '../../../game/store/effects/game-effects';
import { StateUtils } from '../../../game/store/state-utils';
import { IS_STADIUM_EFFECT_BLOCKED } from '../../../game/store/prefabs/stadium-effect';

export class BattleColosseum extends TrainerCard {
  public trainerType: TrainerType = TrainerType.STADIUM;
  public regulationMark = 'I';
  public set: string = 'PFL';
  public name: string = 'Battle Cage';
  public fullName: string = 'Battle Colosseum M2';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '85';
  public text: string = 'Prevent all damage counters from being placed on Benched Pokémon (both yours and your opponent\'s) by effects of attacks and Abilities from the opponent\'s Pokémon. (Damage from attacks is still taken.)';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (StateUtils.getStadiumCard(state) !== this) return state;
    const isAttack = effect instanceof PutCountersEffect;
    const isAbility = effect instanceof PlaceDamageCountersEffect && effect.origin === 'ability';
    if (!isAttack && !isAbility) return state;
    const placement = effect as PutCountersEffect | PlaceDamageCountersEffect;
    const owner = StateUtils.findOwner(state, placement.target);
    if (placement.player !== owner && owner.bench.includes(placement.target)
      && !IS_STADIUM_EFFECT_BLOCKED(store, state, owner, placement.target, this)) {
      placement.preventDefault = true;
    }
    return state;
  }
}
