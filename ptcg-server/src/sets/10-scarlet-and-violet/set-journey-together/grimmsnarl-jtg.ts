import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckRetreatCostEffect } from '../../../game/store/effects/check-effects';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Grimmsnarl extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Morgrem';
  public cardType: CardType[] = [P];
  public hp: number = 170;
  public weakness = [{ type: M }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Shadowy Knot',
      cost: [P],
      damage: 50,
      damageCalculation: 'x',
      text: 'This attack does 50 damage for each Colorless in your opponent\'s Active Pokémon\'s Retreat Cost.',
    },
    {
      name: 'Mega Punch',
      cost: [P, C],
      damage: 120,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'JTG';
  public setNumber: string = '73';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Grimmsnarl';
  public fullName: string = 'Grimmsnarl JTG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Shadowy Knot: 50 damage for each [C] in your opponent's Active Pokemon's Retreat Cost.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;

      const checkRetreatCost = new CheckRetreatCostEffect(opponent);
      state = store.reduceEffect(state, checkRetreatCost);

      const colorlessCount = checkRetreatCost.cost.filter(c => c === CardType.COLORLESS).length;
      effect.damage = 50 * colorlessCount;
    }
    return state;
  }
}
