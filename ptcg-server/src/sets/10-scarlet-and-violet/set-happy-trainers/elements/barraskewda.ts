import { PokemonCard } from '../../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../../game/store/card/card-types';
import { Effect } from '../../../../game/store/effects/effect';
import { State } from '../../../../game/store/state/state';
import { StoreLike } from '../../../../game/store/store-like';
import { WAS_ATTACK_USED } from '../../../../game/store/prefabs/prefabs';
import { FLIP_COIN_TO_PREVENT_DAMAGE_AND_EFFECTS_DURING_OPPONENTS_NEXT_TURN } from '../../../../game/store/prefabs/effect-of-attack-prefabs';

export class BarraskewdaHappy6 extends PokemonCard {
  public stage = Stage.STAGE_1;
  public evolvesFrom = 'Arrokuda';
  public cardType = [CardType.WATER];
  public hp = 130;
  public weakness = [{ type: CardType.LIGHTNING }];
  public resistance = [];
  public retreat = [CardType.COLORLESS];
  public regulationMark = 'I';

  public attacks = [
    {
      name: '锐利之鳍',
      cost: [CardType.WATER],
      damage: 40,
      text: ''
    },
    {
      name: '潜水',
      cost: [CardType.WATER, CardType.WATER],
      damage: 60,
      text: '抛掷1次硬币，如果为正面，则在下一个对手的回合，这只宝可梦不会受到招式的伤害和效果影响。'
    },
  ];

  public set = 'CSVH6eC';
  public setNumber = '017';
  public name = 'Barraskewda';
  public fullName = 'Barraskewda CSVH6eC';
  public cardImage = 'assets/cardback.png';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      return FLIP_COIN_TO_PREVENT_DAMAGE_AND_EFFECTS_DURING_OPPONENTS_NEXT_TURN(store, state, effect, this);
    }
    return state;
  }
}
