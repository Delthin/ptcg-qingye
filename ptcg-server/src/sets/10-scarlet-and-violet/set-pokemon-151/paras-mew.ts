import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED, ADD_SLEEP_TO_PLAYER_ACTIVE } from '../../../game/store/prefabs/prefabs';

export class Paras extends PokemonCard {
  public regulationMark: string = 'G';

  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 70;
  public weakness = [{ type: R }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Stampede',
      cost: [G],
      damage: 10,
      text: '',
    },
    {
      name: 'Spore Ball',
      cost: [G, C],
      damage: 20,
      text: 'Your opponent\'s Active Pokémon is now Asleep.',
    },
  ];

  public set: string = 'MEW';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '46';
  public name: string = 'Paras';
  public fullName: string = 'Paras MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Attack 2: Spore Ball
    // Ref: set-dragons-majesty/swablu-2.ts (Sing - asleep pattern)
    if (WAS_ATTACK_USED(effect, 1, this)) {
      ADD_SLEEP_TO_PLAYER_ACTIVE(store, state, effect.opponent, this);
    }

    return state;
  }
}
