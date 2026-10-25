import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
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
      name: 'Assault Laser',
      cost: [C, C, C],
      damage: 80,
      damageCalculation: '+',
      text: 'If your opponent\'s Active Pokémon has a Pokémon Tool attached, this attack does 80 more damage.',
    },
    {
      name: 'Land Crush',
      cost: [F, C, C, C],
      damage: 120,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '102';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Probopass';
  public fullName: string = 'Probopass TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponentActive = effect.opponent.active;
      if (opponentActive.tools.length > 0) {
        state = THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 80);
      }
    }
    return state;
  }
}
