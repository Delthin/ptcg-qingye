import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Registeel extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [M];
  public hp: number = 130;
  public weakness = [{ type: R }];
  public resistance = [{ type: G, value: -30 }];
  public retreat = [C, C, C];

  public attacks = [{
    name: 'Raging Hammer',
    cost: [M, C],
    damage: 60,
    damageCalculation: '+',
    text: 'This attack does 10 more damage for each damage counter on this Pokémon.',
  }];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '125';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Registeel';
  public fullName: string = 'Registeel SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const damageCounters = Math.floor(effect.player.active.damage / 10);
      if (damageCounters > 0) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 10 * damageCounters);
      }
    }
    return state;
  }
}
