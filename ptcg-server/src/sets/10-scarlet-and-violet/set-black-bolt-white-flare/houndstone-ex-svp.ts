import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { FLIP_A_COIN_UNTIL_YOU_GET_TAILS_DO_X_MORE_DAMAGE_PER_HEADS } from '../../../game/store/prefabs/attack-effects';

export class Houndstoneex extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Greavard';
  public cardType: CardType[] = [P];
  public hp: number = 260;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C, C];
  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [{
    name: 'Horrifying Fang',
    cost: [P, C, C],
    damage: 100,
    damageCalculation: '+',
    text: 'Flip a coin until you get tails. This attack does 20 more damage for each heads.',
  }];

  public regulationMark = 'H';
  public set: string = 'SVP';
  public setNumber: string = '162';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Houndstone ex';
  public fullName: string = 'Houndstone ex SVP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = FLIP_A_COIN_UNTIL_YOU_GET_TAILS_DO_X_MORE_DAMAGE_PER_HEADS(store, state, effect, 20);
    }
    return state;
  }
}
