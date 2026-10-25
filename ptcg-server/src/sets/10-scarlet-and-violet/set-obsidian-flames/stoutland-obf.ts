import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckRetreatCostEffect } from '../../../game/store/effects/check-effects';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Stoutland extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Herdier';
  public cardType: CardType[] = [C];
  public hp: number = 160;
  public weakness = [{ type: F }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Chomp Chomp Panic',
      cost: [C],
      damage: 50,
      damageCalculation: 'x',
      text: 'This attack does 50 damage for each Colorless in your opponent\'s Active Pokémon\'s Retreat Cost.',
    },
    {
      name: 'Sharp Fang',
      cost: [C, C, C],
      damage: 140,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '172';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Stoutland';
  public fullName: string = 'Stoutland OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;

      const checkRetreatCost = new CheckRetreatCostEffect(opponent);
      state = store.reduceEffect(state, checkRetreatCost);

      // Retreat Cost is always made up of Colorless Energy, so the number of
      // entries equals the number of Colorless in the Retreat Cost.
      effect.damage = 50 * checkRetreatCost.cost.length;
    }

    return state;
  }
}
