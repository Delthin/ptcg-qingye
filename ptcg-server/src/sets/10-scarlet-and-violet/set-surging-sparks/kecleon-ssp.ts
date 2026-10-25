import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DealDamageEffect } from '../../../game/store/effects/attack-effects';
import { THIS_ATTACK_DOES_X_DAMAGE_TO_1_OF_YOUR_OPPONENTS_POKEMON } from '../../../game/store/prefabs/attack-effects';
import { COIN_FLIP_PROMPT, IS_ABILITY_BLOCKED, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Kecleon extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 70;
  public weakness = [{ type: F }];
  public retreat = [C];

  public powers = [{
    name: 'Expert Hider',
    powerType: PowerType.ABILITY,
    text: 'If any damage is done to this Pokémon by attacks, flip a coin. If heads, prevent that damage.'
  }];

  public attacks = [{
    name: 'Lick Whip',
    cost: [C, C],
    damage: 0,
    text: 'This attack does 30 damage to 1 of your opponent\'s Pokémon. (Don\'t apply Weakness and Resistance for Benched Pokémon.)'
  }];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '150';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Kecleon';
  public fullName: string = 'Kecleon SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Expert Hider: if any damage is done to this Pokémon by attacks, flip a coin.
    // If heads, prevent that damage.
    if (effect instanceof DealDamageEffect && effect.target.cards.includes(this)) {
      const player = StateUtils.findOwner(state, effect.target);

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      if (effect.damage === 0) {
        return state;
      }

      const damageEffect = effect;

      state = COIN_FLIP_PROMPT(store, state, player, result => {
        if (result) {
          damageEffect.damage = 0;
        }
      });
    }

    if (WAS_ATTACK_USED(effect, 0, this)) {
      return THIS_ATTACK_DOES_X_DAMAGE_TO_1_OF_YOUR_OPPONENTS_POKEMON(30, effect, store, state);
    }

    return state;
  }
}
