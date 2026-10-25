import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_INTO_HAND, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Audino extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 100;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Find a Friend',
      cost: [C],
      damage: 0,
      text: 'Search your deck for a Pokémon, reveal it, and put it into your hand. Then, shuffle your deck.',
    },
    {
      name: 'Slap',
      cost: [C, C, C],
      damage: 80,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '173';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Audino';
  public fullName: string = 'Audino OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_INTO_HAND(store, state, player);
    }
    return state;
  }
}
