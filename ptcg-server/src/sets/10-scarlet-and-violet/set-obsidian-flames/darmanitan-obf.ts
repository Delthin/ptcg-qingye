import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Darmanitan extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Darumaka';
  public cardType: CardType[] = [R];
  public hp: number = 140;
  public weakness = [{ type: W }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Damage Counterpunch',
      cost: [R, C, C],
      damage: 60,
      damageCalculation: '+',
      text: 'If this Pokémon has any damage counters on it, this attack does 60 more damage.',
    },
    {
      name: 'Heat Blast',
      cost: [R, C, C, C],
      damage: 140,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '35';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Darmanitan';
  public fullName: string = 'Darmanitan OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      // If this Pokémon has any damage counters on it, this attack does 60 more damage.
      if (effect.source.damage > 0) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 60);
      }
    }
    return state;
  }
}
