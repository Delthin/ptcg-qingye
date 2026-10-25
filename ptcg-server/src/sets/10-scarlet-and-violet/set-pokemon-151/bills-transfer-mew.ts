import { TrainerCard, TrainerType, State, StoreLike } from '../../../game';
import { SuperType } from '../../../game/store/card/card-types';
import { Effect } from '../../../game/store/effects/effect';
import { LOOK_AT_TOP_X_CARDS_AND_PUT_UP_TO_Y_MATCHING_CARDS_INTO_HAND } from '../../../game/store/prefabs/prefabs';
import { WAS_TRAINER_USED } from '../../../game/store/prefabs/trainer-prefabs';

export class BillsTransfer extends TrainerCard {
  public trainerType = TrainerType.SUPPORTER;

  public regulationMark = 'G';

  public set: string = 'MEW';

  public setNumber: string = '156';

  public cardImage: string = 'assets/cardback.png';

  public name: string = 'Bill\'s Transfer';

  public fullName: string = 'Bill\'s Transfer MEW';

  public text: string =
    'Look at the top 8 cards of your deck. You may reveal any number of Pokémon you find there and put them into your hand. Shuffle the other cards back into your deck.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_TRAINER_USED(effect, this)) {
      const player = effect.player;

      return LOOK_AT_TOP_X_CARDS_AND_PUT_UP_TO_Y_MATCHING_CARDS_INTO_HAND(store, state, player, 8, 8, {
        filter: { superType: SuperType.POKEMON },
      });
    }

    return state;
  }
}
