import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { MULTIPLE_COIN_FLIPS_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Melmetalex extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Meltan';
  public cardType: CardType[] = [M];
  public hp: number = 280;
  public weakness = [{ type: R }];
  public resistance = [{ type: G, value: -30 }];
  public retreat = [C, C, C];

  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [{
    name: 'Iron Swing',
    cost: [M, M, C, C],
    damage: 100,
    damageCalculation: 'x',
    text: 'Flip 2 coins. This attack does 100 damage for each heads.',
  }];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '105';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Melmetal ex';
  public fullName: string = 'Melmetal ex SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      return MULTIPLE_COIN_FLIPS_PROMPT(store, state, player, 2, results => {
        const heads = results.filter(result => result).length;
        effect.damage = 100 * heads;
      });
    }
    return state;
  }
}
