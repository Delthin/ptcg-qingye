import { PokemonCard } from '../../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../../game/store/card/card-types';
import { Effect } from '../../../../game/store/effects/effect';
import { State } from '../../../../game/store/state/state';
import { StoreLike } from '../../../../game/store/store-like';
import { WAS_ATTACK_USED, THIS_ATTACK_DOES_X_DAMAGE_TO_X_OF_YOUR_OPPONENTS_POKEMON } from '../../../../game/store/prefabs/prefabs';

export class TurtonatorHappy6 extends PokemonCard {
  public stage = Stage.BASIC;
  public cardType = [CardType.FIRE];
  public hp = 120;
  public weakness = [{ type: CardType.WATER }];
  public resistance = [];
  public retreat = [CardType.COLORLESS, CardType.COLORLESS];
  public regulationMark = 'H';

  public attacks = [
    {
      name: '喷涌射击',
      cost: [CardType.FIRE, CardType.COLORLESS],
      damage: 0,
      text: '给对手的1只备战宝可梦，造成40伤害。[备战宝可梦不计算弱点、抗性。]'
    },
    {
      name: '爆热炮',
      cost: [CardType.FIRE, CardType.FIRE, CardType.COLORLESS],
      damage: 100,
      text: ''
    },
  ];

  public set = 'CSVH6eC';
  public setNumber = '012';
  public name = 'Turtonator';
  public fullName = 'Turtonator CSVH6eC';
  public cardImage = 'assets/cardback.png';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      return THIS_ATTACK_DOES_X_DAMAGE_TO_X_OF_YOUR_OPPONENTS_POKEMON(40, effect, store, state, 1, 1);
    }
    return state;
  }
}
