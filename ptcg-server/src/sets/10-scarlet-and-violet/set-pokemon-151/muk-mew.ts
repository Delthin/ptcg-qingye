import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import {
  DEFENDING_POKEMON_ATTACKS_COST_MORE,
  DEFENDING_POKEMON_RETREAT_COSTS_MORE,
} from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Muk extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Grimer';
  public cardType: CardType[] = [D];
  public hp: number = 150;
  public weakness = [{ type: F }];
  public retreat = [C, C, C, C];

  public attacks = [
    {
      name: 'Sticky Jail',
      cost: [D],
      damage: 30,
      text: 'During your opponent\'s next turn, attacks used by the Defending Pokémon cost [C] more, and its Retreat Cost is [C] more.',
    },
    {
      name: 'Sludge Bomb',
      cost: [D, D, D, C],
      damage: 180,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '89';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Muk';
  public fullName: string = 'Muk MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = DEFENDING_POKEMON_ATTACKS_COST_MORE(store, state, effect, 1);
      state = DEFENDING_POKEMON_RETREAT_COSTS_MORE(store, state, effect, 1);
    }

    return state;
  }
}
