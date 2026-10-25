import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { FLIP_A_COIN_IF_HEADS_DEAL_MORE_DAMAGE } from '../../../game/store/prefabs/attack-effects';

export class Vigoroth extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Slakoth';
  public cardType: CardType[] = [C];
  public hp: number = 90;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Confront',
      cost: [C, C],
      damage: 40,
      text: '',
    },
    {
      name: 'Sharp Claws',
      cost: [C, C, C],
      damage: 60,
      damageCalculation: '+',
      text: 'Flip a coin. If heads, this attack does 60 more damage.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '161';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Vigoroth';
  public fullName: string = 'Vigoroth PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      return FLIP_A_COIN_IF_HEADS_DEAL_MORE_DAMAGE(store, state, effect, 60);
    }
    return state;
  }
}
