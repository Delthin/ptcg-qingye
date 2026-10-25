import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import {
  FLIP_A_COIN_UNTIL_YOU_GET_TAILS_DO_X_DAMAGE_PER_HEADS,
  PUT_ENERGY_FROM_OPPONENTS_ACTIVE_INTO_THEIR_HAND,
} from '../../../game/store/prefabs/attack-effects';

export class Octillery extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Remoraid';
  public cardType: CardType[] = [W];
  public hp: number = 110;
  public weakness = [{ type: L }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Aqua Wash',
      cost: [W],
      damage: 20,
      text: 'You may put an Energy attached to your opponent\'s Active Pokémon into their hand.',
    },
    {
      name: 'Octo Beatdown',
      cost: [W, C, C],
      damage: 90,
      damageCalculation: 'x',
      text: 'Flip a coin until you get tails. This attack does 90 damage for each heads.',
    },
  ];

  public regulationMark = 'I';
  public set: string = 'JTG';
  public setNumber: string = '34';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Octillery';
  public fullName: string = 'Octillery JTG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = PUT_ENERGY_FROM_OPPONENTS_ACTIVE_INTO_THEIR_HAND(store, state, effect, { count: 1 });
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = FLIP_A_COIN_UNTIL_YOU_GET_TAILS_DO_X_DAMAGE_PER_HEADS(store, state, effect, 90);
    }

    return state;
  }
}
