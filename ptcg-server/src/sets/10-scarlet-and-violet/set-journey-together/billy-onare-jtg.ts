import { TrainerCard } from '../../../game/store/card/trainer-card';
import { TrainerType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DRAW_CARDS } from '../../../game/store/prefabs/prefabs';
import { CLEAN_UP_SUPPORTER, WAS_TRAINER_USED } from '../../../game/store/prefabs/trainer-prefabs';

export class BillyONare extends TrainerCard {
  public trainerType = TrainerType.SUPPORTER;

  public regulationMark = 'H';
  public set: string = 'JTG';
  public setNumber: string = '142';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Billy & O\'Nare';
  public fullName: string = 'Billy & O\'Nare JTG';

  public text: string = 'Draw 2 cards. Then, if you have 10 or more cards in your hand, draw 2 more cards.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_TRAINER_USED(effect, this)) {
      const player = effect.player;

      CLEAN_UP_SUPPORTER(store, effect, player);

      state = DRAW_CARDS(store, state, player, 2);

      if (player.hand.cards.length >= 10) {
        state = DRAW_CARDS(store, state, player, 2);
      }
    }

    return state;
  }
}
