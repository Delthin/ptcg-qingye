import { TrainerCard, TrainerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  COIN_FLIP_PROMPT,
  SWITCH_ACTIVE_WITH_BENCHED,
  SWITCH_IN_OPPONENT_BENCHED_POKEMON,
} from '../../../game/store/prefabs/prefabs';
import { CLEAN_UP_SUPPORTER, WAS_TRAINER_USED } from '../../../game/store/prefabs/trainer-prefabs';

export class Shauntal extends TrainerCard {
  public trainerType = TrainerType.SUPPORTER;

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '174';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Shauntal';
  public fullName: string = 'Shauntal PAR';

  public text: string =
    'Flip a coin. If heads, switch in 1 of your opponent\'s Benched Pokémon to the Active Spot. ' +
    'If tails, switch your Active Pokémon with 1 of your Benched Pokémon.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_TRAINER_USED(effect, this)) {
      const player = effect.player;

      CLEAN_UP_SUPPORTER(store, effect, player);

      state = COIN_FLIP_PROMPT(store, state, player, result => {
        if (result) {
          state = SWITCH_IN_OPPONENT_BENCHED_POKEMON(store, state, player, {});
        } else {
          SWITCH_ACTIVE_WITH_BENCHED(store, state, player);
        }
      });
    }

    return state;
  }
}
