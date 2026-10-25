import { TrainerCard } from '../../../game/store/card/trainer-card';
import { EnergyCard } from '../../../game/store/card/energy-card';
import { EnergyType, SuperType, TrainerType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DRAW_CARDS, SEARCH_DISCARD_PILE_FOR_CARDS_TO_HAND } from '../../../game/store/prefabs/prefabs';
import { CLEAN_UP_SUPPORTER, WAS_TRAINER_USED } from '../../../game/store/prefabs/trainer-prefabs';

export class Roark extends TrainerCard {
  public trainerType: TrainerType = TrainerType.SUPPORTER;

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '173';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Roark';
  public fullName: string = 'Roark PAR';

  public text: string =
    'Draw 2 cards. Put a Basic Energy card from your discard pile into your hand.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_TRAINER_USED(effect, this)) {
      const player = effect.player;

      state = DRAW_CARDS(store, state, player, 2);

      const hasBasicEnergyInDiscard = player.discard.cards.some(
        card => card instanceof EnergyCard && card.energyType === EnergyType.BASIC,
      );

      if (hasBasicEnergyInDiscard) {
        const basicEnergy: Partial<EnergyCard> = {
          superType: SuperType.ENERGY,
          energyType: EnergyType.BASIC,
        };

        // The search helper either returns the updated State or updates it in place.
        const searchState = SEARCH_DISCARD_PILE_FOR_CARDS_TO_HAND(
          store,
          state,
          player,
          this,
          basicEnergy,
          { min: 1, max: 1, allowCancel: false },
        ) as unknown as State | undefined;

        state = searchState ?? state;
      }

      CLEAN_UP_SUPPORTER(store, effect, player);
    }

    return state;
  }
}
