import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckRetreatCostEffect } from '../../../game/store/effects/check-effects';
import { THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Talonflame extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Fletchinder';
  public cardType: CardType[] = [C];
  public hp: number = 140;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat: CardType[] = [];

  public attacks = [{
    name: 'Aero Chase',
    cost: [C, C],
    damage: 110,
    damageCalculation: '+',
    text: 'If the Retreat Cost of your opponent\'s Active Pokémon is [C][C] or more, this attack does 110 more damage.',
  }];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '123';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Talonflame';
  public fullName: string = 'Talonflame SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;

      const checkRetreatCost = new CheckRetreatCostEffect(opponent);
      state = store.reduceEffect(state, checkRetreatCost);

      if (checkRetreatCost.cost.length >= 2) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 110);
      }
    }
    return state;
  }
}
