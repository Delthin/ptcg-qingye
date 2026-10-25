import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ADD_SLEEP_TO_PLAYER_ACTIVE,
  IS_ABILITY_BLOCKED,
  USE_ABILITY_ONCE_PER_TURN,
  WAS_ATTACK_USED,
  WAS_POWER_USED,
} from '../../../game/store/prefabs/prefabs';
import { FLIP_A_COIN_UNTIL_YOU_GET_TAILS_DO_X_MORE_DAMAGE_PER_HEADS } from '../../../game/store/prefabs/attack-effects';

export class Shiinotic extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Morelull';
  public cardType: CardType[] = [G];
  public hp: number = 110;
  public weakness = [{ type: R }];
  public retreat = [C, C];

  public powers = [{
    name: 'Calming Light',
    powerType: PowerType.ABILITY,
    text: 'Once during your turn, if this Pokémon is in the Active Spot, you may make your opponent\'s Active Pokémon Asleep.',
  }];

  public attacks = [{
    name: 'Spiral Rush',
    cost: [G, C],
    damage: 60,
    damageCalculation: '+',
    text: 'Flip a coin until you get tails. This attack does 30 more damage for each heads.',
  }];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '9';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Shiinotic';
  public fullName: string = 'Shiinotic SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Calming Light
    if (WAS_POWER_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      // Only works while this Pokémon is in the Active Spot.
      if (player.active.getPokemonCard() !== this) {
        return state;
      }

      USE_ABILITY_ONCE_PER_TURN(player, 'CALMING_LIGHT', this);

      ADD_SLEEP_TO_PLAYER_ACTIVE(store, state, opponent, this);
    }

    // Spiral Rush
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = FLIP_A_COIN_UNTIL_YOU_GET_TAILS_DO_X_MORE_DAMAGE_PER_HEADS(store, state, effect, 30);
    }

    return state;
  }
}
