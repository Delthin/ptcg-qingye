import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { THIS_ATTACK_DOES_X_MORE_DAMAGE, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Mienshao extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Mienfoo';
  public cardType: CardType[] = [F];
  public hp: number = 90;
  public weakness = [{ type: P }];
  public retreat = [C];

  public attacks = [{
    name: 'Gale Roundhouse',
    cost: [F],
    damage: 30,
    damageCalculation: '+',
    text: 'If your opponent has 5 or fewer cards in their hand, this attack does 60 more damage.',
  }];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '84';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Mienshao';
  public fullName: string = 'Mienshao SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;
      if (opponent.hand.cards.length <= 5) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 60);
      }
    }

    return state;
  }
}
