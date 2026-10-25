import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { PUT_ENERGY_FROM_OPPONENTS_ACTIVE_INTO_THEIR_HAND } from '../../../game/store/prefabs/attack-effects';

export class Omanyte extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Antique Helix Fossil';
  public cardType: CardType[] = [W];
  public hp: number = 100;
  public weakness = [{ type: L }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Tentacular Return',
    cost: [W, W],
    damage: 50,
    text: 'Put an Energy attached to your opponent\'s Active Pokémon into their hand.',
  }];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '138';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Omanyte';
  public fullName: string = 'Omanyte MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = PUT_ENERGY_FROM_OPPONENTS_ACTIVE_INTO_THEIR_HAND(store, state, effect, { count: 1 });
    }
    return state;
  }
}
