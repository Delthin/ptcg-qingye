import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { FLIP_A_COIN_IF_HEADS_DEAL_MORE_DAMAGE } from '../../../game/store/prefabs/attack-effects';

export class Greninjaex extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Frogadier';
  public cardType: CardType[] = [W];
  public hp: number = 300;
  public weakness = [{ type: L }];
  public retreat = [C, C];
  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [{
    name: 'Shifting Shuriken',
    cost: [W, C],
    damage: 100,
    damageCalculation: '+',
    text: 'Flip a coin. If heads, this attack does 100 more damage.',
  }];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '41';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Greninja ex';
  public fullName: string = 'Greninja ex SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = FLIP_A_COIN_IF_HEADS_DEAL_MORE_DAMAGE(store, state, effect, 100);
    }
    return state;
  }
}
