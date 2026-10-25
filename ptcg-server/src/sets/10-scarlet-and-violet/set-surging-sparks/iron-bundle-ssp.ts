import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckRetreatCostEffect } from '../../../game/store/effects/check-effects';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class IronBundle extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 100;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [{
    name: 'Gusting Collision',
    cost: [W, W, C],
    damage: 200,
    text: 'This attack does 50 less damage for each Colorless in your opponent\'s Active Pokémon\'s Retreat Cost.',
  }];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '55';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Iron Bundle';
  public fullName: string = 'Iron Bundle SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;

      const retreatCost = new CheckRetreatCostEffect(opponent);
      state = store.reduceEffect(state, retreatCost);

      const colorlessCount = retreatCost.cost.filter(c => c === CardType.COLORLESS).length;

      effect.damage = Math.max(0, effect.damage - 50 * colorlessCount);
    }
    return state;
  }
}
