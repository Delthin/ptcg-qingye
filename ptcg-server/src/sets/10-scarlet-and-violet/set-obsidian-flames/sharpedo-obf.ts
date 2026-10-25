import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckRetreatCostEffect } from '../../../game/store/effects/check-effects';
import { THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Sharpedo extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Carvanha';
  public cardType: CardType[] = [W];
  public hp: number = 120;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Aqua Impact',
      cost: [W],
      damage: 10,
      damageCalculation: '+',
      text: 'This attack does 30 more damage for each Colorless in your opponent\'s Active Pokémon\'s Retreat Cost.'
    },
    {
      name: 'Jet Headbutt',
      cost: [W, W],
      damage: 60,
      text: ''
    }
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '47';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Sharpedo';
  public fullName: string = 'Sharpedo OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;

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
