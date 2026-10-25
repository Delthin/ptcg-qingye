import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  CONFIRMATION_PROMPT, SHOW_CARDS_TO_PLAYER, SHUFFLE_DECK, WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Inkay extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [D];
  public hp: number = 60;
  public weakness = [{ type: G }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Mischievous Tentacles',
      cost: [C],
      damage: 0,
      text: 'Look at the top card of your opponent\'s deck. You may have your opponent shuffle their deck.',
    },
    {
      name: 'Peck',
      cost: [D],
      damage: 10,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SFA';
  public setNumber: string = '33';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Inkay';
  public fullName: string = 'Inkay SFA';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      if (opponent.deck.cards.length === 0) {
        return state;
      }

      // Look at the top card of your opponent's deck (it stays in place).
      state = SHOW_CARDS_TO_PLAYER(store, state, player, [opponent.deck.cards[0]]);

      // You may have your opponent shuffle their deck.
      state = CONFIRMATION_PROMPT(store, state, player, (result) => {
        if (result) {
          state = SHUFFLE_DECK(store, state, opponent);
        }
      });
    }

    return state;
  }
}
