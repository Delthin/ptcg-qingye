import { TrainerCard, TrainerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SEARCH_DISCARD_PILE_FOR_CARDS_TO_HAND } from '../../../game/store/prefabs/prefabs';
import { WAS_TRAINER_USED } from '../../../game/store/prefabs/trainer-prefabs';

export class NemonasBackpack extends TrainerCard {
  public trainerType = TrainerType.ITEM;

  public regulationMark = 'G';

  public set: string = 'PAF';

  public setNumber: string = '83';

  public cardImage: string = 'assets/cardback.png';

  public name: string = 'Nemona\'s Backpack';

  public fullName: string = 'Nemona\'s Backpack PAF';

  public text: string =
    'Put up to 2 Nemona cards from your discard pile into your hand.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_TRAINER_USED(effect, this)) {
      const player = effect.player;
      SEARCH_DISCARD_PILE_FOR_CARDS_TO_HAND(
        store,
        state,
        player,
        this,
        { name: 'Nemona' },
        { min: 0, max: 2 },
      );
    }
    return state;
  }
}
