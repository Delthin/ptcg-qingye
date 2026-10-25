import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_ONTO_BENCH, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON } from '../../../game/store/prefabs/costs';

export class Bombirdier extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [D];
  public hp: number = 120;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [{
    name: 'Delivery Pocket',
    cost: [C],
    damage: 0,
    text: 'Search your deck for a Basic Pokémon and put it onto your Bench. Then, shuffle your deck.',
  },
  {
    name: 'Dark Edge',
    cost: [D, D, C],
    damage: 120,
    text: 'Discard an Energy from this Pokémon.',
  }];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '147';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Bombirdier';
  public fullName: string = 'Bombirdier PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Delivery Pocket: search a Basic Pokémon from the deck and put it onto the Bench, then shuffle.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      if (player.deck.cards.length === 0) {
        return state;
      }

      state = SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_ONTO_BENCH(store, state, player, { stage: Stage.BASIC });
    }

    // Dark Edge: discard an Energy from this Pokémon.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON(store, state, effect, 1, {}, 1);
    }

    return state;
  }
}
