import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, EnergyType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Grumpig extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Spoink';
  public cardType: CardType[] = [P];
  public hp: number = 120;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Powerful Steps',
      cost: [P],
      damage: 0,
      text: 'Search your deck for up to 2 Basic Energy cards and attach them to your Pokémon in any way you like. Then, shuffle your deck.',
    },
    {
      name: 'Zen Headbutt',
      cost: [P, C, C],
      damage: 100,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '91';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Grumpig';
  public fullName: string = 'Grumpig OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      state = ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON(store, state, player, 2, 2,
        { energyFilter: { energyType: EnergyType.BASIC } });
    }

    return state;
  }
}
