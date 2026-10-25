import { TrainerCard } from '../../../game/store/card/trainer-card';
import { TrainerType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DRAW_CARDS } from '../../../game/store/prefabs/prefabs';
import { CLEAN_UP_SUPPORTER, WAS_TRAINER_USED } from '../../../game/store/prefabs/trainer-prefabs';

export class Urbain extends TrainerCard {
  public trainerType = TrainerType.SUPPORTER;
  public regulationMark = 'J';
  public set: string = 'ASC';
  public setNumber: string = '214';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Urbain';
  public fullName: string = 'Urbain ASC';

  public text: string = 'Draw 3 cards.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_TRAINER_USED(effect, this)) {
      const player = effect.player;

      state = DRAW_CARDS(store, state, player, 3);
      CLEAN_UP_SUPPORTER(store, effect, player);
    }

    return state;
  }
}
