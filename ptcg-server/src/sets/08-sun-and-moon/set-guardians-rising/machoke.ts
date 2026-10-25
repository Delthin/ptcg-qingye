import { PlaceDamageCountersEffect } from '../../../game/store/effects/game-effects';
import { IS_ABILITY_BLOCKED } from '../../../game/store/prefabs/prefabs';
import { PlayerType, PowerType, StateUtils } from '../../..';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { PutCountersEffect, PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { Effect } from '../../../game/store/effects/effect';
import { State } from '../../../game/store/state/state';
import { StoreLike } from '../../../game/store/store-like';
import { WAS_ATTACK_USED, COIN_FLIP_PROMPT } from '../../../game/store/prefabs/prefabs';

export class Machoke extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Machop';
  public cardType: CardType[] = [F];
  public hp: number = 100;
  public weakness = [{ type: P }];
  public retreat = [C, C, C];

  public powers = [{
    name: 'Daunting Pose',
    powerType: PowerType.ABILITY,
    text: 'Prevent all damage done to your Benched Pokémon by your opponent\'s attacks. Your opponent\'s attacks and Abilities can\'t put damage counters on your Benched Pokémon.'
  }];

  public attacks = [{
    name: 'Cross Chop',
    cost: [F, F],
    damage: 30,
    text: 'Flip a coin. If heads, this attack does 30 more damage.'
  }];

  public set: string = 'GRI';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '64';
  public name: string = 'Machoke';
  public fullName: string = 'Machoke GRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_ATTACK_USED(effect, 0, this)) {

      const player = effect.player;

      return COIN_FLIP_PROMPT(store, state, player, result => {
        if (result) {
          effect.damage += 30;
        }
      });
    }

    if (effect instanceof PutDamageEffect || effect instanceof PutCountersEffect || (effect instanceof PlaceDamageCountersEffect && effect.origin === 'ability')) {
      const owner = StateUtils.findOwner(state, effect.target);
      if (owner === effect.player || effect.target === owner.active) return state;
      let inPlay = false;
      owner.forEachPokemon(PlayerType.BOTTOM_PLAYER, (_list, card) => { if (card === this) inPlay = true; });
      if (!inPlay || IS_ABILITY_BLOCKED(store, state, owner, this)) return state;
      effect.preventDefault = true;
    }
    return state;
  }

}