import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, EnergyType, Stage, SuperType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SEARCH_DISCARD_PILE_FOR_CARDS_TO_HAND, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Nosepass extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 90;
  public weakness = [{ type: G }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Iron Collecting',
      cost: [C],
      damage: 0,
      text: 'Put up to 2 Basic Metal Energy cards from your discard pile into your hand.',
    },
    {
      name: 'Rolling Tackle',
      cost: [C, C],
      damage: 30,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '107';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Nosepass';
  public fullName: string = 'Nosepass OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      const basicMetalEnergyFilter = {
        superType: SuperType.ENERGY,
        energyType: EnergyType.BASIC,
        provides: [CardType.METAL],
      };

      // Reveals the chosen cards to the opponent and puts them into this player's hand.
      SEARCH_DISCARD_PILE_FOR_CARDS_TO_HAND(
        store, state, player, this, basicMetalEnergyFilter,
        { min: 0, max: 2, allowCancel: false },
      );
    }

    return state;
  }
}
