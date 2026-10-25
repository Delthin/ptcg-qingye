import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_BURNED } from '../../../game/store/prefabs/attack-effects';
import { DISCARD_UP_TO_X_TYPE_ENERGY_FROM_YOUR_POKEMON } from '../../../game/store/prefabs/costs';

export class Camerupt extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Numel';
  public cardType: CardType[] = [R];
  public hp: number = 130;
  public weakness = [{ type: W }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Super Singe',
      cost: [R],
      damage: 0,
      text: 'Your opponent\'s Active Pokémon is now Burned.'
    },
    {
      name: 'Cinder Cannon',
      cost: [R, R, C],
      damage: 120,
      damageCalculation: '+',
      text: 'You may discard a Fighting Energy from this Pokémon. If you do, this attack does 120 more damage.'
    }
  ];

  public regulationMark = 'G';
  public set: string = 'PAF';
  public setNumber: string = '12';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Camerupt';
  public fullName: string = 'Camerupt PAF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Super Singe: opponent's Active Pokemon is now Burned.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_BURNED(store, state, effect);
    }

    // Cinder Cannon: optionally discard a Fighting Energy from this Pokemon for +120 damage.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = DISCARD_UP_TO_X_TYPE_ENERGY_FROM_YOUR_POKEMON(
        store, state, effect, 1, F, 0, [SlotType.ACTIVE],
        transfers => {
          if (transfers.length > 0) {
            THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 120);
          }
        }
      );
    }

    return state;
  }
}
