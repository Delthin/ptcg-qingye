import { ON_DAMAGED_BY_OPPONENT_ATTACK_EVEN_IF_KNOCKED_OUT } from '../../../game/store/prefabs/prefabs';
import { putPokemonPowerDamageCounters } from '../../../game/store/prefabs/damage-counter-effects';
import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { AfterDamageEffect } from '../../../game/store/effects/attack-effects';
import { IS_ABILITY_BLOCKED, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { BLOCK_RETREAT } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Stunfisk extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 120;
  public weakness = [{ type: G }];
  public retreat = [C, C, C];

  public powers = [{
    name: 'Custom Trap',
    powerType: PowerType.ABILITY,
    text: 'If this Pokémon is in the Active Spot, has a Pokémon Tool attached, and is damaged by an attack from your opponent\'s Pokémon (even if this Pokémon is Knocked Out), put 5 damage counters on the Attacking Pokémon.',
  }];

  public attacks = [{
    name: 'Rumble',
    cost: [F],
    damage: 30,
    text: 'During your opponent\'s next turn, the Defending Pokémon can\'t retreat.',
  }];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '112';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Stunfisk';
  public fullName: string = 'Stunfisk OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      return BLOCK_RETREAT(store, state, effect, this);
    }

    if ((effect instanceof AfterDamageEffect) && ON_DAMAGED_BY_OPPONENT_ATTACK_EVEN_IF_KNOCKED_OUT(state, effect, { source: this, requireActiveSpot: true })) {
      const target = effect.target;

      if (target.getPokemonCard() !== this) {
        return state;
      }

      // Custom Trap only applies while this Pokémon is in the Active Spot.
      const owner = state.players.find(player => player.active === target);
      if (owner === undefined || target.tools.length === 0) {
        return state;
      }

      if (IS_ABILITY_BLOCKED(store, state, owner, this)) {
        return state;
      }

      // Attacks come from the opponent's Active Pokémon.
      const attacker = state.players.find(player => player !== owner)?.active;
      if (attacker === undefined || attacker.cards.length === 0) {
        return state;
      }

      // Put 5 damage counters (= 50 damage) on the Attacking Pokémon.
      state = putPokemonPowerDamageCounters(store, state, this, attacker, 50);

      return state;
    }

    return state;
  }
}
