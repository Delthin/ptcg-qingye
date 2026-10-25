import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { OPPONENT_TURN_ENDS_ON_ENERGY_ATTACH_FROM_HAND_TO_DEFENDING_NEXT_TURN } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Hypno extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Drowzee';
  public cardType: CardType[] = [P];
  public hp: number = 110;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Daydream',
    cost: [P, C],
    damage: 80,
    text: 'During your opponent\'s next turn, if they attach an Energy card from their hand to the Defending Pokémon, their turn ends.',
  }];

  public regulationMark = 'H';
  public set: string = 'SFA';
  public setNumber: string = '17';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Hypno';
  public fullName: string = 'Hypno SFA';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = OPPONENT_TURN_ENDS_ON_ENERGY_ATTACH_FROM_HAND_TO_DEFENDING_NEXT_TURN(store, state, effect, this);
    }
    return state;
  }
}
