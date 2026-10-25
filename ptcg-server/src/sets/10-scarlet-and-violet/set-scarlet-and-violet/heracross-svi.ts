import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckRetreatCostEffect } from '../../../game/store/effects/check-effects';
import {
  THIS_ATTACK_DOES_X_MORE_DAMAGE,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Heracross extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [CardType.GRASS];
  public hp: number = 120;
  public weakness = [{ type: CardType.FIRE }];
  public retreat = [CardType.COLORLESS, CardType.COLORLESS];

  public attacks = [
    {
      name: 'Superpowered Throw',
      cost: [CardType.GRASS, CardType.COLORLESS],
      damage: 10,
      damageCalculation: '+',
      text: 'This attack does 30 more damage for each Colorless in your opponent\'s Active Pokémon\'s Retreat Cost.',
    },
    {
      name: 'Horn Attack',
      cost: [CardType.GRASS, CardType.GRASS, CardType.COLORLESS],
      damage: 90,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '2';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Heracross';
  public fullName: string = 'Heracross SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;

      if (opponent.active.cards.length === 0) {
        return state;
      }

      const checkRetreatCost = new CheckRetreatCostEffect(opponent);
      state = store.reduceEffect(state, checkRetreatCost);

      const colorlessCount = checkRetreatCost.cost
        .filter(costType => costType === CardType.COLORLESS).length;

      if (colorlessCount > 0) {
        state = THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 30 * colorlessCount);
      }
    }
    return state;
  }
}
