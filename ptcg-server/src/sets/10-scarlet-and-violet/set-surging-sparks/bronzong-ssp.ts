import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { MULTIPLE_COIN_FLIPS_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Bronzong extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Bronzor';
  public cardType: CardType[] = [M];
  public hp: number = 130;
  public weakness = [{ type: R }];
  public resistance = [{ type: G, value: -30 }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Spinning Attack',
      cost: [M, C],
      damage: 50,
      text: '',
    },
    {
      name: 'Double Impact',
      cost: [M, C, C],
      damage: 100,
      damageCalculation: 'x',
      text: 'Flip 2 coins. This attack does 100 damage for each heads.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '127';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Bronzong';
  public fullName: string = 'Bronzong SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const attackEffect = effect;

      state = MULTIPLE_COIN_FLIPS_PROMPT(store, state, player, 2, results => {
        const heads = results.filter(result => result).length;
        attackEffect.damage = 100 * heads;
      });
    }

    return state;
  }
}
