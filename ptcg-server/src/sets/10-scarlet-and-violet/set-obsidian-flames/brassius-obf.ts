import { TrainerCard } from '../../../game/store/card/trainer-card';
import { TrainerType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SHUFFLE_HAND_INTO_DECK_THEN_DRAW } from '../../../game/store/prefabs/prefabs';
import { CLEAN_UP_SUPPORTER, WAS_TRAINER_USED } from '../../../game/store/prefabs/trainer-prefabs';

export class Brassius extends TrainerCard {
  public trainerType = TrainerType.SUPPORTER;

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '187';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Brassius';
  public fullName: string = 'Brassius OBF';

  public text: string =
    'Count the cards in your hand, shuffle those cards into your deck, then draw that many cards plus 1.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_TRAINER_USED(effect, this)) {
      const player = effect.player;

      // Count the cards in hand (the played Supporter itself is not counted).
      const cardsToShuffle = player.hand.cards.filter(card => card !== this);

      state = SHUFFLE_HAND_INTO_DECK_THEN_DRAW(store, state, player, {
        cards: cardsToShuffle,
        drawCount: cardsToShuffle.length + 1,
        sourceCard: this,
      });

      CLEAN_UP_SUPPORTER(store, effect, player);
    }
    return state;
  }
}
