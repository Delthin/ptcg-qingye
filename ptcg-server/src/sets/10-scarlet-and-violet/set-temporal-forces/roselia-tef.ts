import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { AfterDamageEffect } from '../../../game/store/effects/attack-effects';
import { ADD_POISON_TO_PLAYER_ACTIVE, IS_ABILITY_BLOCKED } from '../../../game/store/prefabs/prefabs';

export class Roselia extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 60;
  public weakness = [{ type: R }];
  public retreat = [C];

  public powers = [{
    name: 'Poison Point',
    powerType: PowerType.ABILITY,
    text: 'If this Pokémon is in the Active Spot and is damaged by an attack from your opponent\'s Pokémon (even if this Pokémon is Knocked Out), the Attacking Pokémon is now Poisoned.'
  }];

  public attacks = [{
    name: 'Leaf Step',
    cost: [C],
    damage: 10,
    text: ''
  }];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '8';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Roselia';
  public fullName: string = 'Roselia TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AfterDamageEffect && effect.target.getPokemonCard() === this) {
      const owner = StateUtils.findOwner(state, effect.target);

      // Poison Point only applies while this Pokémon is in the Active Spot.
      if (owner.active.getPokemonCard() !== this) {
        return state;
      }

      // Abilities can be shut off (e.g. Path to the Peak, Hex Maniac).
      if (IS_ABILITY_BLOCKED(store, state, owner, this)) {
        return state;
      }

      // The Attacking Pokémon is the opponent's Active Pokémon.
      const opponent = StateUtils.getOpponent(state, owner);
      ADD_POISON_TO_PLAYER_ACTIVE(store, state, opponent, this);
    }

    return state;
  }
}
