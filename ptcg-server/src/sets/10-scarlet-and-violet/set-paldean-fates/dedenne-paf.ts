import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { EnergyCard } from '../../../game/store/card/energy-card';
import { CardType, EnergyType, Stage, SuperType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  SEARCH_DECK_FOR_CARDS_TO_HAND,
  SWITCH_ACTIVE_WITH_BENCHED,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Dedenne extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 70;
  public weakness = [{ type: M }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Minor Errand-Running',
      cost: [P],
      damage: 0,
      text: 'Search your deck for up to 2 Basic Energy cards, reveal them, and put them into your hand. Then, shuffle your deck.'
    },
    {
      name: 'Spin Turn',
      cost: [P, C],
      damage: 50,
      text: 'Switch this Pokémon with 1 of your Benched Pokémon.'
    }
  ];

  public regulationMark = 'G';
  public set: string = 'PAF';
  public setNumber: string = '36';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Dedenne';
  public fullName: string = 'Dedenne PAF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      const filter: Partial<EnergyCard> = {
        superType: SuperType.ENERGY,
        energyType: EnergyType.BASIC
      };

      // Reveals the chosen cards to the opponent and shuffles the deck afterwards.
      SEARCH_DECK_FOR_CARDS_TO_HAND(
        store, state, player, this, filter,
        { min: 0, max: 2, allowCancel: false }, effect);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;

      const hasBenched = player.bench.some(bench => bench.cards.length > 0);
      if (hasBenched) {
        state = SWITCH_ACTIVE_WITH_BENCHED(store, state, player) ?? state;
      }
    }

    return state;
  }
}
