import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import { THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Heatmor extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [R];
  public hp: number = 110;
  public weakness = [{ type: W }];
  public retreat = [C];

  public attacks = [{
    name: 'Energy Burner',
    cost: [R, R],
    damage: 30,
    damageCalculation: '+',
    text: 'This attack does 30 more damage for each Energy attached to your opponent\'s Active Pokémon.',
  }];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '39';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Heatmor';
  public fullName: string = 'Heatmor OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;

      const checkProvidedEnergy = new CheckProvidedEnergyEffect(opponent, opponent.active);
      state = store.reduceEffect(state, checkProvidedEnergy);

      const energyCount = checkProvidedEnergy.energyMap.length;

      if (energyCount > 0) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 30 * energyCount);
      }
    }
    return state;
  }
}
