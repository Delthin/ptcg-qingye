import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, EnergyType } from '../../../game/store/card/card-types';
import { EnergyCard } from '../../../game/store/card/energy-card';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ATTACH_X_TYPE_ENERGY_FROM_DISCARD_TO_1_OF_YOUR_POKEMON, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Jirachi extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [M];
  public hp: number = 80;
  public weakness = [{ type: R }];
  public resistance = [{ type: G, value: -30 }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Swelling Wish',
      cost: [C],
      damage: 0,
      text: 'Attach a Basic Energy card from your discard pile to 1 of your Benched Pokémon.'
    },
    {
      name: 'Slap',
      cost: [M, C],
      damage: 30,
      text: ''
    }
  ];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '98';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Jirachi';
  public fullName: string = 'Jirachi SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      const hasBasicEnergy = player.discard.cards.some(card =>
        card instanceof EnergyCard && card.energyType === EnergyType.BASIC);

      if (!hasBasicEnergy) {
        return state;
      }

      state = ATTACH_X_TYPE_ENERGY_FROM_DISCARD_TO_1_OF_YOUR_POKEMON(store, state, player, 1);
    }
    return state;
  }
}
