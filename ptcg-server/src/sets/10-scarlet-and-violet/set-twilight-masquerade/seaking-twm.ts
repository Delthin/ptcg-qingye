import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { MOVE_CARDS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Seaking extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Goldeen';
  public cardType: CardType[] = [W];
  public hp: number = 90;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Peck Off',
      cost: [W],
      damage: 50,
      text: 'Before doing damage, discard all Pokémon Tools from your opponent\'s Active Pokémon.'
    },
    {
      name: 'Horn Drill',
      cost: [C, C, C],
      damage: 90,
      text: ''
    }
  ];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '45';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Seaking';
  public fullName: string = 'Seaking TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;
      const tools = opponent.active.tools.slice();

      state = MOVE_CARDS(store, state, opponent.active, opponent.discard, {
        cards: tools,
        sourceCard: this,
        sourceEffect: effect,
      });
    }

    return state;
  }
}
