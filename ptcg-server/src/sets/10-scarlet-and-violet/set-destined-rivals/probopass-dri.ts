import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Probopass extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Nosepass';
  public cardType: CardType[] = [F];
  public hp: number = 140;
  public weakness = [{ type: G }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Power Gem',
      cost: [F],
      damage: 40,
      text: ''
    },
    {
      name: 'Mountain Drop',
      cost: [C, C, C],
      damage: 70,
      damageCalculation: '+',
      text: 'If a Stadium is in play, this attack does 70 more damage.'
    }
  ];

  public regulationMark = 'I';
  public set: string = 'DRI';
  public setNumber: string = '98';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Probopass';
  public fullName: string = 'Probopass DRI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Mountain Drop: If a Stadium is in play, this attack does 70 more damage.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      if (StateUtils.getStadiumCard(state) !== undefined) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 70);
      }
    }

    return state;
  }
}
