import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, EnergyType, Stage, SuperType } from '../../../game/store/card/card-types';
import { EnergyCard } from '../../../game/store/card/energy-card';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  HAS_CARD_IN_DISCARD,
  SEARCH_DISCARD_PILE_FOR_CARDS_TO_HAND,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Shroodle extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [D];
  public hp: number = 50;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Berry Search',
      cost: [C],
      damage: 0,
      text: 'Put a Basic Energy card from your discard pile into your hand.',
    },
    {
      name: 'Scratch',
      cost: [D],
      damage: 10,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '144';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Shroodle';
  public fullName: string = 'Shroodle PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      const hasBasicEnergyInDiscard = HAS_CARD_IN_DISCARD(
        player,
        {},
        card => card instanceof EnergyCard && card.energyType === EnergyType.BASIC,
      );

      if (!hasBasicEnergyInDiscard) {
        return state;
      }

      const basicEnergyFilter: Partial<EnergyCard> = {
        superType: SuperType.ENERGY,
        energyType: EnergyType.BASIC,
      };

      SEARCH_DISCARD_PILE_FOR_CARDS_TO_HAND(
        store,
        state,
        player,
        this,
        basicEnergyFilter,
        { min: 1, max: 1, allowCancel: false },
      );
    }

    return state;
  }
}
