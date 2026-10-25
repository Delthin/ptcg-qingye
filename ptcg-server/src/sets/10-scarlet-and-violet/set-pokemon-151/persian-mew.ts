import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  IS_ABILITY_BLOCKED,
  SEARCH_DECK_FOR_CARDS_TO_HAND,
  USE_ABILITY_ONCE_PER_TURN,
  WAS_POWER_USED,
} from '../../../game/store/prefabs/prefabs';

export class Persian extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Meowth';
  public cardType: CardType[] = [C];
  public hp: number = 110;
  public weakness = [{ type: F }];
  public retreat = [C];

  public powers = [{
    name: 'Rocket Call',
    powerType: PowerType.ABILITY,
    text: 'Once during your turn, you may search your deck for a Giovanni\'s Charisma card, reveal it, and put it into your hand. Then, shuffle your deck.',
  }];

  public attacks = [{
    name: 'Slash',
    cost: [C, C, C],
    damage: 70,
    text: '',
  }];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '53';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Persian';
  public fullName: string = 'Persian MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_POWER_USED(effect, 0, this)) {
      const player = effect.player;

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      USE_ABILITY_ONCE_PER_TURN(player, 'ROCKET_CALL', this);

      SEARCH_DECK_FOR_CARDS_TO_HAND(
        store,
        state,
        player,
        this,
        { name: 'Giovanni\'s Charisma' },
        { min: 1, max: 1, allowCancel: false },
        effect,
      );
    }

    return state;
  }
}
