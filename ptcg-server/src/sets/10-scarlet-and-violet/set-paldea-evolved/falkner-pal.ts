import { TrainerCard, TrainerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DRAW_CARDS } from '../../../game/store/prefabs/prefabs';
import { CLEAN_UP_SUPPORTER, WAS_TRAINER_USED } from '../../../game/store/prefabs/trainer-prefabs';

export class Falkner extends TrainerCard {
  public trainerType = TrainerType.SUPPORTER;

  public regulationMark = 'G';

  public set: string = 'PAL';

  public setNumber: string = '180';

  public cardImage: string = 'assets/cardback.png';

  public name: string = 'Falkner';

  public fullName: string = 'Falkner PAL';

  public text: string =
    'Draw 2 cards. If you have a Stadium in play, draw 2 more cards.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_TRAINER_USED(effect, this)) {
      const player = effect.player;

      CLEAN_UP_SUPPORTER(store, effect, player);

      const drawCount = player.stadium.cards.length > 0 ? 4 : 2;
      state = DRAW_CARDS(store, state, player, drawCount);
    }
    return state;
  }
}
