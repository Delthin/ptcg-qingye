import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Houndstone extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Greavard';
  public cardType: CardType[] = [P];
  public hp: number = 140;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Rear Kick',
      cost: [C, C],
      damage: 30,
      text: '',
    },
    {
      name: 'Two Four-ocious',
      cost: [P, C, C],
      damage: 80,
      damageCalculation: '+',
      text: 'If your opponent has exactly 2 or 4 Prize cards remaining, this attack does 120 more damage.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '101';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Houndstone';
  public fullName: string = 'Houndstone OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const prizesLeft = effect.opponent.getPrizeLeft();

      if (prizesLeft === 2 || prizesLeft === 4) {
        state = THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 120);
      }
    }
    return state;
  }
}
