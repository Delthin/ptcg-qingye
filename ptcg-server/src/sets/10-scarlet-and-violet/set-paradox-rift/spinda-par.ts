import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, SpecialCondition, Stage } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DealDamageEffect, PutDamageEffect } from '../../../game/store/effects/attack-effects';
import {
  ADD_CONFUSION_TO_PLAYER_ACTIVE,
  COIN_FLIP_PROMPT,
  IS_ABILITY_BLOCKED,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Spinda extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 80;
  public weakness = [{ type: F }];
  public retreat = [C];

  public powers = [{
    name: 'Tangled Feet',
    powerType: PowerType.ABILITY,
    text: 'If this Pokémon is Confused and is damaged by an attack, flip a coin. If heads, prevent that damage.'
  }];

  public attacks = [{
    name: 'Teetering Steps',
    cost: [C, C, C],
    damage: 100,
    text: 'This Pokémon is now Confused.'
  }];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '151';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Spinda';
  public fullName: string = 'Spinda PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Tangled Feet: while this Pokémon is Confused, flip a coin when it is damaged
    // by an attack; on heads the damage is prevented.
    if ((effect instanceof DealDamageEffect || effect instanceof PutDamageEffect)
      && effect.target.getPokemonCard() === this) {
      const player = StateUtils.findOwner(state, effect.target);

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      if (effect.target.specialConditions.includes(SpecialCondition.CONFUSED)) {
        state = COIN_FLIP_PROMPT(store, state, player, result => {
          if (result) {
            effect.damage = 0;
          }
        });
      }
    }

    // Teetering Steps: this Pokémon is now Confused.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      ADD_CONFUSION_TO_PLAYER_ACTIVE(store, state, effect.player, this);
    }

    return state;
  }
}
