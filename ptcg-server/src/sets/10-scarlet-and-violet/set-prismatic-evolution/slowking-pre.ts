import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { PUT_ENERGY_FROM_OPPONENTS_ACTIVE_INTO_THEIR_HAND } from '../../../game/store/prefabs/attack-effects';

export class Slowking extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Slowpoke';
  public cardType: CardType[] = [W];
  public hp: number = 130;
  public weakness = [{ type: L }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Wash the Slate Clean',
    cost: [W, C, C],
    damage: 70,
    text: 'You may put 2 Energy attached to your opponent\'s Active Pokémon into their hand.'
  }];

  public regulationMark = 'H';
  public set: string = 'PRE';
  public setNumber: string = '19';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Slowking';
  public fullName: string = 'Slowking PRE';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = PUT_ENERGY_FROM_OPPONENTS_ACTIVE_INTO_THEIR_HAND(store, state, effect, { count: 2 });
    }
    return state;
  }
}
