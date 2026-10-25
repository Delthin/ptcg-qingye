import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Zapdos extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [L];
  public hp: number = 110;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Follow-Up Bolt',
      cost: [L, C],
      damage: 20,
      damageCalculation: '+',
      text: 'This attack does 10 more damage for each damage counter on your opponent\'s Active Pokémon.',
    },
    {
      name: 'Drill Peck',
      cost: [L, C, C],
      damage: 80,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SVP';
  public setNumber: string = '157';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Zapdos';
  public fullName: string = 'Zapdos SVP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponentActive = effect.opponent.active;
      const damageCounters = Math.floor(opponentActive.damage / 10);

      if (damageCounters > 0) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, damageCounters * 10);
      }
    }

    return state;
  }
}
