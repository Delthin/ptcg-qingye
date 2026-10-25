import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, TrainerType } from '../../../game/store/card/card-types';
import { TrainerCard } from '../../../game/store/card/trainer-card';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import {
  PUT_X_CARDS_FROM_YOUR_DISCARD_PILE_INTO_YOUR_HAND,
  PUT_X_DAMAGE_COUNTERS_ON_YOUR_OPPONENTS_ACTIVE_POKEMON
} from '../../../game/store/prefabs/attack-effects';

export class Polteageist extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Sinistea';
  public cardType: CardType[] = [P];
  public hp: number = 70;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Antique Collecting',
      cost: [P],
      damage: 0,
      text: 'Put up to 2 in any combination of Item cards and Pokémon Tool cards from your discard pile into your hand.'
    },
    {
      name: 'Pour Tea',
      cost: [P],
      damage: 0,
      text: 'Put 5 damage counters on your opponent\'s Active Pokémon.'
    }
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '98';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Polteageist';
  public fullName: string = 'Polteageist OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      // Item cards and Pokemon Tool cards are both Trainer cards; the predicate
      // covers the "any combination" wording without an OR-capable filter.
      PUT_X_CARDS_FROM_YOUR_DISCARD_PILE_INTO_YOUR_HAND(
        2,
        card => card instanceof TrainerCard
          && (card.trainerType === TrainerType.ITEM || card.trainerType === TrainerType.TOOL),
        store,
        state,
        effect
      );
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      PUT_X_DAMAGE_COUNTERS_ON_YOUR_OPPONENTS_ACTIVE_POKEMON(5, store, state, effect);
    }

    return state;
  }
}
