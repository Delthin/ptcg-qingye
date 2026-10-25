import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DealDamageEffect } from '../../../game/store/effects/attack-effects';
import { CheckHpEffect } from '../../../game/store/effects/check-effects';
import {
  COIN_FLIP_PROMPT,
  DISCARD_TOP_X_OF_OPPONENTS_DECK,
  IS_ABILITY_BLOCKED,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Machamp extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Machoke';
  public cardType: CardType[] = [F];
  public hp: number = 180;
  public weakness = [{ type: P }];
  public retreat = [C, C];

  public powers = [{
    name: 'Guts',
    powerType: PowerType.ABILITY,
    text: 'If this Pokémon would be Knocked Out by damage from an attack, flip a coin. ' +
      'If heads, this Pokémon is not Knocked Out, and its remaining HP becomes 10.'
  }];

  public attacks = [{
    name: 'Mountain Chopping',
    cost: [F, F],
    damage: 100,
    text: 'Discard the top 2 cards of your opponent\'s deck.'
  }];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '68';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Machamp';
  public fullName: string = 'Machamp MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Guts: if this Pokemon would be Knocked Out by damage from an attack,
    // flip a coin. If heads, it is not Knocked Out and its remaining HP becomes 10.
    if (effect instanceof DealDamageEffect && effect.target.getPokemonCard() === this) {
      const player = StateUtils.findOwner(state, effect.target);

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      const checkHpEffect = new CheckHpEffect(player, effect.target);
      state = store.reduceEffect(state, checkHpEffect);

      const remainingHp = checkHpEffect.hp - effect.target.damage;

      if (effect.damage > 0 && effect.damage >= remainingHp) {
        state = COIN_FLIP_PROMPT(store, state, player, result => {
          if (result) {
            effect.damage = Math.max(0, remainingHp - 10);
          }
        });
      }

      return state;
    }

    if (WAS_ATTACK_USED(effect, 0, this)) {
      DISCARD_TOP_X_OF_OPPONENTS_DECK(store, state, effect.player, 2, this, effect);
    }

    return state;
  }
}
