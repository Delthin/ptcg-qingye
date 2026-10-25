import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, EnergyType } from '../../../game/store/card/card-types';
import { State, StoreLike, SlotType } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { LOOK_AT_TOP_X_CARDS_AND_ATTACH_UP_TO_Y_ENERGY, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Dondozo extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 160;
  public weakness = [{ type: L }];
  public retreat = [C, C, C, C];

  public attacks = [
    {
      name: 'Supplemental Swallow-Up',
      cost: [C],
      damage: 0,
      text: 'Look at the top 5 cards of your deck. You may attach any number of Basic Energy cards you find there to this Pokémon. Shuffle the other cards back into your deck.',
    },
    {
      name: 'Hydro Splash',
      cost: [W, C, C, C, C],
      damage: 180,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '55';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Dondozo';
  public fullName: string = 'Dondozo PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      return LOOK_AT_TOP_X_CARDS_AND_ATTACH_UP_TO_Y_ENERGY(store, state, player, 5, 5,
        { destinationSlots: [SlotType.ACTIVE], energyFilter: { energyType: EnergyType.BASIC } });
    }
    return state;
  }
}
