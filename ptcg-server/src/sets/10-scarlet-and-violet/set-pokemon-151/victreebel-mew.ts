import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { PUT_DAMAGE_COUNTERS_ON_DEFENDING_POKEMON_AT_END_OF_OPPONENTS_NEXT_TURN } from '../../../game/store/prefabs/attack-effects';

export class Victreebel extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Weepinbell';
  public cardType: CardType[] = [G];
  public hp: number = 150;
  public weakness = [{ type: R }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Spit Up',
      cost: [G],
      damage: 50,
      text: '',
    },
    {
      name: 'Slow-Acting Acid',
      cost: [G, C],
      damage: 120,
      text: 'At the end of your opponent\'s next turn, put 12 damage counters on the Defending Pokémon.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '71';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Victreebel';
  public fullName: string = 'Victreebel MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      // 12 damage counters = 120 damage in engine units.
      state = PUT_DAMAGE_COUNTERS_ON_DEFENDING_POKEMON_AT_END_OF_OPPONENTS_NEXT_TURN(store, state, effect, this, 120);
    }
    return state;
  }
}
