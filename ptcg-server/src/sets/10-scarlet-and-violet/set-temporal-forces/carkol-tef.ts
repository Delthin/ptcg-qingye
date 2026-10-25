import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { FLIP_A_COIN_IF_HEADS_DEAL_MORE_DAMAGE } from '../../../game/store/prefabs/attack-effects';

export class Carkol extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Rolycoly';
  public cardType: CardType[] = [F];
  public hp: number = 110;
  public weakness = [{ type: G }];
  public retreat = [C, C, C, C];

  public attacks = [
    {
      name: 'Knock Away',
      cost: [F],
      damage: 20,
      damageCalculation: '+',
      text: 'Flip a coin. If heads, this attack does 40 more damage.'
    },
    {
      name: 'Boulder Crush',
      cost: [F, C, C, C],
      damage: 80,
      text: ''
    }
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '94';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Carkol';
  public fullName: string = 'Carkol TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = FLIP_A_COIN_IF_HEADS_DEAL_MORE_DAMAGE(store, state, effect, 40);
    }

    return state;
  }
}
