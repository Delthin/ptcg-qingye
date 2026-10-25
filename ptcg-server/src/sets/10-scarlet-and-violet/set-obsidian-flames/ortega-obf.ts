import { GameMessage, State, StateUtils, StoreLike, TrainerCard, TrainerType } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ChooseCardsPrompt } from '../../../game/store/prompts/choose-cards-prompt';
import {
  CONFIRMATION_PROMPT,
  DRAW_CARDS,
  MOVE_CARDS,
  SHOW_CARDS_TO_PLAYER,
} from '../../../game/store/prefabs/prefabs';
import { CLEAN_UP_SUPPORTER, WAS_TRAINER_USED } from '../../../game/store/prefabs/trainer-prefabs';

export class Ortega extends TrainerCard {
  public trainerType = TrainerType.SUPPORTER;

  public regulationMark = 'G';

  public set: string = 'OBF';

  public setNumber: string = '190';

  public cardImage: string = 'assets/cardback.png';

  public name: string = 'Ortega';

  public fullName: string = 'Ortega OBF';

  public text: string =
    'Your opponent reveals their hand, and you choose a card you find there and put it on the bottom of their deck. If you put a card on the bottom of your opponent\'s deck in this way, your opponent may draw a card.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_TRAINER_USED(effect, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      if (opponent.hand.cards.length === 0) {
        CLEAN_UP_SUPPORTER(store, effect, player);
        return state;
      }

      // Your opponent reveals their hand (shown to the player who used Ortega).
      state = SHOW_CARDS_TO_PLAYER(store, state, player, opponent.hand.cards);

      const prompt = new ChooseCardsPrompt(
        player,
        GameMessage.CHOOSE_CARD_TO_DECK,
        opponent.hand,
        {},
        { min: 1, max: 1, allowCancel: false }
      );

      state = store.prompt(state, prompt, chosenCards => {
        const cards = chosenCards ?? [];

        if (cards.length === 0) {
          return;
        }

        // Put the chosen card on the bottom of your opponent's deck.
        state = MOVE_CARDS(store, state, opponent.hand, opponent.deck, { cards, toBottom: true });

        // That player may draw a card.
        CONFIRMATION_PROMPT(store, state, opponent, result => {
          if (result) {
            DRAW_CARDS(store, state, opponent, 1);
          }
        });
      }) ?? state;

      CLEAN_UP_SUPPORTER(store, effect, player);
    }

    return state;
  }
}
