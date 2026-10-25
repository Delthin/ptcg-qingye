import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SWITCH_ACTIVE_WITH_BENCHED, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Yanmega extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Yanma';
  public cardType: CardType[] = [G];
  public hp: number = 130;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [{
    name: 'Gyro Shockwave',
    cost: [G, G, C],
    damage: 110,
    text: 'Switch this Pokémon with 1 of your Benched Pokémon.',
  }];

  public regulationMark = 'H';
  public set: string = 'SVP';
  public setNumber: string = '187';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Yanmega';
  public fullName: string = 'Yanmega SVP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      SWITCH_ACTIVE_WITH_BENCHED(store, state, player);
    }
    return state;
  }
}
