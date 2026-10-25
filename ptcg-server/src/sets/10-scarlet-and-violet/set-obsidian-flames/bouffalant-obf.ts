import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { IS_ABILITY_BLOCKED, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { FLIP_A_COIN_UNTIL_YOU_GET_TAILS_DO_X_MORE_DAMAGE_PER_HEADS } from '../../../game/store/prefabs/attack-effects';

export class Bouffalant extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 120;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public powers = [{
    name: 'Bouffer',
    powerType: PowerType.ABILITY,
    text: 'This Pokémon takes 20 less damage from attacks (after applying Weakness and Resistance).'
  }];

  public attacks = [{
    name: 'Damage Rush',
    cost: [C, C],
    damage: 50,
    damageCalculation: '+',
    text: 'Flip a coin until you get tails. This attack does 30 more damage for each heads.'
  }];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '174';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Bouffalant';
  public fullName: string = 'Bouffalant OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Bouffer: -20 damage from attacks, applied after Weakness and Resistance.
    if (effect instanceof PutDamageEffect && effect.target.cards.includes(this)) {
      const player = StateUtils.findOwner(state, effect.target);

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      effect.damage = Math.max(0, effect.damage - 20);
      return state;
    }

    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = FLIP_A_COIN_UNTIL_YOU_GET_TAILS_DO_X_MORE_DAMAGE_PER_HEADS(store, state, effect, 30);
    }

    return state;
  }
}
