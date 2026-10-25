import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DealDamageEffect, PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { THIS_ATTACK_DOES_X_DAMAGE_TO_1_OF_YOUR_OPPONENTS_BENCHED_POKEMON } from '../../../game/store/prefabs/attack-effects';
import { COIN_FLIP_PROMPT, IS_ABILITY_BLOCKED, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Jumpluff extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Skiploom';
  public cardType: CardType[] = [G];
  public hp: number = 90;
  public weakness = [{ type: R }];
  public retreat = [C];

  public powers = [{
    name: 'Drifting Dodge',
    powerType: PowerType.ABILITY,
    text: 'If any damage is done to this Pokémon by attacks, flip a coin. If heads, prevent that damage.'
  }];

  public attacks = [{
    name: 'Fluffy Breeze',
    cost: [G],
    damage: 60,
    text: 'This attack also does 30 damage to 1 of your opponent\'s Benched Pokémon. (Don\'t apply Weakness and Resistance for Benched Pokémon.)'
  }];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '3';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Jumpluff';
  public fullName: string = 'Jumpluff PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Drifting Dodge: any attack damage dealt to this Pokémon is prevented on a heads coin flip.
    if ((effect instanceof DealDamageEffect || effect instanceof PutDamageEffect) && effect.target.cards.includes(this)) {
      const damageEffect: DealDamageEffect | PutDamageEffect = effect;
      const player = StateUtils.findOwner(state, damageEffect.target);

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      return COIN_FLIP_PROMPT(store, state, player, result => {
        if (result) {
          damageEffect.preventDefault = true;
        }
      });
    }

    if (WAS_ATTACK_USED(effect, 0, this)) {
      THIS_ATTACK_DOES_X_DAMAGE_TO_1_OF_YOUR_OPPONENTS_BENCHED_POKEMON(30, effect, store, state);
    }

    return state;
  }
}
