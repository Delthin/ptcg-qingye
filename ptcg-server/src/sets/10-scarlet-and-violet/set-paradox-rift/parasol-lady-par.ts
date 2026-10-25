import { TrainerCard } from '../../../game/store/card/trainer-card';
import { TrainerType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SHUFFLE_HAND_INTO_DECK_THEN_DRAW } from '../../../game/store/prefabs/prefabs';
import { WAS_TRAINER_USED } from '../../../game/store/prefabs/trainer-prefabs';

export class ParasolLady extends TrainerCard {
  public trainerType = TrainerType.SUPPORTER;

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '169';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Parasol Lady';
  public fullName: string = 'Parasol Lady PAR';

  public text: string =
    'Shuffle your hand into your deck. Then, draw 4 cards. If you go second, and it\'s your first turn, draw 8 cards instead.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_TRAINER_USED(effect, this)) {
      const player = effect.player;

      // The player who goes second takes their first turn on turn 2.
      const drawCount = state.turn === 2 ? 8 : 4;

      state = SHUFFLE_HAND_INTO_DECK_THEN_DRAW(store, state, player, {
        sourceCard: this,
        excludeCard: this,
        drawCount: drawCount,
      });
    }

    return state;
  }
}
