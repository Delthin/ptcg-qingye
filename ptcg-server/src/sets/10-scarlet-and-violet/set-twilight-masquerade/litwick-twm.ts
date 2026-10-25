import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_ONTO_BENCH, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Litwick extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [R];
  public hp: number = 60;
  public weakness = [{ type: W }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Call for Family',
      cost: [R],
      damage: 0,
      text: 'Search your deck for a Basic Pokémon and put it onto your Bench. Then, shuffle your deck.'
    },
    {
      name: 'Live Coal',
      cost: [R, C],
      damage: 20,
      text: ''
    }
  ];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '36';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Litwick';
  public fullName: string = 'Litwick TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      state = SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_ONTO_BENCH(store, state, player, { stage: Stage.BASIC });
    }

    return state;
  }
}
