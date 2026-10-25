import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { FLIP_A_COIN_IF_HEADS_DEAL_MORE_DAMAGE } from '../../../game/store/prefabs/attack-effects';

export class Poochyena extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [D];
  public hp: number = 70;
  public weakness = [{ type: G }];
  public retreat = [C];

  public attacks = [{
    name: 'Gnaw Off',
    cost: [D, C],
    damage: 30,
    damageCalculation: '+',
    text: 'Flip a coin. If heads, this attack does 20 more damage.',
  }];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '105';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Poochyena';
  public fullName: string = 'Poochyena TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      FLIP_A_COIN_IF_HEADS_DEAL_MORE_DAMAGE(store, state, effect, 20);
    }
    return state;
  }
}
