import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, SpecialCondition, Stage } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { HealEffect } from '../../../game/store/effects/game-effects';
import { BetweenTurnsEffect } from '../../../game/store/effects/game-phase-effects';
import { ADD_SLEEP_TO_PLAYER_ACTIVE, IS_ABILITY_BLOCKED, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Snorlax extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 160;
  public weakness = [{ type: F }];
  public retreat = [C, C, C, C];

  public powers = [{
    name: 'Good Sleep',
    powerType: PowerType.ABILITY,
    text: 'If this Pokémon remains Asleep during Pokémon Checkup, heal all damage from this Pokémon.'
  }];

  public attacks = [{
    name: 'Collapse',
    cost: [C, C, C],
    damage: 130,
    text: 'This Pokémon is now Asleep.'
  }];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '119';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Snorlax';
  public fullName: string = 'Snorlax 30C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Good Sleep: during Pokémon Checkup, if this Pokémon is still Asleep (it did not
    // recover from the Special Condition), heal all damage from it.
    if (effect instanceof BetweenTurnsEffect) {
      state.players.forEach(player => {
        const cardList = player.active;

        // Special Conditions only apply to the Active Pokémon.
        if (cardList.getPokemonCard() !== this) {
          return;
        }

        if (!cardList.specialConditions.includes(SpecialCondition.ASLEEP)) {
          return;
        }

        // Check to see if anything is blocking our Ability
        if (IS_ABILITY_BLOCKED(store, state, player, this)) {
          return;
        }

        const damage = cardList.damage;
        if (damage > 0) {
          state = store.reduceEffect(state, new HealEffect(player, cardList, damage));
        }
      });
    }

    // Collapse
    if (WAS_ATTACK_USED(effect, 0, this)) {
      ADD_SLEEP_TO_PLAYER_ACTIVE(store, state, effect.player, this);
    }

    return state;
  }
}
