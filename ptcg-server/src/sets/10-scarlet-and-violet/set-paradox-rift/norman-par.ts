import { TrainerCard } from '../../../game/store/card/trainer-card';
import { CardTag, TrainerType } from '../../../game/store/card/card-types';
import { State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DRAW_CARDS } from '../../../game/store/prefabs/prefabs';
import { CLEAN_UP_SUPPORTER, WAS_TRAINER_USED } from '../../../game/store/prefabs/trainer-prefabs';

export class Norman extends TrainerCard {
  public trainerType = TrainerType.SUPPORTER;

  public regulationMark = 'G';

  public set: string = 'PAR';

  public setNumber: string = '168';

  public cardImage: string = 'assets/cardback.png';

  public name: string = 'Norman';

  public fullName: string = 'Norman PAR';

  public text: string =
    'Draw 2 cards. If your opponent\'s Active Pokémon is a Pokémon ex, draw 2 more cards.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_TRAINER_USED(effect, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      state = DRAW_CARDS(store, state, player, 2);

      const opponentActive = opponent.active.getPokemonCard();
      if (opponentActive !== undefined && opponentActive.tags.includes(CardTag.POKEMON_ex)) {
        state = DRAW_CARDS(store, state, player, 2);
      }

      CLEAN_UP_SUPPORTER(store, effect, player);
    }
    return state;
  }
}
