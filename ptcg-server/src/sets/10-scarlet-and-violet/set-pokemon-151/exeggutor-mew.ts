import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Exeggutor extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Exeggcute';
  public cardType: CardType[] = [G];
  public hp: number = 140;
  public weakness = [{ type: R }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Psychic',
      cost: [C, C],
      damage: 30,
      damageCalculation: '+',
      text: 'This attack does 30 more damage for each Energy attached to your opponent\'s Active Pokémon.',
    },
    {
      name: 'Hammer In',
      cost: [G, G, C],
      damage: 130,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '103';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Exeggutor';
  public fullName: string = 'Exeggutor MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;

      if (opponent.active.cards.length === 0) {
        return state;
      }

      const checkProvidedEnergy = new CheckProvidedEnergyEffect(opponent, opponent.active);
      state = store.reduceEffect(state, checkProvidedEnergy);

      const energyCount = checkProvidedEnergy.energyMap.length;
      effect.damage += 30 * energyCount;
    }

    return state;
  }
}
