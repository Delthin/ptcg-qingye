import { State, StateUtils, StoreLike, TrainerCard, TrainerType } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_TRAINER_USED } from '../../../game/store/prefabs/trainer-prefabs';
import { GET_PLAYER_PRIZES, SHUFFLE_HAND_INTO_DECK_THEN_DRAW } from '../../../game/store/prefabs/prefabs';

export class N extends TrainerCard {
  public trainerType = TrainerType.SUPPORTER;

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '101';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'N';
  public fullName: string = 'N 30C';

  public text: string =
    'Each player shuffles his or her hand into his or her deck. Then, each player draws a card for each of his or her remaining Prize cards.\n' +
    'You may play only 1 Supporter card during your turn (before your attack).';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_TRAINER_USED(effect, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      const playerPrizes = GET_PLAYER_PRIZES(player).filter(slot => slot.cards.length > 0).length;
      const opponentPrizes = GET_PLAYER_PRIZES(opponent).filter(slot => slot.cards.length > 0).length;

      state = SHUFFLE_HAND_INTO_DECK_THEN_DRAW(store, state, player, {
        excludeCard: this,
        drawCount: playerPrizes,
        sourceCard: this,
      });

      state = SHUFFLE_HAND_INTO_DECK_THEN_DRAW(store, state, opponent, {
        drawCount: opponentPrizes,
        sourceCard: this,
      });
    }

    return state;
  }
}
