import { TrainerCard, TrainerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_TRAINER_USED } from '../../../game/store/prefabs/trainer-prefabs';
import { CONFIRMATION_PROMPT, MOVE_CARDS, SELECT_PROMPT, SHOW_CARDS_TO_PLAYER } from '../../../game/store/prefabs/prefabs';

export class TeamRocketsBotherBot extends TrainerCard {
  public trainerType = TrainerType.ITEM;

  public regulationMark = 'I';

  public set: string = 'DRI';

  public setNumber: string = '172';

  public cardImage: string = 'assets/cardback.png';

  public name: string = 'Team Rocket\'s Bother-Bot';

  public fullName: string = 'Team Rocket\'s Bother-Bot DRI';

  public text: string =
    'Turn 1 of your opponent\'s face-down Prize cards face up and choose a random card from your opponent\'s hand. ' +
    'Your opponent reveals that card. You may have your opponent switch those cards. ' +
    '(That Prize card remains face up for the rest of the game.)\n' +
    'You may play any number of Item cards during your turn.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_TRAINER_USED(effect, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      const faceDownPrizes = opponent.prizes.filter(prize => prize.cards.length > 0 && prize.isSecret);

      if (faceDownPrizes.length === 0) {
        return state;
      }

      const values = faceDownPrizes.map((_, index) => `Your opponent's face-down Prize card #${index + 1}`);

      return SELECT_PROMPT(store, state, player, values, choice => {
        const prizeSlot = faceDownPrizes[choice];

        if (prizeSlot === undefined || prizeSlot.cards.length === 0) {
          return;
        }

        const prizeCard = prizeSlot.cards[0];

        // Turn 1 of your opponent's face-down Prize cards face up.
        // (That Prize card remains face up for the rest of the game.)
        prizeSlot.isSecret = false;
        state = SHOW_CARDS_TO_PLAYER(store, state, player, [prizeCard]);

        if (opponent.hand.cards.length === 0) {
          return;
        }

        // Choose a random card from your opponent's hand. Your opponent reveals that card.
        const handCard = opponent.hand.cards[Math.floor(Math.random() * opponent.hand.cards.length)];
        state = SHOW_CARDS_TO_PLAYER(store, state, opponent, [handCard]);
        state = SHOW_CARDS_TO_PLAYER(store, state, player, [handCard]);

        // You may have your opponent switch those cards.
        state = CONFIRMATION_PROMPT(store, state, player, result => {
          if (!result) {
            return;
          }

          state = MOVE_CARDS(store, state, prizeSlot, opponent.hand, { cards: [prizeCard] });
          state = MOVE_CARDS(store, state, opponent.hand, prizeSlot, { cards: [handCard] });

          // The card coming from the hand becomes the new face-down Prize card.
          prizeSlot.isSecret = true;
        });
      });
    }

    return state;
  }
}
