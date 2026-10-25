import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import { MULTIPLE_COIN_FLIPS_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_ASLEEP } from '../../../game/store/prefabs/attack-effects';

export class Bellossom extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Gloom';
  public cardType: CardType[] = [G];
  public hp: number = 130;
  public weakness = [{ type: R }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Sleep Powder',
      cost: [C],
      damage: 30,
      text: 'Your opponent\'s Active Pokémon is now Asleep.',
    },
    {
      name: 'Powerful Dance',
      cost: [G],
      damage: 90,
      damageCalculation: 'x',
      text: 'Flip a coin for each Energy attached to this Pokémon. This attack does 90 damage for each heads.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '3';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Bellossom';
  public fullName: string = 'Bellossom OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Sleep Powder
    if (WAS_ATTACK_USED(effect, 0, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_ASLEEP(store, state, effect);
    }

    // Powerful Dance
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;

      const checkProvidedEnergy = new CheckProvidedEnergyEffect(player, player.active);
      state = store.reduceEffect(state, checkProvidedEnergy);
      const energyCount = checkProvidedEnergy.energyMap.length;

      return MULTIPLE_COIN_FLIPS_PROMPT(store, state, player, energyCount, results => {
        const heads = results.filter(result => result).length;
        effect.damage = 90 * heads;
      });
    }

    return state;
  }
}
