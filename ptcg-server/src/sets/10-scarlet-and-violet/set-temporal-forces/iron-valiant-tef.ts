import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardTag, CardType, Stage } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  SHOW_CARDS_TO_PLAYER, THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class IronValiant extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 130;
  public weakness = [{ type: M }];
  public retreat = [C, C];
  protected _tags = [CardTag.FUTURE];

  public attacks = [
    {
      name: 'Calculation',
      cost: [P],
      damage: 0,
      text: 'Look at the top 4 cards of your deck and put them back in any order.',
    },
    {
      name: 'Majestic Sword',
      cost: [P, P, C],
      damage: 100,
      damageCalculation: '+',
      text: 'If you played a Future Supporter card from your hand during this turn, this attack does 100 more damage.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '80';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Iron Valiant';
  public fullName: string = 'Iron Valiant TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Calculation: look at the top 4 cards of your deck.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const topCards = player.deck.cards.slice(0, 4);

      if (topCards.length > 0) {
        state = SHOW_CARDS_TO_PLAYER(store, state, player, topCards);
      }
    }

    // Majestic Sword: +100 if a Future Supporter was played from hand this turn.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;

      const playedFutureSupporter = player.supporter.cards.some(card => {
        const tags = (card as unknown as { tags?: CardTag[] }).tags;
        return tags !== undefined && tags.includes(CardTag.FUTURE);
      });

      if (playedFutureSupporter) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 100);
      }
    }

    return state;
  }
}
