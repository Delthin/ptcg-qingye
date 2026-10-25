import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import { THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { BLOCK_RETREAT } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Espathra extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Flittle';
  public cardType: CardType[] = [P];
  public hp: number = 110;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [];

  public attacks = [
    {
      name: 'Eye Strength',
      cost: [P],
      damage: 20,
      text: 'During your opponent\'s next turn, the Defending Pokémon can\'t retreat.',
    },
    {
      name: 'Psychic',
      cost: [P, C, C],
      damage: 30,
      damageCalculation: '+',
      text: 'This attack does 50 more damage for each Energy attached to your opponent\'s Active Pokémon.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '103';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Espathra';
  public fullName: string = 'Espathra SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Eye Strength: the Defending Pokemon can't retreat during the opponent's next turn.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = BLOCK_RETREAT(store, state, effect, this);
    }

    // Psychic: 30 damage plus 50 more for each Energy attached to the opponent's Active Pokemon.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const opponent = effect.opponent;

      const checkProvidedEnergy = new CheckProvidedEnergyEffect(opponent, opponent.active);
      state = store.reduceEffect(state, checkProvidedEnergy);

      const energyCount = checkProvidedEnergy.energyMap.length;

      if (energyCount > 0) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 50 * energyCount);
      }
    }

    return state;
  }
}
