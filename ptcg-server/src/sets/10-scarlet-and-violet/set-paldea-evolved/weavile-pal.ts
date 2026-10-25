import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ABILITY_USED,
  IS_ABILITY_BLOCKED,
  MOVED_TO_ACTIVE_THIS_TURN,
  SWITCH_IN_OPPONENT_BENCHED_POKEMON,
  WAS_POWER_USED,
} from '../../../game/store/prefabs/prefabs';

export class Weavile extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Sneasel';
  public cardType: CardType[] = [D];
  public hp: number = 110;
  public weakness = [{ type: G }];
  public retreat = [C];

  public powers = [{
    name: 'Assaulting Hunt',
    powerType: PowerType.ABILITY,
    text: 'Once during your turn, when this Pokémon moves from your Bench to the Active Spot, you may switch in 1 of your opponent\'s Benched Basic Pokémon to the Active Spot.'
  }];

  public attacks = [{
    name: 'Slashing Claw',
    cost: [D, C],
    damage: 70,
    text: ''
  }];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '134';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Weavile';
  public fullName: string = 'Weavile PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_POWER_USED(effect, 0, this)) {
      const player = effect.player;

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      // Only usable on the turn this Pokémon moved from the Bench to the Active Spot.
      if (!MOVED_TO_ACTIVE_THIS_TURN(player, this)) {
        return state;
      }

      ABILITY_USED(player, this);

      return SWITCH_IN_OPPONENT_BENCHED_POKEMON(store, state, player);
    }

    return state;
  }
}
