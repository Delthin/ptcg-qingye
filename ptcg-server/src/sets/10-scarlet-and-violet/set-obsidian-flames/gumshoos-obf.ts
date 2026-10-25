import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DISCARD_AN_ENERGY_FROM_OPPONENTS_ACTIVE_POKEMON } from '../../../game/store/prefabs/attack-effects';

export class Gumshoos extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Yungoos';
  public cardType: CardType[] = [C];
  public hp: number = 120;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Headbang',
      cost: [C],
      damage: 30,
      text: '',
    },
    {
      name: 'Crunch',
      cost: [C, C],
      damage: 60,
      text: 'Discard an Energy from your opponent\'s Active Pokémon.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '177';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Gumshoos';
  public fullName: string = 'Gumshoos OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = DISCARD_AN_ENERGY_FROM_OPPONENTS_ACTIVE_POKEMON(store, state, effect);
    }
    return state;
  }
}
