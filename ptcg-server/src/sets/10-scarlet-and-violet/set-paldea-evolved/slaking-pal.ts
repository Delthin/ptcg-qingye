import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ADD_SLEEP_TO_PLAYER_ACTIVE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Slaking extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Vigoroth';
  public cardType: CardType[] = [C];
  public hp: number = 180;
  public weakness = [{ type: F }];
  public retreat = [C, C, C, C];

  public powers = [{
    name: 'Stir and Snooze',
    powerType: PowerType.ABILITY,
    text: 'If this Pokémon is Asleep, flip 2 coins instead of 1 during Pokémon Checkup. If either of them is tails, this Pokémon is still Asleep.',
  }];

  public attacks = [{
    name: 'Slacker\'s Headstrike',
    cost: [C, C, C],
    damage: 240,
    text: 'This Pokémon is now Asleep.',
  }];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '162';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Slaking';
  public fullName: string = 'Slaking PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      // Stir and Snooze: this Pokémon's Sleep is resolved with 2 coins and it
      // wakes up only if both are heads, so the condition is applied with 2 flips.
      ADD_SLEEP_TO_PLAYER_ACTIVE(store, state, effect.player, this, 2);
    }

    return state;
  }
}
