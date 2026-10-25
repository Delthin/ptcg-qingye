import { TrainerCard } from '../../../game/store/card/trainer-card';
import { TrainerType } from '../../../game/store/card/card-types';
import { State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { COIN_FLIP_PROMPT, DRAW_CARDS, MOVE_CARDS } from '../../../game/store/prefabs/prefabs';
import { CLEAN_UP_SUPPORTER, WAS_TRAINER_USED } from '../../../game/store/prefabs/trainer-prefabs';

export class Lucian extends TrainerCard {
  public trainerType = TrainerType.SUPPORTER;

  public regulationMark = 'H';

  public set: string = 'TWM';

  public cardImage: string = 'assets/cardback.png';

  public setNumber: string = '157';

  public name: string = 'Lucian';

  public fullName: string = 'Lucian TWM';

  public text: string =
    'Each player shuffles their hand and puts it on the bottom of their deck. ' +
    'If either player put any cards on the bottom of their deck in this way, each player flips a coin. ' +
    'If heads, that player draws 6 cards. If tails, they draw 3 cards.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_TRAINER_USED(effect, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      let anyCardsPutOnBottom = false;

      for (const p of [player, opponent]) {
        if (p.hand.cards.length === 0) {
          continue;
        }
        anyCardsPutOnBottom = true;
        state = MOVE_CARDS(store, state, p.hand, p.deck, {
          cards: p.hand.cards.slice(),
          toBottom: true,
          sourceCard: this,
          sourceEffect: effect,
        });
      }

      if (anyCardsPutOnBottom) {
        state = COIN_FLIP_PROMPT(store, state, player, result => {
          state = DRAW_CARDS(store, state, player, result ? 6 : 3);

          state = COIN_FLIP_PROMPT(store, state, opponent, opponentResult => {
            state = DRAW_CARDS(store, state, opponent, opponentResult ? 6 : 3);
          });
        });
      }

      CLEAN_UP_SUPPORTER(store, effect, player);
    }

    return state;
  }
}
