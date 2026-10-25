import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, EnergyType } from '../../../game/store/card/card-types';
import { StoreLike, State, SlotType } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Boltund extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Yamper';
  public cardType: CardType[] = [L];
  public hp: number = 120;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [{
    name: 'Electrifying Dash',
    cost: [C],
    damage: 50,
    text: 'Search your deck for up to 2 Basic Lightning Energy cards and attach them to your Benched Pokémon in any way you like. Then, shuffle your deck.',
  }];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '59';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Boltund';
  public fullName: string = 'Boltund TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      return ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON(store, state, player, 2, 2,
        { destinationSlots: [SlotType.BENCH], energyFilter: { energyType: EnergyType.BASIC, name: 'Lightning Energy' } });
    }
    return state;
  }
}
