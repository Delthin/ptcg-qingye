import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import { THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Lanturn extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Chinchou';
  public cardType: CardType[] = [L];
  public hp: number = 120;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Lightning Ball',
      cost: [C, C],
      damage: 50,
      text: '',
    },
    {
      name: 'Aqua Spark',
      cost: [L, L, C],
      damage: 80,
      damageCalculation: '+',
      text: 'If this Pokémon has any Water Energy attached, this attack does 120 more damage.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAF';
  public setNumber: string = '21';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Lanturn';
  public fullName: string = 'Lanturn PAF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const pokemon = player.active;

      const checkProvidedEnergy = new CheckProvidedEnergyEffect(player, pokemon);
      state = store.reduceEffect(state, checkProvidedEnergy);

      const hasWaterEnergy = checkProvidedEnergy.energyMap.some(energy =>
        energy.provides.includes(CardType.WATER),
      );

      if (hasWaterEnergy) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 120);
      }
    }

    return state;
  }
}
