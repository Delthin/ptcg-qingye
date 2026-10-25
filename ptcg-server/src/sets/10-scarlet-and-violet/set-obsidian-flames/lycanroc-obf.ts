import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Lycanroc extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Rockruff';
  public cardType: CardType[] = [F];
  public hp: number = 130;
  public weakness = [{ type: G }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Finishing Fang',
      cost: [F],
      damage: 90,
      text: 'If your opponent\'s Active Pokémon has no damage counters on it before this attack does damage, this attack does nothing.',
    },
    {
      name: 'Slashing Claw',
      cost: [F, C, C],
      damage: 100,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '117';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Lycanroc';
  public fullName: string = 'Lycanroc OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      // 招式伤害在卡牌 reduceEffect 之后才结算，此时对手战斗宝可梦身上的
      // 伤害指示物仍是「这个招式造成伤害之前」的状态。
      if (effect.opponent.active.damage === 0) {
        effect.damage = 0;
      }
    }

    return state;
  }
}
