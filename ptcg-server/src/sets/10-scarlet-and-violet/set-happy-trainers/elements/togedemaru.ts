import { PokemonCard } from '../../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../../game/store/card/card-types';
import { Effect } from '../../../../game/store/effects/effect';
import { State } from '../../../../game/store/state/state';
import { StoreLike } from '../../../../game/store/store-like';
import { WAS_ATTACK_USED } from '../../../../game/store/prefabs/prefabs';
import { FLIP_COIN_TO_PREVENT_DAMAGE_AND_EFFECTS_DURING_OPPONENTS_NEXT_TURN } from '../../../../game/store/prefabs/effect-of-attack-prefabs';

export class TogedemaruHappy6 extends PokemonCard {
  public stage = Stage.BASIC;
  public cardType = [CardType.LIGHTNING];
  public hp = 80;
  public weakness = [{ type: CardType.FIGHTING }];
  public resistance = [];
  public retreat = [CardType.COLORLESS];
  public regulationMark = 'H';

  public attacks = [
    {
      name: '尖刺电光',
      cost: [CardType.LIGHTNING, CardType.COLORLESS],
      damage: 40,
      text: '抛掷1次硬币如果为正面，则在下一个对手的回合，这只宝可梦不受到招式的伤害和效果影响。'
    },
  ];

  public set = 'CSVH6eC';
  public setNumber = '019';
  public name = 'Togedemaru';
  public fullName = 'Togedemaru CSVH6eC';
  public cardImage = 'assets/cardback.png';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      return FLIP_COIN_TO_PREVENT_DAMAGE_AND_EFFECTS_DURING_OPPONENTS_NEXT_TURN(store, state, effect, this);
    }
    return state;
  }
}
