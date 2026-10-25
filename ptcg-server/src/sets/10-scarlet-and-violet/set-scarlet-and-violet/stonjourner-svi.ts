import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { IS_ABILITY_BLOCKED } from '../../../game/store/prefabs/prefabs';

export class Stonjourner extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 130;
  public weakness = [{ type: G }];
  public retreat = [C, C];

  public powers = [{
    name: 'Exoskeleton',
    powerType: PowerType.ABILITY,
    text: 'This Pokémon takes 20 less damage from attacks (after applying Weakness and Resistance).'
  }];

  public attacks = [{
    name: 'Mega Kick',
    cost: [F, C, C],
    damage: 100,
    text: ''
  }];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '121';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Stonjourner';
  public fullName: string = 'Stonjourner SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PutDamageEffect && effect.target.cards.includes(this)) {
      const player = StateUtils.findOwner(state, effect.target);

      // Check to see if anything is blocking our Ability
      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      // PutDamageEffect carries the damage after Weakness and Resistance are applied.
      effect.damage = Math.max(0, effect.damage - 20);
    }

    return state;
  }
}
