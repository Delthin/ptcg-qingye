import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike, SlotType } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckRetreatCostEffect } from '../../../game/store/effects/check-effects';
import {
  IS_ABILITY_BLOCKED,
  THIS_ATTACK_DOES_X_DAMAGE_TO_X_OF_YOUR_OPPONENTS_POKEMON,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Omastar extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Omanyte';
  public cardType: CardType[] = [W];
  public hp: number = 150;
  public weakness = [{ type: L }];
  public retreat = [C, C, C];

  public powers = [{
    name: 'Primordial Tentacles',
    powerType: PowerType.ABILITY,
    text: 'As long as this Pokémon is in the Active Spot, your opponent\'s Active Pokémon can\'t retreat.',
  }];

  public attacks = [{
    name: 'Aqua Split',
    cost: [W, W],
    damage: 90,
    text: 'This attack also does 30 damage to 2 of your opponent\'s Benched Pokémon. (Don\'t apply Weakness and Resistance for Benched Pokémon.)',
  }];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '139';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Omastar';
  public fullName: string = 'Omastar MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Primordial Tentacles: as long as this Pokémon is in the Active Spot,
    // your opponent's Active Pokémon can't retreat.
    if (effect instanceof CheckRetreatCostEffect) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      // The lock only applies while this card is the opponent's Active Pokémon,
      // so the player checking his own retreat (with Omastar Active) is unaffected.
      if (opponent.active.getPokemonCard() !== this) {
        return state;
      }

      if (IS_ABILITY_BLOCKED(store, state, opponent, this)) {
        return state;
      }

      // Veto the retreat of the opponent's Active Pokémon.
      effect.preventDefault = true;
    }

    // Aqua Split
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = THIS_ATTACK_DOES_X_DAMAGE_TO_X_OF_YOUR_OPPONENTS_POKEMON(
        30, effect, store, state, 2, 2, false, [SlotType.BENCH]);
    }

    return state;
  }
}
