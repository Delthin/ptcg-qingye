import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { PlayerType, PowerType, SlotType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ATTACH_ENERGY_PROMPT,
  IS_ABILITY_BLOCKED,
  USE_ABILITY_ONCE_PER_TURN,
  WAS_POWER_USED,
} from '../../../game/store/prefabs/prefabs';

export class Wigglytuff extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Jigglypuff';
  public cardType: CardType[] = [P];
  public hp: number = 110;
  public weakness = [{ type: M }];
  public retreat = [C, C];

  public powers = [{
    name: 'Balloon Therapy',
    powerType: PowerType.ABILITY,
    text: 'Once during your turn, you may attach a Therapeutic Energy card from your hand to 1 of your Pokémon.'
  }];

  public attacks = [{
    name: 'Magical Shot',
    cost: [P, C, C],
    damage: 100,
    text: ''
  }];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '84';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Wigglytuff';
  public fullName: string = 'Wigglytuff PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_POWER_USED(effect, 0, this)) {
      const player = effect.player;

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      USE_ABILITY_ONCE_PER_TURN(player, 'BALLOON_THERAPY', this);

      return ATTACH_ENERGY_PROMPT(
        store,
        state,
        player,
        PlayerType.BOTTOM_PLAYER,
        SlotType.HAND,
        [SlotType.ACTIVE, SlotType.BENCH],
        { name: 'Therapeutic Energy' },
        { allowCancel: true, min: 1, max: 1 },
      );
    }

    return state;
  }
}
