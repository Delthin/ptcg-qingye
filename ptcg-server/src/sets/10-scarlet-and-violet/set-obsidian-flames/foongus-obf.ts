import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_ONTO_BENCH, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Foongus extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 50;
  public weakness = [{ type: R }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Enticing Pattern',
      cost: [G],
      damage: 0,
      text: 'Search your deck for a Basic [G] Pokémon and put it onto your Bench. Then, shuffle your deck.',
    },
    {
      name: 'Beat',
      cost: [G, C],
      damage: 20,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '9';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Foongus';
  public fullName: string = 'Foongus OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      return SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_ONTO_BENCH(store, state, player, {
        cardType: [CardType.GRASS],
        stage: Stage.BASIC,
      });
    }
    return state;
  }
}
