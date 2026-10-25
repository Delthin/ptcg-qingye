import { PokemonCard } from '../../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../../game/store/card/card-types';
import { Effect } from '../../../../game/store/effects/effect';
import { State } from '../../../../game/store/state/state';
import { StoreLike } from '../../../../game/store/store-like';
import { WAS_ATTACK_USED, HEAL_X_DAMAGE_FROM_THIS_POKEMON } from '../../../../game/store/prefabs/prefabs';

export class VirizionHappy6 extends PokemonCard {
  public stage = Stage.BASIC;
  public cardType = [CardType.GRASS];
  public hp = 120;
  public weakness = [{ type: CardType.FIRE }];
  public resistance = [];
  public retreat = [CardType.COLORLESS];
  public regulationMark = 'H';

  public attacks = [
    {
      name: '绿叶吸取',
      cost: [CardType.GRASS, CardType.COLORLESS],
      damage: 30,
      text: '回复这只宝可梦「30」HP。'
    },
    {
      name: '薄片利刃',
      cost: [CardType.GRASS, CardType.COLORLESS, CardType.COLORLESS],
      damage: 100,
      text: ''
    },
  ];

  public set = 'CSVH6eC';
  public setNumber = '004';
  public name = 'Virizion';
  public fullName = 'Virizion CSVH6eC';
  public cardImage = 'assets/cardback.png';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      effect.afterDamageEffects.push(state => HEAL_X_DAMAGE_FROM_THIS_POKEMON(effect, store, state, 30));
    }
    return state;
  }
}
