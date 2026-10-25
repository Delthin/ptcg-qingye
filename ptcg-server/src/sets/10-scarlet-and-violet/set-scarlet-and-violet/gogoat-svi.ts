import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { FLIP_A_COIN_IF_HEADS_DEAL_MORE_DAMAGE } from '../../../game/store/prefabs/attack-effects';

export class Gogoat extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Skiddo';
  public cardType: CardType[] = [G];
  public hp: number = 130;
  public weakness = [{ type: R }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Rising Lunge',
      cost: [C, C],
      damage: 30,
      damageCalculation: '+',
      text: 'Flip a coin. If heads, this attack does 30 more damage.',
    },
    {
      name: 'Solar Beam',
      cost: [G, C, C],
      damage: 110,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '12';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Gogoat';
  public fullName: string = 'Gogoat SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      FLIP_A_COIN_IF_HEADS_DEAL_MORE_DAMAGE(store, state, effect, 30);
    }
    return state;
  }
}
