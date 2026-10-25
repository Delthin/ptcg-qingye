import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, EnergyType } from '../../../game/store/card/card-types';
import { EnergyCard } from '../../../game/store/card/energy-card';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { MOVE_CARDS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class MowRotom extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 90;
  public weakness = [{ type: R }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Reaping Dash',
      cost: [C],
      damage: 30,
      text: 'Before doing damage, discard all Pokémon Tools and Special Energy from your opponent\'s Active Pokémon.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '8';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Mow Rotom';
  public fullName: string = 'Mow Rotom SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;
      const active = opponent.active;

      // `energies` is a card-list view of the attached Energy (its `filter` takes a
      // Partial<Card>, not a callback), so read the underlying card array.
      const energyList = active.energies as unknown as { cards: EnergyCard[] };
      const specialEnergy = energyList.cards.filter(
        card => card instanceof EnergyCard && card.energyType === EnergyType.SPECIAL,
      );
      const cardsToDiscard = [...active.tools, ...specialEnergy];

      if (cardsToDiscard.length > 0) {
        state = MOVE_CARDS(store, state, active, opponent.discard, { cards: cardsToDiscard });
      }
    }
    return state;
  }
}
