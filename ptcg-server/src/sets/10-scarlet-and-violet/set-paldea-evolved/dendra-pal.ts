import { TrainerCard, TrainerType, GameMessage, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ChooseCardsPrompt } from '../../../game/store/prompts/choose-cards-prompt';
import { DRAW_CARDS, MOVE_CARDS } from '../../../game/store/prefabs/prefabs';
import { CLEAN_UP_SUPPORTER, WAS_TRAINER_USED } from '../../../game/store/prefabs/trainer-prefabs';

export class Dendra extends TrainerCard {
  public trainerType = TrainerType.SUPPORTER;

  public regulationMark = 'G';

  public set: string = 'PAL';

  public setNumber: string = '179';

  public cardImage: string = 'assets/cardback.png';

  public name: string = 'Dendra';

  public fullName: string = 'Dendra PAL';

  public text: string =
    'Put a card from your hand on the bottom of your deck. If you do, draw cards until you have 5 cards in your hand. (If you have no other cards in your hand, you can\'t use this card.)';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_TRAINER_USED(effect, this)) {
      const player = effect.player;

      CLEAN_UP_SUPPORTER(store, effect, player);

      // "(If you have no other cards in your hand, you can't use this card.)"
      const otherCardsInHand = player.hand.cards.filter(card => card !== this);
      if (otherCardsInHand.length === 0) {
        return state;
      }

      const putCardOnBottom = (): void => {
        state = store.prompt(state, new ChooseCardsPrompt(
          player,
          GameMessage.CHOOSE_CARDS,
          player.hand,
          {},
          { min: 1, max: 1, allowCancel: false },
        ), chosen => {
          if (!chosen || chosen.length === 0) {
            return;
          }

          // The Supporter being played is not a legal choice.
          if (chosen[0] === this) {
            putCardOnBottom();
            return;
          }

          state = MOVE_CARDS(store, state, player.hand, player.deck, { cards: chosen, toBottom: true });

          // Only the cards that stay in hand after this Supporter goes to the
          // discard pile count towards the 5 cards in hand.
          const remainingHand = player.hand.cards.filter(card => card !== this).length;
          const drawCount = Math.max(0, 5 - remainingHand);
          if (drawCount > 0) {
            state = DRAW_CARDS(store, state, player, drawCount);
          }
        }) ?? state;
      };

      putCardOnBottom();
    }

    return state;
  }
}
