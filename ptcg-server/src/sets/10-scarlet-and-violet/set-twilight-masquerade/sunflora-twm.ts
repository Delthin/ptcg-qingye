import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import { HEAL_X_DAMAGE_FROM_THIS_POKEMON, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Sunflora extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Sunkern';
  public cardType: CardType[] = [CardType.GRASS];
  public hp: number = 100;
  public weakness = [{ type: CardType.FIRE }];
  public retreat = [CardType.COLORLESS];

  public attacks = [
    {
      name: 'Redirected Sunlight',
      cost: [CardType.GRASS],
      damage: 60,
      damageCalculation: 'x',
      text: 'This attack does 60 damage for each Fire Energy attached to all of your opponent\'s Pokémon.',
    },
    {
      name: 'Mega Drain',
      cost: [CardType.GRASS, CardType.COLORLESS],
      damage: 50,
      text: 'Heal 30 damage from this Pokémon.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '7';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Sunflora';
  public fullName: string = 'Sunflora TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;
      let fireEnergyCount = 0;

      const targets = [opponent.active, ...opponent.bench].filter(list => list.cards.length > 0);

      targets.forEach(cardList => {
        const checkProvidedEnergy = new CheckProvidedEnergyEffect(opponent, cardList);
        state = store.reduceEffect(state, checkProvidedEnergy);

        checkProvidedEnergy.energyMap.forEach(energy => {
          if (energy.provides.includes(CardType.FIRE)) {
            fireEnergyCount += 1;
          }
        });
      });

      effect.damage = 60 * fireEnergyCount;
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      HEAL_X_DAMAGE_FROM_THIS_POKEMON(effect, store, state, 30);
    }

    return state;
  }
}
