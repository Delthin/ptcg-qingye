import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { FLIP_A_COIN_IF_HEADS_DEAL_MORE_DAMAGE } from '../../../game/store/prefabs/attack-effects';

export class Poliwhirl extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Poliwag';
  public cardType: CardType[] = [W];
  public hp: number = 90;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Wave Splash',
      cost: [W],
      damage: 20,
      text: '',
    },
    {
      name: 'Frog Hop',
      cost: [W, C],
      damage: 30,
      damageCalculation: '+',
      text: 'Flip a coin. If heads, this attack does 60 more damage.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '61';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Poliwhirl';
  public fullName: string = 'Poliwhirl MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = FLIP_A_COIN_IF_HEADS_DEAL_MORE_DAMAGE(store, state, effect, 60);
    }
    return state;
  }
}
