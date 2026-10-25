import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED, SWITCH_ACTIVE_WITH_BENCHED } from '../../../game/store/prefabs/prefabs';

export class Tirtouga extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Antique Cover Fossil';
  public cardType: CardType[] = [W];
  public hp: number = 100;
  public weakness = [{ type: L }];
  public retreat = [C, C, C];

  public attacks = [{
    name: 'Splashing Turn',
    cost: [W, W],
    damage: 70,
    text: 'Switch this Pokémon with 1 of your Benched Pokémon.',
  }];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '37';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Tirtouga';
  public fullName: string = 'Tirtouga SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      if (player.bench.some(b => b.cards.length > 0)) {
        state = SWITCH_ACTIVE_WITH_BENCHED(store, state, player) ?? state;
      }
    }
    return state;
  }
}
