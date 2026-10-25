import { PokemonCard } from '../../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../../game/store/card/card-types';
import { Effect } from '../../../../game/store/effects/effect';
import { State } from '../../../../game/store/state/state';
import { StoreLike } from '../../../../game/store/store-like';
import { WAS_ATTACK_USED, THIS_POKEMON_DOES_DAMAGE_TO_ITSELF } from '../../../../game/store/prefabs/prefabs';

export class DarumakaHappy6 extends PokemonCard {
  public stage = Stage.BASIC;
  public cardType = [CardType.FIRE];
  public hp = 80;
  public weakness = [{ type: CardType.WATER }];
  public resistance = [];
  public retreat = [CardType.COLORLESS, CardType.COLORLESS];
  public regulationMark = 'H';

  public attacks = [
    {
      name: '怪力',
      cost: [CardType.FIRE],
      damage: 10,
      text: ''
    },
    {
      name: '火焰冲撞',
      cost: [CardType.FIRE, CardType.FIRE],
      damage: 50,
      text: '给这只宝可梦也造成20伤害。'
    },
  ];

  public set = 'CSVH6eC';
  public setNumber = '010';
  public name = 'Darumaka';
  public fullName = 'Darumaka CSVH6eC';
  public cardImage = 'assets/cardback.png';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      effect.additionalDamageEffects.push(state => THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 20));
    }
    return state;
  }
}
