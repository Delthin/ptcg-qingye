import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { PlayerType, PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { HealEffect } from '../../../game/store/effects/game-effects';
import {
  ABILITY_USED, IS_ABILITY_BLOCKED, USE_ABILITY_ONCE_PER_TURN, WAS_ATTACK_USED, WAS_POWER_USED,
} from '../../../game/store/prefabs/prefabs';
import { PREVENT_EFFECTS_OF_ATTACKS } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Altariaex extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Swablu';
  public cardType: CardType[] = [N];
  public hp: number = 260;
  public retreat = [C];
  protected _tags = [CardTag.POKEMON_ex];

  public powers = [{
    name: 'Humming Heal',
    powerType: PowerType.ABILITY,
    text: 'Once during your turn, you may heal 20 damage from each of your Pokémon.',
  }];

  public attacks = [{
    name: 'Light Pulse',
    cost: [W, M],
    damage: 140,
    text: 'During your opponent\'s next turn, prevent all effects of attacks used by your opponent\'s Pokémon done to this Pokémon. (Damage is not an effect.)',
  }];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '140';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Altaria ex';
  public fullName: string = 'Altaria ex PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Humming Heal: once during your turn, heal 20 damage from each of your Pokémon.
    if (WAS_POWER_USED(effect, 0, this)) {
      const player = effect.player;

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      USE_ABILITY_ONCE_PER_TURN(player, 'HUMMING_HEAL', this);
      ABILITY_USED(player, this);

      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, pokemon => {
        if (pokemon.damage > 0) {
          const healEffect = new HealEffect(player, pokemon, 20);
          state = store.reduceEffect(state, healEffect);
        }
      });

      return state;
    }

    // Light Pulse: prevent all effects of opponent's attacks done to this Pokémon next turn.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = PREVENT_EFFECTS_OF_ATTACKS(store, state, effect, this);
    }

    return state;
  }
}
