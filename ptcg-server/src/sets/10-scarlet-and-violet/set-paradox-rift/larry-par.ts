import { TrainerCard, TrainerType, State, StoreLike } from '../../../game';
import { Stage } from '../../../game/store/card/card-types';
import { Effect } from '../../../game/store/effects/effect';
import { COIN_FLIP_PROMPT, SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_INTO_HAND } from '../../../game/store/prefabs/prefabs';
import { CLEAN_UP_SUPPORTER, WAS_TRAINER_USED } from '../../../game/store/prefabs/trainer-prefabs';

export class Larry extends TrainerCard {
  public trainerType = TrainerType.SUPPORTER;

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '165';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Larry';
  public fullName: string = 'Larry PAR';

  public text: string =
    'Flip a coin. If heads, search your deck for up to 2 Pokémon, reveal them, and put them into your hand. If tails, search your deck for a Basic Pokémon, reveal it, and put it into your hand. Then, shuffle your deck.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_TRAINER_USED(effect, this)) {
      const player = effect.player;

      CLEAN_UP_SUPPORTER(store, effect, player);

      return COIN_FLIP_PROMPT(store, state, player, result => {
        if (result) {
          state = SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_INTO_HAND(
            store, state, player, {}, { min: 0, max: 2 });
        } else {
          state = SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_INTO_HAND(
            store, state, player, { stage: Stage.BASIC }, { min: 0, max: 1 });
        }
      });
    }

    return state;
  }
}
