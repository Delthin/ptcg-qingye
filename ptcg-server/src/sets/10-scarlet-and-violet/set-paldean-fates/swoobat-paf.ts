import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ADD_CONFUSION_TO_PLAYER_ACTIVE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Swoobat extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Woobat';
  public cardType: CardType[] = [P];
  public hp: number = 90;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [{
    name: 'Attraction Wave',
    cost: [P],
    damage: 30,
    text: 'Your opponent\'s Active Pokémon is now Confused. Put 6 damage counters instead of 3 on that Pokémon for this Special Condition.',
  }];

  public regulationMark = 'G';
  public set: string = 'PAF';
  public setNumber: string = '33';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Swoobat';
  public fullName: string = 'Swoobat PAF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      // Confused on the opponent's Active Pokémon; 6 damage counters instead of 3 (30) => 60.
      ADD_CONFUSION_TO_PLAYER_ACTIVE(store, state, effect.opponent, this, 60);
    }
    return state;
  }
}
