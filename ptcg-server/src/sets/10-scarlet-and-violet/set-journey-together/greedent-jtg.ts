import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DRAW_CARDS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Greedent extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Skwovet';
  public cardType: CardType[] = [C];
  public hp: number = 120;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [{
    name: 'Gluttonous Tail',
    cost: [C, C],
    damage: 60,
    text: 'Draw 2 cards.',
  }];

  public regulationMark = 'H';
  public set: string = 'JTG';
  public setNumber: string = '132';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Greedent';
  public fullName: string = 'Greedent JTG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      state = DRAW_CARDS(store, state, player, 2);
    }
    return state;
  }
}
