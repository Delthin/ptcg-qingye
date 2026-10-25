import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { KNOCK_OUT_DEFENDING_POKEMON_AT_END_OF_OPPONENTS_NEXT_TURN } from '../../../game/store/prefabs/attack-effects';

export class Grapploct extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Clobbopus';
  public cardType: CardType[] = [F];
  public hp: number = 120;
  public weakness = [{ type: P }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Slow-Acting Syncope',
      cost: [F],
      damage: 30,
      text: 'At the end of your opponent\'s next turn, the Defending Pokémon will be Knocked Out.',
    },
    {
      name: 'Mach Cross',
      cost: [F, F, C],
      damage: 120,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAF';
  public setNumber: string = '52';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Grapploct';
  public fullName: string = 'Grapploct PAF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = KNOCK_OUT_DEFENDING_POKEMON_AT_END_OF_OPPONENTS_NEXT_TURN(store, state, effect, this);
    }
    return state;
  }
}
