import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PlayerType, PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckProvidedEnergyEffect, CheckRetreatCostEffect } from '../../../game/store/effects/check-effects';
import { IS_ABILITY_BLOCKED } from '../../../game/store/prefabs/prefabs';

export class Latias extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 110;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];

  public powers = [{
    name: 'Mist Float',
    powerType: PowerType.ABILITY,
    text: 'If this Pokémon has any [P] Energy attached, it has no Retreat Cost.'
  }];

  public attacks = [{
    name: 'Psychic Sphere',
    cost: [P, P, C],
    damage: 100,
    text: ''
  }];

  public regulationMark = 'G';
  public set: string = 'SVP';
  public setNumber: string = '139';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Latias';
  public fullName: string = 'Latias SVP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (effect instanceof CheckRetreatCostEffect) {
      const player = effect.player;

      // Check to see if anything is blocking our Ability
      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, cardList => {
        if (cardList.getPokemonCard() === this) {

          const checkProvidedEnergy = new CheckProvidedEnergyEffect(player, cardList);
          state = store.reduceEffect(state, checkProvidedEnergy);

          checkProvidedEnergy.energyMap.forEach(energy => {
            if (energy.provides.includes(CardType.PSYCHIC)) {
              effect.cost = [];
              return state;
            }

            if (energy.provides.includes(CardType.ANY)) {
              effect.cost = [];
              return state;
            }
          });
        }
      });
    }

    return state;
  }
}
