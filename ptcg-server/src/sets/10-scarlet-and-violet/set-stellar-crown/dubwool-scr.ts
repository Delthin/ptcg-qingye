import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { PutDamageEffect } from '../../../game/store/effects/attack-effects';
import {
  CONFIRMATION_PROMPT, DISCARD_A_STADIUM_CARD_IN_PLAY, IS_ABILITY_BLOCKED, WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Dubwool extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Wooloo';
  public cardType: CardType[] = [C];
  public hp: number = 130;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public powers = [{
    name: 'Soft Wool',
    powerType: PowerType.ABILITY,
    text: 'This Pokémon takes 30 less damage from attacks (after applying Weakness and Resistance).'
  }];

  public attacks = [{
    name: 'Knock Over',
    cost: [C, C],
    damage: 70,
    text: 'You may discard a Stadium in play.'
  }];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '125';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Dubwool';
  public fullName: string = 'Dubwool SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Soft Wool: takes 30 less damage from attacks (after applying Weakness and Resistance).
    if (effect instanceof PutDamageEffect && effect.target.cards.includes(this)) {
      const player = StateUtils.findOwner(state, effect.target);

      // Check to see if anything is blocking our Ability
      if (!player || IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      effect.damage = Math.max(0, effect.damage - 30);
    }

    // Knock Over: you may discard a Stadium in play.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      CONFIRMATION_PROMPT(store, state, player, result => {
        if (result) {
          DISCARD_A_STADIUM_CARD_IN_PLAY(state);
        }
      });
    }

    return state;
  }
}
