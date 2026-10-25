import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, EnergyType } from '../../../game/store/card/card-types';
import { EnergyCard, SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ATTACH_X_TYPE_ENERGY_FROM_DISCARD_TO_1_OF_YOUR_POKEMON,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Furfrou extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 100;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Energy Assist',
      cost: [C],
      damage: 30,
      text: 'Attach a Basic Energy card from your discard pile to 1 of your Benched Pokémon.'
    }
  ];

  public regulationMark = 'H';
  public set: string = 'SFA';
  public setNumber: string = '51';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Furfrou';
  public fullName: string = 'Furfrou SFA';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      if (player.discard.cards.some(c => c instanceof EnergyCard && c.energyType === EnergyType.BASIC)
        && player.bench.some(b => b.getPokemonCard() !== undefined)) {
        state = ATTACH_X_TYPE_ENERGY_FROM_DISCARD_TO_1_OF_YOUR_POKEMON(store, state, player, 1, undefined, {
          destinationSlots: [SlotType.BENCH],
          energyFilter: { energyType: EnergyType.BASIC }
        });
      }
    }
    return state;
  }
}
