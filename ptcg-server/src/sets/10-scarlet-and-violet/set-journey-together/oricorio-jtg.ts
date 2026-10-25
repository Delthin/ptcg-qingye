import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_ONTO_BENCH,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Oricorio extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 80;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Call for Family',
      cost: [C],
      damage: 0,
      text: 'Search your deck for up to 2 Basic Pokémon and put them onto your Bench. Then, shuffle your deck.'
    },
    {
      name: 'Spooky Shot',
      cost: [P],
      damage: 20,
      text: ''
    }
  ];

  public regulationMark = 'H';
  public set: string = 'JTG';
  public setNumber: string = '65';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Oricorio';
  public fullName: string = 'Oricorio JTG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      state = SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_ONTO_BENCH(
        store,
        state,
        player,
        { stage: Stage.BASIC },
        { min: 0, max: 2, allowCancel: true }
      );
    }

    return state;
  }
}
