import { TrainerCard, TrainerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { LOOK_AT_TOPDECK_AND_DISCARD_OR_RETURN } from '../../../game/store/prefabs/prefabs';
import { WAS_TRAINER_USED } from '../../../game/store/prefabs/trainer-prefabs';

export class Raifort extends TrainerCard {
  public trainerType = TrainerType.SUPPORTER;

  public regulationMark = 'G';
  public set: string = 'TWM';
  public setNumber: string = '161';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Raifort';
  public fullName: string = 'Raifort TWM';

  public text: string =
    'Look at the top 5 cards of your deck and discard any number of them. ' +
    'Put the other cards back in any order.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_TRAINER_USED(effect, this)) {
      const player = effect.player;

      LOOK_AT_TOPDECK_AND_DISCARD_OR_RETURN(store, state, player, player);
    }
    return state;
  }
}
