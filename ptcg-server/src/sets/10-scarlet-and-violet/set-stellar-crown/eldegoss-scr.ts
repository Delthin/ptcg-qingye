import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { MOVE_CARDS, SEARCH_DECK_FOR_CARDS_TO_HAND, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Eldegoss extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Gossifleur';
  public cardType: CardType[] = [G];
  public hp: number = 90;
  public weakness = [{ type: R }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Breezy Gift',
      cost: [C],
      damage: 0,
      text: 'Put this Pokémon and all attached cards into your deck. If you do, search your deck for up to 3 cards and put them into your hand. Then, shuffle your deck.'
    },
    {
      name: 'Leafage',
      cost: [G],
      damage: 50,
      text: ''
    }
  ];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '11';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Eldegoss';
  public fullName: string = 'Eldegoss SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      // Put this Pokémon and all attached cards into your deck.
      state = MOVE_CARDS(store, state, player.active, player.deck, {
        sourceCard: this,
        sourceEffect: effect
      });

      // If you do, search your deck for up to 3 cards and put them into your hand, then shuffle.
      SEARCH_DECK_FOR_CARDS_TO_HAND(store, state, player, this, {}, { min: 0, max: 3 }, effect);
    }

    return state;
  }
}
