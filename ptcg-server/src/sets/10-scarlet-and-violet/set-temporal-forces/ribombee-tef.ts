import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { TAKE_MORE_PRIZES_IF_DEFENDING_KNOCKED_OUT_DURING_YOUR_NEXT_TURN } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Ribombee extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Cutiefly';
  public cardType: CardType[] = [P];
  public hp: number = 70;
  public weakness = [{ type: M }];
  public retreat = [];

  public attacks = [{
    name: 'Plentiful Pollen',
    cost: [C],
    damage: 30,
    text: 'During your next turn, if the Defending Pokémon is Knocked Out, take 2 more Prize cards.',
  }];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '76';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Ribombee';
  public fullName: string = 'Ribombee TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = TAKE_MORE_PRIZES_IF_DEFENDING_KNOCKED_OUT_DURING_YOUR_NEXT_TURN(store, state, effect, this, 2);
    }
    return state;
  }
}
