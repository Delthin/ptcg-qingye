import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_ONTO_BENCH, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Fidough extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 60;
  public weakness = [{ type: M }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Pleasant Aroma',
      cost: [C],
      damage: 0,
      text: 'Search your deck for a Basic Pokémon and put it onto your Bench. Then, shuffle your deck.',
    },
    {
      name: 'Stampede',
      cost: [C],
      damage: 10,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '66';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Fidough';
  public fullName: string = 'Fidough SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      return SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_ONTO_BENCH(store, state, player, { stage: Stage.BASIC });
    }

    return state;
  }
}
