import { TrainerCard, TrainerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DRAW_CARDS } from '../../../game/store/prefabs/prefabs';
import { WAS_TRAINER_USED } from '../../../game/store/prefabs/trainer-prefabs';

export class FriendsInPaldea extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;

  public regulationMark = 'H';
  public set: string = 'PRE';
  public setNumber: string = '109';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Friends in Paldea';
  public fullName: string = 'Friends in Paldea PRE';

  public text: string =
    'Draw 3 cards.' +
    '\nYou may play only 1 Supporter card during your turn.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_TRAINER_USED(effect, this)) {
      const player = effect.player;

      state = DRAW_CARDS(store, state, player, 3);
    }
    return state;
  }
}
