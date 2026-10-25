import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { GameMessage, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  CONFIRMATION_PROMPT,
  MOVE_CARDS,
  SHOW_CARDS_TO_PLAYER,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Chinchou extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [L];
  public hp: number = 60;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Shine On',
      cost: [C],
      damage: 0,
      text: 'Look at the top card of your deck. You may put that card on the bottom of your deck.',
    },
    {
      name: 'Tiny Charge',
      cost: [L, C],
      damage: 20,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAF';
  public setNumber: string = '20';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Chinchou';
  public fullName: string = 'Chinchou PAF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      if (player.deck.cards.length === 0) {
        return state;
      }

      const topCard = player.deck.cards[0];

      // Look at the top card of your deck.
      state = SHOW_CARDS_TO_PLAYER(store, state, player, [topCard]);

      // You may put that card on the bottom of your deck.
      state = CONFIRMATION_PROMPT(store, state, player, result => {
        if (result) {
          state = MOVE_CARDS(store, state, player.deck, player.deck, {
            cards: [topCard],
            toBottom: true,
          });
        }
      }, GameMessage.CHOOSE_CARD_TO_DECK);

      return state;
    }

    return state;
  }
}
