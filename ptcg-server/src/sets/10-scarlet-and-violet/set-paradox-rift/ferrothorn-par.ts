import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { PutDamageEffect } from '../../../game/store/effects/attack-effects';
import {
  ADD_MARKER, HAS_MARKER, IS_ABILITY_BLOCKED, THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

const EXOSKELETON_REDUCTION = 30;
const SPINNING_NEEDLES_BONUS = 100;
const SPINNING_NEEDLES_MARKER = 'SPINNING_NEEDLES_BONUS';

export class Ferrothorn extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Ferroseed';
  public cardType: CardType[] = [M];
  public hp: number = 140;
  public weakness = [{ type: R }];
  public resistance = [{ type: G, value: -30 }];
  public retreat = [C, C, C];

  public powers = [{
    name: 'Exoskeleton',
    powerType: PowerType.ABILITY,
    text: 'This Pokémon takes 30 less damage from attacks (after applying Weakness and Resistance).'
  }];

  public attacks = [{
    name: 'Spinning Needles',
    cost: [M, C],
    damage: 50,
    text: 'During your next turn, this Pokémon\'s Spinning Needles attack does 100 more damage (before applying Weakness and Resistance).'
  }];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '128';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Ferrothorn';
  public fullName: string = 'Ferrothorn PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Exoskeleton: this Pokémon takes 30 less damage from attacks (after Weakness and Resistance).
    if (effect instanceof PutDamageEffect && effect.target.cards.includes(this)) {
      const player = StateUtils.findOwner(state, effect.target);

      if (!player || IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      effect.damage = Math.max(0, effect.damage - EXOSKELETON_REDUCTION);
    }

    // Spinning Needles: the bonus armed by the previous use applies during your next turn.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      if (HAS_MARKER(SPINNING_NEEDLES_MARKER, player, this)) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, SPINNING_NEEDLES_BONUS);
      }

      ADD_MARKER(SPINNING_NEEDLES_MARKER, player, this);
    }

    return state;
  }
}
