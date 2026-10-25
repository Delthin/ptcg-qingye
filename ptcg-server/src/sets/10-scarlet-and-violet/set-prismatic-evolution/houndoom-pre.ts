import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, EnergyType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Houndoom extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Houndour';
  public cardType: CardType[] = [D];
  public hp: number = 120;
  public weakness = [{ type: G }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Call to Muster',
      cost: [D],
      damage: 0,
      text: 'Search your deck for up to 2 Basic Energy cards and attach them to your Pokémon in any way you like. Then, shuffle your deck.',
    },
    {
      name: 'Pitch-Black Fangs',
      cost: [D, C, C],
      damage: 100,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'PRE';
  public setNumber: string = '63';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Houndoom';
  public fullName: string = 'Houndoom PRE';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Call to Muster: search up to 2 Basic Energy and attach them to your Pokémon in any way you like.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      state = ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON(store, state, player, 2, 6,
        { energyFilter: { energyType: EnergyType.BASIC } });
    }

    return state;
  }
}
