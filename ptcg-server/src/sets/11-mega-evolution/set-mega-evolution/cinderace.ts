import {
  PowerType,
  SlotType,
  State,
  StoreLike,
} from '../../../game';
import {
  CardTag,
  CardType,
  EnergyType,
  Stage,
} from '../../../game/store/card/card-types';
import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Effect } from '../../../game/store/effects/effect';
import { ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Cinderace extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom: string = 'Raboot';
  protected _tags = [CardTag.PLAY_DURING_SETUP];
  public cardType: CardType[] = [R];
  public hp: number = 160;
  public weakness = [{ type: W }];
  public retreat = [];

  public powers = [
    {
      name: 'Explosiveness',
      powerType: PowerType.ABILITY,
      text: 'If this Pokémon is in your hand when you are setting up to play, you may put it face down as your Active Pokémon.',
    },
  ];

  public attacks = [
    {
      name: 'Flame Turbo',
      cost: [C],
      damage: 50,
      text: 'Search your deck for up to 3 Basic Energy cards and attach them to your Benched Pokémon in any way you like. Then, shuffle your deck.',
    },
  ];

  public set: string = 'MEG';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '28';
  public name: string = 'Cinderace';
  public fullName: string = 'Cinderace M1L';
  public regulationMark = 'I';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      return ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON(store, state, player, 3, 3,
        { destinationSlots: [SlotType.BENCH], energyFilter: { energyType: EnergyType.BASIC } });
    }

    return state;
  }
}
