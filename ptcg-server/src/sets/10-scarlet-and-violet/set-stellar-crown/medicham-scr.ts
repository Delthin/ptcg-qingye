import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { Attack, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { MULTIPLE_COIN_FLIPS_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Medicham extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Meditite';
  public cardType: CardType[] = [F];
  public hp: number = 110;
  public weakness = [{ type: P }];
  public retreat = [C];

  public attacks: Attack[] = [{
    name: 'Double Smash',
    cost: [F],
    damage: 40,
    damageCalculation: 'x',
    text: 'Flip 2 coins. This attack does 40 damage for each heads.',
  }];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '79';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Medicham';
  public fullName: string = 'Medicham SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      // Flip 2 coins. This attack does 40 damage for each heads.
      const attackEffect = effect;
      state = MULTIPLE_COIN_FLIPS_PROMPT(store, state, attackEffect.player, 2, results => {
        const heads = results.filter(result => result).length;
        attackEffect.damage = 40 * heads;
      });
    }
    return state;
  }
}
