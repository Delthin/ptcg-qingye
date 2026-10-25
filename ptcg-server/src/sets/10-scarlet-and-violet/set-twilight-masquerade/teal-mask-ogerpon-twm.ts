import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Card } from '../../../game/store/card/card';
import { Stage, CardType, EnergyType, SuperType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  SEARCH_DECK_FOR_CARDS_TO_HAND,
  SHUFFLE_DECK,
  THIS_ATTACK_DOES_X_MORE_DAMAGE,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class TealMaskOgerpon extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 110;
  public weakness = [{ type: R }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Mountain Stroll',
      cost: [C],
      damage: 0,
      text: 'Search your deck for up to 2 Basic Energy cards, reveal them, and put them into your hand. Then, shuffle your deck.',
    },
    {
      name: 'Ogre Comeback',
      cost: [G, C],
      damage: 20,
      damageCalculation: '+',
      text: 'This attack does 20 more damage for each of your opponent\'s Benched Pokémon.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '24';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Teal Mask Ogerpon';
  public fullName: string = 'Teal Mask Ogerpon TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const basicEnergyFilter = {
        superType: SuperType.ENERGY,
        energyType: EnergyType.BASIC,
      } as Partial<Card>;

      SEARCH_DECK_FOR_CARDS_TO_HAND(store, state, player, this, basicEnergyFilter, { min: 0, max: 2 });
      SHUFFLE_DECK(store, state, player);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      const benchedCount = effect.opponent.bench.filter(slot => slot.cards.length > 0).length;
      THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 20 * benchedCount);
    }

    return state;
  }
}
