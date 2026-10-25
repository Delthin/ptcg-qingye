import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON } from '../../../game/store/prefabs/costs';

export class Houndoom extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Houndour';
  public cardType: CardType[] = [R];
  public hp: number = 120;
  public weakness = [{ type: W }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Sharp Fang',
      cost: [C],
      damage: 30,
      text: '',
    },
    {
      name: 'Fire Blast',
      cost: [R, R, C],
      damage: 150,
      text: 'Discard an Energy from this Pokémon.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '34';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Houndoom';
  public fullName: string = 'Houndoom SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Fire Blast: Discard an Energy from this Pokémon.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON(store, state, effect, 1, {}, 1);
    }
    return state;
  }
}
