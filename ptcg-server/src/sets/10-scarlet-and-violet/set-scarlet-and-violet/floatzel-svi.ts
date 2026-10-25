import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import { THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Floatzel extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Buizel';
  public cardType: CardType[] = [W];
  public hp: number = 120;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [{
    name: 'Hydro Pump',
    cost: [C, C],
    damage: 50,
    damageCalculation: '+',
    text: 'This attack does 20 more damage for each Water Energy attached to this Pokémon.',
  }];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '47';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Floatzel';
  public fullName: string = 'Floatzel SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const pokemon = player.active;

      const checkProvidedEnergy = new CheckProvidedEnergyEffect(player, pokemon);
      state = store.reduceEffect(state, checkProvidedEnergy);

      let waterEnergy = 0;
      checkProvidedEnergy.energyMap.forEach(energy => {
        if (energy.provides.includes(CardType.WATER)) {
          waterEnergy += 1;
        }
      });

      if (waterEnergy > 0) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 20 * waterEnergy);
      }
    }

    return state;
  }
}
