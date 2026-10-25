import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { Card } from '../../../game/store/card/card';
import { CardList, ChooseCardsPrompt, GameMessage, Player, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SHOW_CARDS_TO_PLAYER, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class TeamRocketsDottler extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = "Team Rocket's Blipbug";
  public cardType: CardType[] = [P];
  public hp: number = 80;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Disruptive Radar',
      cost: [C],
      damage: 0,
      text: "Look at the top 5 cards of your opponent's deck and put them back in any order."
    },
    {
      name: 'Super Psy Bolt',
      cost: [P, C],
      damage: 30,
      text: ''
    }
  ];

  public regulationMark = 'I';
  public set: string = 'DRI';
  public setNumber: string = '88';
  public cardImage: string = 'assets/cardback.png';
  public name: string = "Team Rocket's Dottler";
  public fullName: string = "Team Rocket's Dottler DRI";

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Disruptive Radar: look at the top 5 cards of your opponent's deck and put them back in any order.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);
      const topCards = opponent.deck.cards.slice(0, 5);

      if (topCards.length === 0) {
        return state;
      }

      // Look at the top 5 cards of the opponent's deck.
      state = SHOW_CARDS_TO_PLAYER(store, state, player, topCards);

      // The top cards live in a temporary CardList so they can be picked one by one.
      const remaining = new CardList();
      remaining.cards = topCards.slice();
      const ordered: Card[] = [];

      state = this.orderCards(store, state, player, remaining, ordered, () => {
        opponent.deck.cards.splice(0, ordered.length, ...ordered);
      });
    }

    return state;
  }

  // The player picks the cards one at a time; the chosen order becomes the new order
  // from the top of the deck downwards.
  private orderCards(
    store: StoreLike,
    state: State,
    player: Player,
    remaining: CardList,
    ordered: Card[],
    onComplete: () => void
  ): State {
    if (remaining.cards.length === 0) {
      onComplete();
      return state;
    }

    const next = store.prompt(state, new ChooseCardsPrompt(
      player,
      GameMessage.CHOOSE_CARD_TO_DECK,
      remaining,
      {},
      { min: 1, max: 1, allowCancel: false }
    ), cards => {
      const chosen = cards?.length ? cards[0] : undefined;

      if (chosen === undefined) {
        // Nothing was chosen: keep the rest of the cards in their current order.
        ordered.push(...remaining.cards);
        remaining.cards = [];
      } else {
        const index = remaining.cards.indexOf(chosen);
        if (index !== -1) {
          remaining.cards.splice(index, 1);
          ordered.push(chosen);
        }
      }

      this.orderCards(store, state, player, remaining, ordered, onComplete);
    });

    return next ?? state;
  }
}
