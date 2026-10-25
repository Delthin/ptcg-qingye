import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DealDamageEffect, PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { IS_ABILITY_BLOCKED } from '../../../game/store/prefabs/prefabs';

export class Dachsbun extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Fidough';
  public cardType: CardType[] = [P];
  public hp: number = 90;
  public weakness = [{ type: M }];
  public retreat = [C];

  public powers = [{
    name: 'Well-Baked Body',
    powerType: PowerType.ABILITY,
    text: 'This Pokémon can\'t be Burned. Prevent all damage done to this Pokémon by attacks from your opponent\'s Fire Pokémon.',
  }];

  public attacks = [{
    name: 'Headbutt Bounce',
    cost: [P, C, C],
    damage: 100,
    text: '',
  }];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '99';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Dachsbun';
  public fullName: string = 'Dachsbun SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Well-Baked Body: prevent all damage done to this Pokémon
    // by attacks from your opponent's [R] Pokémon.
    if (effect instanceof DealDamageEffect || effect instanceof PutDamageEffect) {
      if (effect.target.getPokemonCard() !== this) {
        return state;
      }

      const owner = StateUtils.findOwner(state, effect.target);

      if (IS_ABILITY_BLOCKED(store, state, owner, this)) {
        return state;
      }

      // Only damage coming from the opponent's Pokémon is prevented.
      if (effect.player === owner) {
        return state;
      }

      const attacker = effect.player.active.getPokemonCard();

      if (attacker !== undefined && attacker.cardType.includes(CardType.FIRE)) {
        effect.damage = 0;
      }
    }

    return state;
  }
}
