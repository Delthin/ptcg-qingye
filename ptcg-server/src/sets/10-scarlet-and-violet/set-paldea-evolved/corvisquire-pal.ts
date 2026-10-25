import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { BLOCK_RETREAT } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Corvisquire extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Rookidee';
  public cardType: CardType[] = [C];
  public hp: number = 90;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Glide',
      cost: [C],
      damage: 20,
      text: ''
    },
    {
      name: 'Clutch',
      cost: [C, C, C],
      damage: 70,
      text: 'During your opponent\'s next turn, the Defending Pokémon can\'t retreat.'
    }
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '165';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Corvisquire';
  public fullName: string = 'Corvisquire PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = BLOCK_RETREAT(store, state, effect, this);
    }
    return state;
  }
}
