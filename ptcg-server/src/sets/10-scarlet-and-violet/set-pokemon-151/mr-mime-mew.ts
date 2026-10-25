import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import { DealDamageEffect } from '../../../game/store/effects/attack-effects';
import { IS_ABILITY_BLOCKED, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { PUT_X_DAMAGE_COUNTERS_IN_ANY_WAY_YOU_LIKE } from '../../../game/store/prefabs/attack-effects';

export class MrMime extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 90;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public powers = [{
    name: 'Mimic Barrier',
    powerType: PowerType.ABILITY,
    text: 'If this Pokémon and your opponent\'s Active Pokémon have the same amount of Energy attached, prevent all damage done to this Pokémon by attacks from your opponent\'s Pokémon.'
  }];

  public attacks = [{
    name: 'Psypower',
    cost: [C],
    damage: 0,
    text: 'Put 3 damage counters on your opponent\'s Pokémon in any way you like.'
  }];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '122';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Mr. Mime';
  public fullName: string = 'Mr. Mime MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Mimic Barrier: same amount of Energy on this Pokémon and on the opponent's
    // Active Pokémon => prevent all attack damage done to this Pokémon.
    if (effect instanceof DealDamageEffect && effect.target.cards.includes(this)) {
      const owner = state.players.find(player =>
        player.active.cards.includes(this) || player.bench.some(bench => bench.cards.includes(this)));

      if (owner === undefined) {
        return state;
      }

      if (IS_ABILITY_BLOCKED(store, state, owner, this)) {
        return state;
      }

      const thisSlot = owner.active.cards.includes(this)
        ? owner.active
        : owner.bench.find(bench => bench.cards.includes(this));

      if (thisSlot === undefined) {
        return state;
      }

      const opponent = StateUtils.getOpponent(state, owner);

      const checkThisEnergy = new CheckProvidedEnergyEffect(owner, thisSlot);
      state = store.reduceEffect(state, checkThisEnergy);

      const checkOpponentEnergy = new CheckProvidedEnergyEffect(opponent, opponent.active);
      state = store.reduceEffect(state, checkOpponentEnergy);

      if (checkThisEnergy.energyMap.length === checkOpponentEnergy.energyMap.length) {
        effect.damage = 0;
      }
    }

    // Psypower: put 3 damage counters on your opponent's Pokémon in any way you like.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      PUT_X_DAMAGE_COUNTERS_IN_ANY_WAY_YOU_LIKE(3, store, state, effect);
    }

    return state;
  }
}
