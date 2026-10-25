import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, EnergyType } from '../../../game/store/card/card-types';
import { PlayerType, PowerType, SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ABILITY_USED,
  ATTACH_ENERGY_PROMPT,
  IS_ABILITY_BLOCKED,
  USE_ABILITY_ONCE_PER_TURN,
  WAS_POWER_USED,
} from '../../../game/store/prefabs/prefabs';

export class Quaquaval extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Quaxwell';
  public cardType: CardType[] = [W];
  public hp: number = 170;
  public weakness = [{ type: L }];
  public retreat = [C, C];

  public powers = [{
    name: 'Energy Carnival',
    powerType: PowerType.ABILITY,
    text: 'Once during your turn, you may attach a Basic Energy card from your hand to 1 of your Pokémon.',
  }];

  public attacks = [{
    name: 'Hydro Kick',
    cost: [W, C, C],
    damage: 140,
    text: '',
  }];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '54';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Quaquaval';
  public fullName: string = 'Quaquaval SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Energy Carnival: Once during your turn, attach a Basic Energy from hand to 1 of your Pokemon.
    if (WAS_POWER_USED(effect, 0, this)) {
      const player = effect.player;

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      USE_ABILITY_ONCE_PER_TURN(player, 'ENERGY_CARNIVAL', this);

      state = ATTACH_ENERGY_PROMPT(
        store,
        state,
        player,
        PlayerType.BOTTOM_PLAYER,
        SlotType.HAND,
        [SlotType.ACTIVE, SlotType.BENCH],
        { energyType: EnergyType.BASIC },
      );

      ABILITY_USED(player, this);
    }

    return state;
  }
}
