import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State, PowerType, StateUtils } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { AbstractAttackEffect, ApplyWeaknessEffect, DealDamageEffect, PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { IS_ABILITY_BLOCKED, IS_ATTACK_EFFECT_FROM_OPPONENTS_POKEMON } from '../../../game/store/prefabs/prefabs';


export class Kakuna extends PokemonCard {

  public stage: Stage = Stage.STAGE_1;

  public evolvesFrom = 'Weedle';

  public cardType: CardType[] = [CardType.GRASS];

  public hp: number = 80;

  public weakness = [{ type: CardType.FIRE }];

  public retreat = [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS];

  public powers = [{
    name: 'Cocoon Cover',
    powerType: PowerType.ABILITY,
    text: 'Prevent all effects of attacks used by your opponent\'s Pokémon done to this Pokémon. (Damage is not an effect.)'
  }];

  public attacks = [
    {
      name: 'Zzzt',
      cost: [CardType.COLORLESS, CardType.COLORLESS],
      damage: 20,
      text: ''
    }
  ];

  public regulationMark = 'G';

  public cardImage: string = 'assets/cardback.png';

  public set: string = 'MEW';

  public setNumber: string = '14';

  public name: string = 'Kakuna';

  public fullName: string = 'Kakuna MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Cocoon Cover: prevent effects of attacks from the opponent's Pokemon.
    if (effect instanceof AbstractAttackEffect && effect.target.cards.includes(this)) {
      const targetOwner = StateUtils.findOwner(state, effect.target);

      // If something is blocking this Pokemon's ability, Cocoon Cover does nothing.
      if (IS_ABILITY_BLOCKED(store, state, targetOwner, this)) {
        return state;
      }

      // Only effects from the opponent's Pokemon are prevented.
      if (!IS_ATTACK_EFFECT_FROM_OPPONENTS_POKEMON(state, effect)) {
        return state;
      }

      if (effect.source.getPokemonCard()) {
        // Allow Weakness & Resistance
        if (effect instanceof ApplyWeaknessEffect) {
          return state;
        }
        // Allow damage
        if (effect instanceof PutDamageEffect) {
          return state;
        }
        // Allow damage
        if (effect instanceof DealDamageEffect) {
          return state;
        }
        effect.preventDefault = true;
      }
    }

    return state;
  }

}
