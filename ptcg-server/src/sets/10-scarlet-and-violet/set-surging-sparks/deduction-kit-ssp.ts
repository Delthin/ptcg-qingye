import { TrainerCard } from '../../../game/store/card/trainer-card';
import { TrainerType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SELECT_PROMPT, SHOW_CARDS_TO_PLAYER } from '../../../game/store/prefabs/prefabs';
import { WAS_TRAINER_USED } from '../../../game/store/prefabs/trainer-prefabs';

export class DeductionKit extends TrainerCard {
  public trainerType = TrainerType.ITEM;

  public regulationMark = 'H';

  public set: string = 'SSP';

  public setNumber: string = '171';

  public cardImage: string = 'assets/cardback.png';

  public name: string = 'Deduction Kit';

  public fullName: string = 'Deduction Kit SSP';

  public text: string =
    'Look at the top 3 cards of your deck and put them back in any order, or ' +
    'shuffle them and put them on the bottom of your deck.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_TRAINER_USED(effect, this)) {
      const player = effect.player;

      if (player.deck.cards.length === 0) {
        return state;
      }

      const count = Math.min(3, player.deck.cards.length);
      const revealed = player.deck.cards.slice(0, count);

      state = SHOW_CARDS_TO_PLAYER(store, state, player, revealed);

      state = SELECT_PROMPT(
        store,
        state,
        player,
        [
          'Put them back in any order',
          'Shuffle them and put them on the bottom of your deck'
        ],
        result => {
          if (result === 1) {
            // Put the revealed cards on the bottom of the deck, in a shuffled order.
            const returned = player.deck.cards.splice(0, count);
            const bottom: typeof returned = [];
            while (returned.length > 0) {
              const index = Math.floor(Math.random() * returned.length);
              returned.splice(index, 1).forEach(card => bottom.push(card));
            }
            bottom.forEach(card => player.deck.cards.push(card));
            return;
          }

          // Put them back on top of the deck in the order chosen by the player:
          // one prompt per position, starting with the card that goes on top.
          const remaining = revealed.slice();

          const placeCard = (position: number): void => {
            if (remaining.length <= 1) {
              return;
            }

            state = SELECT_PROMPT(
              store,
              state,
              player,
              remaining.map(card => card.name),
              choice => {
                const index = choice >= 0 && choice < remaining.length ? choice : 0;
                remaining.splice(index, 1).forEach(card => {
                  const currentIndex = player.deck.cards.indexOf(card);
                  if (currentIndex !== -1 && currentIndex !== position) {
                    player.deck.cards.splice(currentIndex, 1);
                    player.deck.cards.splice(position, 0, card);
                  }
                });
                placeCard(position + 1);
              });
          };

          placeCard(0);
        });

      return state;
    }

    return state;
  }
}
