import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ABILITY_USED, ADD_POISON_TO_PLAYER_ACTIVE, ADD_SLEEP_TO_PLAYER_ACTIVE,
  COIN_FLIP_PROMPT, IS_ABILITY_BLOCKED, SWITCH_IN_OPPONENT_BENCHED_POKEMON,
  USE_ABILITY_ONCE_PER_TURN, WAS_POWER_USED
} from '../../../game/store/prefabs/prefabs';

export class Venusaur extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Ivysaur';
  public cardType: CardType[] = [G];
  public hp: number = 180;
  public weakness = [{ type: R }];
  public retreat = [C, C, C, C];

  public powers = [{
    name: 'Loopy Lasso',
    powerType: PowerType.ABILITY,
    text: 'Once during your turn, you may flip a coin. If heads, switch 1 of your opponent\'s Benched Pokémon with their Active Pokémon, and the new Active Pokémon is now Asleep and Poisoned.',
  }];

  public attacks = [{
    name: 'Solar Beam',
    cost: [G, G, C, C],
    damage: 130,
    text: '',
  }];

  public regulationMark = 'F';
  public set: string = 'PGO';
  public setNumber: string = '3';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Venusaur';
  public fullName: string = 'Venusaur PGO';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_POWER_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      USE_ABILITY_ONCE_PER_TURN(player, 'LOOPY_LASSO', this);
      ABILITY_USED(player, this);

      return COIN_FLIP_PROMPT(store, state, player, result => {
        if (!result) {
          return;
        }
        SWITCH_IN_OPPONENT_BENCHED_POKEMON(store, state, player);
        ADD_POISON_TO_PLAYER_ACTIVE(store, state, opponent, this);
        ADD_SLEEP_TO_PLAYER_ACTIVE(store, state, opponent, this);
      });
    }

    return state;
  }
}
