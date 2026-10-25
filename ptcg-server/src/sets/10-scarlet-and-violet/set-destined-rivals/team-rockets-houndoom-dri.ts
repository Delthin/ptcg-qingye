import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import {
  YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_BURNED,
  YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED,
} from '../../../game/store/prefabs/attack-effects';
import { DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON } from '../../../game/store/prefabs/costs';

export class TeamRocketsHoundoom extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Team Rocket\'s Houndour';
  public cardType: CardType[] = [R];
  public hp: number = 130;
  public weakness = [{ type: W }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Cruel Coal',
      cost: [R],
      damage: 0,
      text: 'Your opponent\'s Active Pokémon is now Burned and Confused.',
    },
    {
      name: 'Scorching Fire',
      cost: [R, C],
      damage: 120,
      text: 'Discard an Energy from this Pokémon.',
    },
  ];

  public regulationMark = 'I';
  public set: string = 'DRI';
  public setNumber: string = '38';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Team Rocket\'s Houndoom';
  public fullName: string = 'Team Rocket\'s Houndoom DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Cruel Coal: Your opponent's Active Pokémon is now Burned and Confused.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_BURNED(store, state, effect);
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_CONFUSED(store, state, effect);
    }

    // Scorching Fire: Discard an Energy from this Pokémon.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON(store, state, effect, 1, {}, 1);
    }

    return state;
  }
}
