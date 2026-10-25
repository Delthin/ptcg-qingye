import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DISCARD_TOP_X_OF_OPPONENTS_DECK, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Diggersby extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Bunnelby';
  public cardType: CardType[] = [F];
  public hp: number = 140;
  public weakness = [{ type: G }];
  public retreat = [C, C, C, C];

  public attacks = [
    {
      name: 'Mud-Slap',
      cost: [C, C],
      damage: 50,
      text: '',
    },
    {
      name: 'Knocking Hammer',
      cost: [F, F, C],
      damage: 120,
      text: 'Discard the top card of your opponent\'s deck.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '113';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Diggersby';
  public fullName: string = 'Diggersby OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Knocking Hammer: Discard the top card of your opponent's deck.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      DISCARD_TOP_X_OF_OPPONENTS_DECK(store, state, effect.player, 1, this, effect);
    }

    return state;
  }
}
