import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON,
  DISCARD_ALL_ENERGY_FROM_POKEMON,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Raichu extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Pikachu';
  public cardType: CardType[] = [L];
  public hp: number = 140;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Electrocharge',
      cost: [C],
      damage: 0,
      text: 'Search your deck for up to 2 Basic Lightning Energy cards and attach them to this Pokémon. Then, shuffle your deck.',
    },
    {
      name: 'Thunderbolt',
      cost: [L, L, C],
      damage: 200,
      text: 'Discard all Energy from this Pokémon.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '64';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Raichu';
  public fullName: string = 'Raichu PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      // Search the deck for up to 2 Basic Lightning Energy cards and attach
      // them (helper also shows the cards and shuffles the deck afterwards).
      ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON(store, state, player, 2, 1);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      // Discard all Energy attached to this Pokémon.
      DISCARD_ALL_ENERGY_FROM_POKEMON(store, state, effect, this);
    }

    return state;
  }
}
