import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { IS_ABILITY_BLOCKED } from '../../../game/store/prefabs/prefabs';

export class Furfrou extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 100;
  public weakness = [{ type: F }];
  public retreat = [C];

  public powers = [{
    name: 'Fur Coat',
    powerType: PowerType.ABILITY,
    text: 'This Pokémon takes 20 less damage from attacks (after applying Weakness and Resistance).'
  }];

  public attacks = [{
    name: 'Bite',
    cost: [C, C, C],
    damage: 80,
    text: ''
  }];

  public regulationMark = 'H';
  public set: string = 'PRE';
  public setNumber: string = '88';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Furfrou';
  public fullName: string = 'Furfrou PRE';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PutDamageEffect && effect.target.cards.includes(this)) {
      const player = StateUtils.findOwner(state, effect.target);

      // Check to see if anything is blocking our Ability
      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      effect.damage = Math.max(0, effect.damage - 20);
    }
    return state;
  }
}
