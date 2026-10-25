import { PokemonCard } from '../../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../../game/store/card/card-types';
import { Effect } from '../../../../game/store/effects/effect';
import { State } from '../../../../game/store/state/state';
import { StoreLike } from '../../../../game/store/store-like';
import { WAS_ATTACK_USED, THIS_POKEMON_DOES_DAMAGE_TO_ITSELF } from '../../../../game/store/prefabs/prefabs';

export class ArrokudaHappy6 extends PokemonCard {
  public stage = Stage.BASIC;
  public cardType = [CardType.WATER];
  public hp = 70;
  public weakness = [{ type: CardType.LIGHTNING }];
  public resistance = [];
  public retreat = [CardType.COLORLESS];
  public regulationMark = 'I';

  public attacks = [
    {
      name: '突击',
      cost: [CardType.WATER],
      damage: 30,
      text: '给这只宝可梦也造成10伤害。'
    },
  ];

  public set = 'CSVH6eC';
  public setNumber = '016';
  public name = 'Arrokuda';
  public fullName = 'Arrokuda CSVH6eC';
  public cardImage = 'assets/cardback.png';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      effect.additionalDamageEffects.push(state => THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 10));
    }
    return state;
  }
}
