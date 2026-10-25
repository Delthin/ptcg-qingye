import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import {
  ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON,
  THIS_ATTACK_DOES_X_MORE_DAMAGE,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Melmetalex extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Meltan';
  public cardType: CardType[] = [M];
  public hp: number = 300;
  public weakness = [{ type: R }];
  public resistance = [{ type: G, value: -30 }];
  public retreat = [C, C, C, C];

  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Metal-bolize',
      cost: [M],
      damage: 0,
      text: 'Search your deck for up to 2 Basic Metal Energy cards and attach them to this Pokémon. Then, shuffle your deck.',
    },
    {
      name: 'Full Metal Knuckle',
      cost: [C, C, C, C],
      damage: 90,
      damageCalculation: '+',
      text: 'This attack does 30 more damage for each Metal Energy attached to this Pokémon.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '153';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Melmetal ex';
  public fullName: string = 'Melmetal ex OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Metal-bolize: search up to 2 Basic Metal Energy from deck and attach them to this Pokémon.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      state = ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON(store, state, player, 2, 1);
    }

    // Full Metal Knuckle: +30 damage for each Metal Energy attached to this Pokémon.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const active = player.active;

      const checkProvidedEnergy = new CheckProvidedEnergyEffect(player, active);
      state = store.reduceEffect(state, checkProvidedEnergy);

      const metalEnergy = checkProvidedEnergy.energyMap.filter(
        energy => energy.provides.includes(CardType.METAL),
      ).length;

      if (metalEnergy > 0) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 30 * metalEnergy);
      }
    }

    return state;
  }
}
