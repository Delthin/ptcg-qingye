import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Dedenne extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 70;
  public weakness = [{ type: M }];
  public retreat = [C];

  public attacks = [{
    name: 'Second Bite',
    cost: [P, C],
    damage: 30,
    damageCalculation: '+',
    text: 'This attack does 10 more damage for each damage counter on your opponent\'s Active Pokémon.',
  }];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '95';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Dedenne';
  public fullName: string = 'Dedenne SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      // 10 more damage for each damage counter (10 HP) on the opponent's Active Pokémon.
      const opponentActive = effect.opponent.active;
      const damageCounters = Math.floor(opponentActive.damage / 10);
      if (damageCounters > 0) {
        effect.damage += damageCounters * 10;
      }
    }
    return state;
  }
}
