import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { ChooseCardsPrompt, GameMessage, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  COIN_FLIP_PROMPT, MOVE_CARDS, SEARCH_DECK_FOR_CARDS_TO_HAND, WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Slowpoke extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 80;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Tail-Fishing',
      cost: [P],
      damage: 0,
      text: 'Flip a coin. If heads, search your deck for a card and put it into your hand. Then, shuffle your deck. If tails, discard a card from your hand.',
    },
    {
      name: 'Zen Headbutt',
      cost: [P, P],
      damage: 30,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '85';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Slowpoke';
  public fullName: string = 'Slowpoke PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      return COIN_FLIP_PROMPT(store, state, player, result => {
        if (result) {
          // Heads: search your deck for a card, put it into your hand, then shuffle.
          if (player.deck.cards.length === 0) {
            return;
          }
          SEARCH_DECK_FOR_CARDS_TO_HAND(
            store, state, player, this, {}, { min: 1, max: 1, allowCancel: false }
          );
          return;
        }

        // Tails: discard a card from your hand.
        if (player.hand.cards.length === 0) {
          return;
        }

        store.prompt(
          state,
          new ChooseCardsPrompt(
            player,
            GameMessage.CHOOSE_CARD_TO_DISCARD,
            player.hand,
            {},
            { min: 1, max: 1, allowCancel: false }
          ),
          cards => {
            const selected = cards ?? [];
            if (selected.length === 0) {
              return;
            }
            MOVE_CARDS(store, state, player.hand, player.discard, { cards: selected });
          }
        );
      });
    }

    return state;
  }
}
