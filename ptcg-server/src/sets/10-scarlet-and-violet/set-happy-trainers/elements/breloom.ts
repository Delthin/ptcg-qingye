import { PokemonCard } from '../../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../../game/store/card/card-types';
import { Effect } from '../../../../game/store/effects/effect';
import { State } from '../../../../game/store/state/state';
import { StoreLike } from '../../../../game/store/store-like';
import { WAS_ATTACK_USED, FLIP_UNTIL_TAILS_AND_COUNT_HEADS, HEAL_X_DAMAGE_FROM_THIS_POKEMON } from '../../../../game/store/prefabs/prefabs';

export class BreloomHappy6 extends PokemonCard {
  public stage = Stage.STAGE_1;
  public evolvesFrom = 'Shroomish';
  public cardType = [CardType.GRASS];
  public hp = 120;
  public weakness = [{ type: CardType.FIRE }];
  public resistance = [];
  public retreat = [CardType.COLORLESS, CardType.COLORLESS];
  public regulationMark = 'I';

  public attacks = [
    {
      name: '伤害冲刺',
      cost: [CardType.COLORLESS, CardType.COLORLESS],
      damage: 30,
      damageSuffix: '+',
      text: '抛掷硬币直到出现反面，追加造成正面次数×50伤害。'
    },
    {
      name: '超级吸取',
      cost: [CardType.GRASS, CardType.COLORLESS, CardType.COLORLESS],
      damage: 90,
      text: '回复这只宝可梦「30」HP。'
    },
  ];

  public set = 'CSVH6eC';
  public setNumber = '003';
  public name = 'Breloom';
  public fullName = 'Breloom CSVH6eC';
  public cardImage = 'assets/cardback.png';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      return FLIP_UNTIL_TAILS_AND_COUNT_HEADS(store, state, effect.player, heads => {
        effect.damage += heads * 50;
      });
    }
    if (WAS_ATTACK_USED(effect, 1, this)) {
      effect.afterDamageEffects.push(state => HEAL_X_DAMAGE_FROM_THIS_POKEMON(effect, store, state, 30));
    }
    return state;
  }
}
