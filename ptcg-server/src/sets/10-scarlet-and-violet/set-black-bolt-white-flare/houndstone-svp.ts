import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { TrainerCard } from '../../../game/store/card/trainer-card';
import { Stage, CardType, SuperType, TrainerType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SEARCH_DISCARD_PILE_FOR_CARDS_TO_HAND, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Houndstone extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Greavard';
  public cardType: CardType[] = [P];
  public hp: number = 130;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Delve',
      cost: [C, C],
      damage: 0,
      text: 'Put up to 2 Item cards from your discard pile into your hand.',
    },
    {
      name: 'Spooky Shot',
      cost: [P, C, C],
      damage: 100,
      text: '',
    }
  ];

  public regulationMark = 'G';
  public set: string = 'SVP';
  public setNumber: string = '42';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Houndstone';
  public fullName: string = 'Houndstone SVP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      const hasItemCard = player.discard.cards.some(
        card => card instanceof TrainerCard && card.trainerType === TrainerType.ITEM
      );

      if (!hasItemCard) {
        return state;
      }

      const itemCardFilter = { superType: SuperType.TRAINER, trainerType: TrainerType.ITEM };

      SEARCH_DISCARD_PILE_FOR_CARDS_TO_HAND(
        store, state, player, this, itemCardFilter,
        { min: 0, max: 2, allowCancel: false }
      );
    }
    return state;
  }
}
