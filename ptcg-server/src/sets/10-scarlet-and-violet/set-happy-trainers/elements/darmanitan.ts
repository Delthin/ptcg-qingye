import { PokemonCard } from '../../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../../game/store/card/card-types';
import { Effect } from '../../../../game/store/effects/effect';
import { State } from '../../../../game/store/state/state';
import { StoreLike } from '../../../../game/store/store-like';
import { WAS_ATTACK_USED, THIS_POKEMON_DOES_DAMAGE_TO_ITSELF } from '../../../../game/store/prefabs/prefabs';

export class DarmanitanHappy6 extends PokemonCard {
  public stage = Stage.STAGE_1;
  public evolvesFrom = 'Darumaka';
  public cardType = [CardType.FIRE];
  public hp = 140;
  public weakness = [{ type: CardType.WATER }];
  public resistance = [];
  public retreat = [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS];
  public regulationMark = 'H';

  public attacks = [
    {
      name: '滚动冲撞',
      cost: [CardType.FIRE, CardType.FIRE],
      damage: 60,
      text: ''
    },
    {
      name: '猛火猛撞',
      cost: [CardType.FIRE, CardType.FIRE, CardType.FIRE],
      damage: 210,
      text: '给这只宝可梦也造成70伤害。'
    },
  ];

  public set = 'CSVH6eC';
  public setNumber = '011';
  public name = 'Darmanitan';
  public fullName = 'Darmanitan CSVH6eC';
  public cardImage = 'assets/cardback.png';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      effect.additionalDamageEffects.push(state => THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 70));
    }
    return state;
  }
}
