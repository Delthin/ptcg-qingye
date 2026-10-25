import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, EnergyType } from '../../../game/store/card/card-types';
import { State } from '../../../game/store/state/state';

import { StoreLike } from '../../../game/store/store-like';
import { Effect } from '../../../game/store/effects/effect';
import { SlotType } from '../../../game';
import { ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Smoochum extends PokemonCard {

  public regulationMark = 'H';

  public stage = Stage.BASIC;

  public cardType: CardType[] = [CardType.PSYCHIC];

  public hp = 30;

  public weakness = [{ type: CardType.DARK }];

  public resistance = [{ type: CardType.FIGHTING, value: -30 }];

  public retreat = [];

  public attacks = [
    {
      name: 'Happy Kiss',
      cost: [],
      damage: 0,
      text: 'Search your deck for up to 2 Basic [P] Energy cards and attach them to your Benched Pokemon in any way you like. Then, shuffle your deck.'
    }
  ];

  public set: string = 'SSP';

  public cardImage: string = 'assets/cardback.png';

  public setNumber: string = '75';

  public name: string = 'Smoochum';

  public fullName: string = 'Smoochum SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      return ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON(store, state, player, 2, 2,
        { destinationSlots: [SlotType.BENCH],
          energyFilter: { energyType: EnergyType.BASIC, name: 'Psychic Energy' } });
    }
    return state;
  }
}