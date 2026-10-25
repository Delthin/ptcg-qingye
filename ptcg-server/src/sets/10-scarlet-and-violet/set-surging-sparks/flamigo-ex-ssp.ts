import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import {
  THIS_ATTACK_DOES_X_MORE_DAMAGE, THIS_POKEMON_DOES_DAMAGE_TO_ITSELF, WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Flamigoex extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 200;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];
  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Precise Beak',
      cost: [C, C],
      damage: 30,
      damageCalculation: '+',
      text: 'If this Pokémon and your opponent\'s Active Pokémon have the same amount of Energy attached, this attack does 100 more damage.'
    },
    {
      name: 'Brave Bird',
      cost: [C, C, C, C],
      damage: 200,
      text: 'This Pokémon also does 30 damage to itself.'
    }
  ];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '160';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Flamigo ex';
  public fullName: string = 'Flamigo ex SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = effect.opponent;

      const playerEnergy = new CheckProvidedEnergyEffect(player, player.active);
      state = store.reduceEffect(state, playerEnergy);

      const opponentEnergy = new CheckProvidedEnergyEffect(opponent, opponent.active);
      state = store.reduceEffect(state, opponentEnergy);

      // One energyMap entry per Energy card attached to the Pokémon.
      if (playerEnergy.energyMap.length === opponentEnergy.energyMap.length) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 100);
      }
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 30);
    }

    return state;
  }
}
