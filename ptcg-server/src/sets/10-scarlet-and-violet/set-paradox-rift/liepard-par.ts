import { MOVE_DAMAGE_FROM_YOUR_BENCH_TO_OPPONENTS_ACTIVE } from '../../../game/store/prefabs/prefabs';
import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';

import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Liepard extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Purrloin';
  public cardType: CardType[] = [D];
  public hp: number = 100;
  public weakness = [{ type: G }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Dishonest Swap',
      cost: [D],
      damage: 0,
      text: 'Move all damage counters from 1 of your Benched Pokémon to your opponent\'s Active Pokémon.',
    },
    {
      name: 'Slash',
      cost: [C, C],
      damage: 60,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '115';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Liepard';
  public fullName: string = 'Liepard PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      return MOVE_DAMAGE_FROM_YOUR_BENCH_TO_OPPONENTS_ACTIVE(store, state, effect);
    }

    return state;
  }
}
