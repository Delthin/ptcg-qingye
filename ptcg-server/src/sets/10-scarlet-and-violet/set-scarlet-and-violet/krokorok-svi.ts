import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Krokorok extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Sandile';
  public cardType: CardType[] = [F];
  public hp: number = 100;
  public weakness = [{ type: G }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Payback',
      cost: [F],
      damage: 30,
      damageCalculation: '+',
      text: 'If your opponent has exactly 1 Prize card remaining, this attack does 90 more damage.',
    },
    {
      name: 'Corkscrew Punch',
      cost: [F, F],
      damage: 60,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '116';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Krokorok';
  public fullName: string = 'Krokorok SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;
      const remainingPrizes = opponent.prizes.filter(prize => prize.cards.length > 0).length;

      if (remainingPrizes === 1) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 90);
      }
    }

    return state;
  }
}
