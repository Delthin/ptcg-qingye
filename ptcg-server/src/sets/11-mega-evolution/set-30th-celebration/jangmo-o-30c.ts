import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DEFENDING_POKEMON_TAKES_MORE_DAMAGE_DURING_YOUR_NEXT_TURN } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class JangmoO extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [N];
  public hp: number = 70;
  public retreat = [C];

  public attacks = [
    {
      name: 'Screech',
      cost: [C],
      damage: 0,
      text: 'During your next turn, the Defending Pokémon takes 30 more damage from attacks (after applying Weakness and Resistance).'
    },
    {
      name: 'Dragon Claw',
      cost: [L, F],
      damage: 40,
      text: ''
    }
  ];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '110';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Jangmo-o';
  public fullName: string = 'Jangmo-o 30C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = DEFENDING_POKEMON_TAKES_MORE_DAMAGE_DURING_YOUR_NEXT_TURN(store, state, effect, this, 30);
    }
    return state;
  }
}
