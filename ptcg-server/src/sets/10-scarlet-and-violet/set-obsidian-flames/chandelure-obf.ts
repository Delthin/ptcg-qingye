import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import { THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Chandelure extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Lampent';
  public cardType: CardType[] = [R];
  public hp: number = 150;
  public weakness = [{ type: W }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Combustion Chain',
      cost: [R],
      damage: 10,
      damageCalculation: '+',
      text: 'This attack does 50 more damage for each Energy attached to your opponent\'s Active Pokémon.',
    },
    {
      name: 'Heat Blast',
      cost: [R, C, C],
      damage: 150,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '38';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Chandelure';
  public fullName: string = 'Chandelure OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      if (opponent.active.cards.length === 0) {
        return state;
      }

      const checkProvidedEnergy = new CheckProvidedEnergyEffect(opponent, opponent.active);
      state = store.reduceEffect(state, checkProvidedEnergy);

      const attachedEnergyCount = checkProvidedEnergy.energyMap.length;

      if (attachedEnergyCount > 0) {
        state = THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 50 * attachedEnergyCount);
      }
    }

    return state;
  }
}
