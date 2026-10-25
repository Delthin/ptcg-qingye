import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, EnergyType, Stage, SuperType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SEARCH_DISCARD_PILE_FOR_CARDS_TO_HAND, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Varoom extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [M];
  public hp: number = 60;
  public weakness = [{ type: R }];
  public resistance = [{ type: G, value: -30 }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Rev',
      cost: [C],
      damage: 0,
      text: 'Put up to 2 Basic Energy cards from your discard pile into your hand.',
    },
    {
      name: 'Headbutt',
      cost: [M, C],
      damage: 20,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAF';
  public setNumber: string = '64';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Varoom';
  public fullName: string = 'Varoom PAF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      // Rev: Put up to 2 Basic Energy cards from your discard pile into your hand.
      const basicEnergyFilter = {
        superType: SuperType.ENERGY,
        energyType: EnergyType.BASIC,
      };

      SEARCH_DISCARD_PILE_FOR_CARDS_TO_HAND(
        store,
        state,
        player,
        this,
        basicEnergyFilter,
        { min: 0, max: 2 },
      );
    }
    return state;
  }
}
