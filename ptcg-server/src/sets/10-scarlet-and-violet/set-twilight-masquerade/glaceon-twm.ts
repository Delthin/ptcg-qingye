import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { PUT_DAMAGE_COUNTERS_ON_DEFENDING_POKEMON_AT_END_OF_OPPONENTS_NEXT_TURN } from '../../../game/store/prefabs/attack-effects';

export class Glaceon extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Eevee';
  public cardType: CardType[] = [W];
  public hp: number = 120;
  public weakness = [{ type: M }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Permeating Chill',
      cost: [W],
      damage: 30,
      text: 'At the end of your opponent\'s next turn, put 9 damage counters on the Defending Pokémon.'
    },
    {
      name: 'Icicle Missile',
      cost: [W, C],
      damage: 70,
      text: ''
    }
  ];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '54';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Glaceon';
  public fullName: string = 'Glaceon TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Permeating Chill: at the end of your opponent's next turn,
    // put 9 damage counters (= 90 damage) on the Defending Pokémon.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = PUT_DAMAGE_COUNTERS_ON_DEFENDING_POKEMON_AT_END_OF_OPPONENTS_NEXT_TURN(store, state, effect, this, 90);
    }

    return state;
  }
}
