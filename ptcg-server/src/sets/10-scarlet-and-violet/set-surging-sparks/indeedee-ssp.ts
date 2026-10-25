import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { PlayPokemonEffect } from '../../../game/store/effects/play-card-effects';
import { CONFIRMATION_PROMPT, IS_ABILITY_BLOCKED } from '../../../game/store/prefabs/prefabs';

export class Indeedee extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 100;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public powers = [{
    name: 'Obliging Heal',
    powerType: PowerType.ABILITY,
    text: 'When you play this Pokémon from your hand onto your Bench during your turn, you may heal 30 damage from your Active Pokémon and have it recover from a Special Condition.',
  }];

  public attacks = [{
    name: 'Super Psy Bolt',
    cost: [P, C],
    damage: 50,
    text: '',
  }];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '93';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Indeedee';
  public fullName: string = 'Indeedee SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PlayPokemonEffect && effect.pokemonCard === this) {
      const player = effect.player;

      // 'onto your Bench': the ability does not trigger when this Pokémon is played as the Active Pokémon.
      if (player.bench.indexOf(effect.target) === -1) {
        return state;
      }

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      const active = player.active;

      // 'you may': optional effect, confirm before applying.
      return CONFIRMATION_PROMPT(store, state, player, (result: boolean) => {
        if (!result) {
          return;
        }

        active.damage = Math.max(0, active.damage - 30);
        active.specialConditions = [];
      });
    }

    return state;
  }
}
