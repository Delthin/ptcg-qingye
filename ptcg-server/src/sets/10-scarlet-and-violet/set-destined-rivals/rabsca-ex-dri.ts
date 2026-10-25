import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import { MOVE_CARDS, THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Rabscaex extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Rellor';
  public cardType: CardType[] = [G];
  public hp: number = 250;
  public weakness = [{ type: R }];
  public retreat = [C];

  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Upside-Down Draw',
      cost: [C],
      damage: 0,
      text: 'Draw 3 cards from the bottom of your deck.',
    },
    {
      name: 'Psychic',
      cost: [G, C, C],
      damage: 20,
      damageCalculation: '+',
      text: 'This attack does 90 more damage for each Energy attached to your opponent\'s Active Pokémon.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'DRI';
  public setNumber: string = '25';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Rabsca ex';
  public fullName: string = 'Rabsca ex DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Upside-Down Draw: Draw 3 cards from the bottom of your deck.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const deckCards = player.deck.cards;
      const count = Math.min(3, deckCards.length);

      if (count > 0) {
        const bottomCards = deckCards.slice(deckCards.length - count);
        state = MOVE_CARDS(store, state, player.deck, player.hand, { cards: bottomCards });
      }
    }

    // Psychic: 20+ damage, 90 more for each Energy on the opponent's Active Pokémon.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const opponent = effect.opponent;

      const checkProvidedEnergy = new CheckProvidedEnergyEffect(opponent, opponent.active);
      state = store.reduceEffect(state, checkProvidedEnergy);

      const energiesAttached = checkProvidedEnergy.energyMap.length;

      if (energiesAttached > 0) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 90 * energiesAttached);
      }
    }

    return state;
  }
}
