import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED, SWITCH_ACTIVE_WITH_BENCHED } from '../../../game/store/prefabs/prefabs';

export class Kadabra extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Abra';
  public cardType: CardType[] = [P];
  public hp: number = 80;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [{
    name: 'Teleportation Attack',
    cost: [P],
    damage: 30,
    text: 'Switch this Pokémon with 1 of your Benched Pokémon.',
  }];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '64';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Kadabra';
  public fullName: string = 'Kadabra MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      return SWITCH_ACTIVE_WITH_BENCHED(store, state, effect.player) ?? state;
    }
    return state;
  }
}
