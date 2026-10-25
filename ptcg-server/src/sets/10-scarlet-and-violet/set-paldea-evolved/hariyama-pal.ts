import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DealDamageEffect, PutDamageEffect } from '../../../game/store/effects/attack-effects';
import { IS_ABILITY_BLOCKED, IS_ATTACK_EFFECT_FROM_OPPONENTS_POKEMON } from '../../../game/store/prefabs/prefabs';

export class Hariyama extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Makuhita';
  public cardType: CardType[] = [F];
  public hp: number = 140;
  public weakness = [{ type: P }];
  public retreat = [C, C, C];

  public powers = [{
    name: 'Arm Thrust Practice',
    powerType: PowerType.ABILITY,
    text: 'All of your Pokémon take 10 less damage from attacks from your opponent\'s Pokémon (after applying Weakness and Resistance).',
  }];

  public attacks = [{
    name: 'Rocket Slap',
    cost: [F, C, C],
    damage: 120,
    text: '',
  }];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '113';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Hariyama';
  public fullName: string = 'Hariyama PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (!(effect instanceof DealDamageEffect || effect instanceof PutDamageEffect)) {
      return state;
    }

    const targetCard = effect.target.getPokemonCard();
    if (targetCard === undefined) {
      return state;
    }

    for (const player of state.players) {
      // The Ability only works while this Hariyama is in play on the damaged Pokémon's side.
      const hariyamaInPlay = player.active.getPokemonCard() === this ||
        player.bench.some(bench => bench.getPokemonCard() === this);

      if (!hariyamaInPlay) {
        continue;
      }

      const targetIsOwnPokemon = player.active === effect.target ||
        player.bench.includes(effect.target);

      if (!targetIsOwnPokemon) {
        continue;
      }

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        continue;
      }

      if (!IS_ATTACK_EFFECT_FROM_OPPONENTS_POKEMON(state, effect)) {
        continue;
      }

      effect.damage = Math.max(0, effect.damage - 10);
      break;
    }

    return state;
  }
}
