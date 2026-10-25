import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ATTACH_X_TYPE_ENERGY_FROM_DISCARD_TO_1_OF_YOUR_POKEMON,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Volcarona extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Larvesta';
  public cardType: CardType[] = [R];
  public hp: number = 140;
  public weakness = [{ type: W }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Flame Cloak',
      cost: [R],
      damage: 30,
      text: 'Attach a Basic Fire Energy card from your discard pile to this Pokémon.'
    },
    {
      name: 'Heat Blast',
      cost: [R, R, C],
      damage: 130,
      text: ''
    }
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '41';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Volcarona';
  public fullName: string = 'Volcarona OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      state = ATTACH_X_TYPE_ENERGY_FROM_DISCARD_TO_1_OF_YOUR_POKEMON(store, state, player, 1, R);
    }

    return state;
  }
}
