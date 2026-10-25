import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  COIN_FLIP_PROMPT, DEAL_DAMAGE, IS_ABILITY_BLOCKED, WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';
import { THIS_ATTACK_DOES_X_DAMAGE_TO_1_OF_YOUR_OPPONENTS_BENCHED_POKEMON } from '../../../game/store/prefabs/attack-effects';

export class Skiploom extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Hoppip';
  public cardType: CardType[] = [G];
  public hp: number = 70;
  public weakness = [{ type: R }];
  public retreat = [C];

  public powers = [{
    name: 'Drifting Dodge',
    powerType: PowerType.ABILITY,
    text: 'If any damage is done to this Pokémon by attacks, flip a coin. If heads, prevent that damage.',
  }];

  public attacks = [{
    name: 'Flowery Zephyr',
    cost: [G],
    damage: 30,
    text: 'This attack also does 30 damage to 1 of your opponent\'s Benched Pokémon. (Don\'t apply Weakness and Resistance for Benched Pokémon.)',
  }];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '2';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Skiploom';
  public fullName: string = 'Skiploom PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Drifting Dodge: flip a coin when damage is done to this Pokémon, preventing it on heads.
    if (DEAL_DAMAGE(effect) && effect.target && effect.target.cards.includes(this)) {
      const player = StateUtils.findOwner(state, effect.target);

      // Check to see if anything is blocking our Ability
      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      const damageEffect = effect;

      return COIN_FLIP_PROMPT(store, state, player, result => {
        if (result === true) {
          damageEffect.damage = 0;
        }
      });
    }

    // Flowery Zephyr
    if (WAS_ATTACK_USED(effect, 0, this)) {
      THIS_ATTACK_DOES_X_DAMAGE_TO_1_OF_YOUR_OPPONENTS_BENCHED_POKEMON(30, effect, store, state);
    }

    return state;
  }
}
