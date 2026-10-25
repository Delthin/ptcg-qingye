import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { CheckPokemonTypeEffect } from '../../../game/store/effects/check-effects';
import { IS_ABILITY_BLOCKED, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Scovillain extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Capsakid';
  public cardType: CardType[] = [G];
  public hp: number = 110;
  public weakness = [{ type: R }];
  public retreat = [C, C];

  public powers = [{
    name: 'Double Type',
    powerType: PowerType.ABILITY,
    text: 'As long as this Pokémon is in play, it is Grass and Fire type.'
  }];

  public attacks = [{
    name: 'Spicy Headbutt',
    cost: [G, C, C],
    damage: 110,
    text: 'This attack\'s damage isn\'t affected by Resistance.'
  }];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '25';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Scovillain';
  public fullName: string = 'Scovillain OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Double Type: as long as this Pokemon is in play, it is Grass and Fire type.
    if (effect instanceof CheckPokemonTypeEffect) {
      if (effect.target.getPokemonCard() !== this) {
        return state;
      }

      const player = StateUtils.findOwner(state, effect.target);

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      effect.cardTypes = [G, R];
    }

    // Spicy Headbutt: this attack's damage isn't affected by Resistance.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      effect.ignoreResistance = true;
    }

    return state;
  }
}
