import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, EnergyType, Stage, SuperType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  AFTER_ATTACK,
  ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';
import { PUT_THIS_POKEMON_AND_ALL_ATTACHED_CARDS_INTO_YOUR_HAND } from '../../../game/store/prefabs/attack-effects';

export class Tatsugiri extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 70;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Mise en Place',
      cost: [W],
      damage: 0,
      text: 'Search your deck for up to 2 Basic Water Energy cards and attach them to 1 of your Basic Pokémon. Then, shuffle your deck.',
    },
    {
      name: 'Curl Up',
      cost: [W],
      damage: 30,
      text: 'Put this Pokémon and all attached cards into your hand.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '62';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Tatsugiri';
  public fullName: string = 'Tatsugiri SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Mise en Place: up to 2 Basic Water Energy from deck onto 1 of your Basic Pokemon, then shuffle.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      const attachOptions = {
        energyFilter: {
          superType: SuperType.ENERGY,
          energyType: EnergyType.BASIC,
          provides: [CardType.WATER],
        },
        pokemonFilter: { stage: Stage.BASIC },
      };

      ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON(store, state, player, 2, 1, attachOptions);
    }

    // Curl Up: put this Pokemon and all attached cards into your hand (after damage is dealt).
    if (AFTER_ATTACK(effect, 1, this)) {
      PUT_THIS_POKEMON_AND_ALL_ATTACHED_CARDS_INTO_YOUR_HAND(store, state, effect);
    }

    return state;
  }
}
