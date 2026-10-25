import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { TrainerCard } from '../../../game/store/card/trainer-card';
import { CardType, Stage, SuperType, TrainerType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SEARCH_DISCARD_PILE_FOR_CARDS_TO_HAND, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Audino extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 110;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Beckon',
      cost: [C],
      damage: 0,
      text: 'Put a Supporter card from your discard pile into your hand.',
    },
    {
      name: 'Zen Headbutt',
      cost: [C, C, C],
      damage: 70,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'JTG';
  public setNumber: string = '124';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Audino';
  public fullName: string = 'Audino JTG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      // Beckon: Put a Supporter card from your discard pile into your hand.
      const supporterFilter = { superType: SuperType.TRAINER, trainerType: TrainerType.SUPPORTER };
      const hasSupporterInDiscard = player.discard.cards.some(card =>
        card instanceof TrainerCard && card.trainerType === TrainerType.SUPPORTER);

      if (!hasSupporterInDiscard) {
        return state;
      }

      SEARCH_DISCARD_PILE_FOR_CARDS_TO_HAND(
        store, state, player, this, supporterFilter, { min: 1, max: 1, allowCancel: false });
    }

    return state;
  }
}
