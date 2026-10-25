import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_INTO_HAND,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Lapras extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [CardType.WATER];
  public hp: number = 110;
  public weakness = [{ type: CardType.LIGHTNING }];
  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Hop on My Back',
      cost: [CardType.WATER],
      damage: 0,
      text: 'Search your deck for up to 2 Pokémon, reveal them, and put them into your hand. Then, shuffle your deck.',
    },
    {
      name: 'Aqua Edge',
      cost: [CardType.WATER, CardType.COLORLESS, CardType.COLORLESS],
      damage: 90,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '131';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Lapras';
  public fullName: string = 'Lapras MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Hop on My Back: search deck for up to 2 Pokémon, reveal, put into hand, then shuffle.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      state = SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_INTO_HAND(
        store, state, player, {}, { min: 0, max: 2 }
      );
    }

    // Aqua Edge: plain damage, no effect.
    return state;
  }
}
