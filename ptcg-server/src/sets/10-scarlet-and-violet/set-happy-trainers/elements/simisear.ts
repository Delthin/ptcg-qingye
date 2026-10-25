import { PokemonCard } from '../../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../../game/store/card/card-types';
import { Effect } from '../../../../game/store/effects/effect';
import { State } from '../../../../game/store/state/state';
import { StoreLike } from '../../../../game/store/store-like';
import { WAS_ATTACK_USED, MULTIPLE_COIN_FLIPS_PROMPT } from '../../../../game/store/prefabs/prefabs';

export class SimisearHappy6 extends PokemonCard {
  public stage = Stage.STAGE_1;
  public evolvesFrom = 'Pansear';
  public cardType = [CardType.FIRE];
  public hp = 90;
  public weakness = [{ type: CardType.WATER }];
  public resistance = [];
  public retreat = [CardType.COLORLESS];
  public regulationMark = 'H';

  public attacks = [
    {
      name: '双重粉碎',
      cost: [CardType.FIRE],
      damage: 70,
      damageSuffix: '×',
      text: '抛掷2次硬币，造成正面次数×70伤害。'
    },
  ];

  public set = 'CSVH6eC';
  public setNumber = '009';
  public name = 'Simisear';
  public fullName = 'Simisear CSVH6eC';
  public cardImage = 'assets/cardback.png';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      return MULTIPLE_COIN_FLIPS_PROMPT(store, state, effect.player, 2, results => {
        effect.damage = results.filter(result => result).length * 70;
      });
    }
    return state;
  }
}
