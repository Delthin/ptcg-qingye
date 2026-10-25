import { TrainerCard } from '../../../game/store/card/trainer-card';
import { TrainerType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_TRAINER_USED } from '../../../game/store/prefabs/trainer-prefabs';
import { LOOK_AT_TOP_X_CARDS_AND_PUT_UP_TO_Y_MATCHING_CARDS_INTO_HAND } from '../../../game/store/prefabs/prefabs';

export class Rika extends TrainerCard {
  public trainerType = TrainerType.SUPPORTER;

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '172';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Rika';
  public fullName: string = 'Rika PAR';

  public text: string =
    'Look at the top 4 cards of your deck and put 2 of them into your hand. Shuffle the other cards and put them on the bottom of your deck.\n\n' +
    'You may play only 1 Supporter card during your turn.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_TRAINER_USED(effect, this)) {
      const player = effect.player;

      return LOOK_AT_TOP_X_CARDS_AND_PUT_UP_TO_Y_MATCHING_CARDS_INTO_HAND(store, state, player, 4, 2);
    }

    return state;
  }
}
