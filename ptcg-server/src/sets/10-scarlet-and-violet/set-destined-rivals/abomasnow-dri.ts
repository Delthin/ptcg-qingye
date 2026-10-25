import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import { THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Abomasnow extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Snover';
  public cardType: CardType[] = [W];
  public hp: number = 150;
  public weakness = [{ type: M }];
  public retreat = [C, C, C, C];

  public attacks = [
    {
      name: 'Lunge Out',
      cost: [C, C, C],
      damage: 90,
      text: '',
    },
    {
      name: 'Frozen Wood',
      cost: [W, W, W, C],
      damage: 120,
      damageCalculation: '+',
      text: 'If this Pokémon has 2 or more Grass Energy attached, this attack does 120 more damage.',
    },
  ];

  public regulationMark = 'I';
  public set: string = 'DRI';
  public setNumber: string = '60';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Abomasnow';
  public fullName: string = 'Abomasnow DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;

      const checkProvidedEnergy = new CheckProvidedEnergyEffect(player, player.active);
      state = store.reduceEffect(state, checkProvidedEnergy);

      let grassEnergyCount = 0;
      checkProvidedEnergy.energyMap.forEach(energy => {
        if (energy.provides.includes(CardType.GRASS) || energy.provides.includes(CardType.ANY)) {
          grassEnergyCount += 1;
        }
      });

      if (grassEnergyCount >= 2) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 120);
      }
    }
    return state;
  }
}
