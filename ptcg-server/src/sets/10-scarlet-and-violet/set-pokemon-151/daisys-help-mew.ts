import { TrainerCard, TrainerType, State, StoreLike } from '../../../game';
import { Card } from '../../../game/store/card/card';
import { Effect } from '../../../game/store/effects/effect';
import { DRAW_CARDS, SHOW_CARDS_TO_PLAYER } from '../../../game/store/prefabs/prefabs';
import { WAS_TRAINER_USED } from '../../../game/store/prefabs/trainer-prefabs';

export class DaisysHelp extends TrainerCard {
  public trainerType = TrainerType.SUPPORTER;

  public regulationMark = 'G';

  public set: string = 'MEW';

  public setNumber: string = '158';

  public cardImage: string = 'assets/cardback.png';

  public name: string = 'Daisy\'s Help';

  public fullName: string = 'Daisy\'s Help MEW';

  public text: string =
    'Draw 2 cards. Look at your face-down Prize cards.\n\n' +
    'You may play only 1 Supporter card during your turn.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_TRAINER_USED(effect, this)) {
      const player = effect.player;

      state = DRAW_CARDS(store, state, player, 2);

      const prizeCards: Card[] = [];
      player.prizes.forEach(prize => {
        prize.cards.forEach(card => prizeCards.push(card));
      });

      if (prizeCards.length > 0) {
        state = SHOW_CARDS_TO_PLAYER(store, state, player, prizeCards);
      }
    }

    return state;
  }
}
