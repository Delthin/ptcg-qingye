import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_ONTO_BENCH, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Kangaskhan extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 130;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Call for Family',
      cost: [C],
      damage: 0,
      text: 'Search your deck for a Basic Pokémon and put it onto your Bench. Then, shuffle your deck.'
    },
    {
      name: 'Mega Punch',
      cost: [C, C, C],
      damage: 100,
      text: ''
    }
  ];

  public regulationMark = 'H';
  public set: string = 'SVP';
  public setNumber: string = '202';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Kangaskhan';
  public fullName: string = 'Kangaskhan SVP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Call for Family: search a Basic Pokemon from deck onto the Bench, then shuffle.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_ONTO_BENCH(store, state, player, { stage: Stage.BASIC });
    }

    return state;
  }
}
