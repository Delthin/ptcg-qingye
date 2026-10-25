import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckProvidedEnergyEffect } from '../../../game/store/effects/check-effects';
import {
  MOVE_DAMAGE_COUNTERS,
  THIS_ATTACK_DOES_X_MORE_DAMAGE,
  WAS_ATTACK_USED,
  WAS_POWER_USED,
} from '../../../game/store/prefabs/prefabs';

export class TeamRocketsOrbeetle extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = "Team Rocket's Dottler";
  public cardType: CardType[] = [P];
  public hp: number = 130;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];

  public powers = [{
    name: 'Rocket Brain',
    powerType: PowerType.ABILITY,
    text: "As often as you like during your turn, you may move 1 damage counter from 1 of your Team Rocket's Pokémon to another of your Pokémon.",
  }];

  public attacks = [{
    name: 'Psychic',
    cost: [P, C, C],
    damage: 40,
    damageCalculation: '+',
    text: "This attack does 40 more damage for each Energy attached to your opponent's Active Pokémon.",
  }];

  public regulationMark = 'I';
  public set: string = 'DRI';
  public setNumber: string = '89';
  public cardImage: string = 'assets/cardback.png';
  public name: string = "Team Rocket's Orbeetle";
  public fullName: string = "Team Rocket's Orbeetle DRI";

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Rocket Brain: as often as you like, move exactly 1 damage counter off a
    // damaged Team Rocket's Pokémon onto another of your Pokémon.
    if (WAS_POWER_USED(effect, 0, this)) {
      const player = effect.player;

      const isTeamRocketsPokemon = (cardList: typeof player.active): boolean => {
        const card = cardList.getPokemonCard();
        return card !== undefined && card.name.startsWith("Team Rocket's");
      };

      // Only Team Rocket's Pokémon may supply the counter.
      const options = {
        origin: effect,
        min: 1,
        max: 1,
        sourceFilter: (cardList: typeof player.active) =>
          cardList.damage > 0 && isTeamRocketsPokemon(cardList),
      };

      return MOVE_DAMAGE_COUNTERS(store, state, player, options);
    }

    // Psychic: 40 damage plus 40 more for each Energy on the opponent's Active Pokémon.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;

      const checkProvidedEnergy = new CheckProvidedEnergyEffect(opponent, opponent.active);
      state = store.reduceEffect(state, checkProvidedEnergy);

      const energyCount = checkProvidedEnergy.energyMap.length;
      if (energyCount > 0) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 40 * energyCount);
      }
    }

    return state;
  }
}
