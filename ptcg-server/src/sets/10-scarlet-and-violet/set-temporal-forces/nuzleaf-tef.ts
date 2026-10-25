import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { MULTIPLE_COIN_FLIPS_PROMPT, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Nuzleaf extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Seedot';
  public cardType: CardType[] = [G];
  public hp: number = 90;
  public weakness = [{ type: R }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Corkscrew Punch',
      cost: [G],
      damage: 20,
      text: ''
    },
    {
      name: 'Comet Slap',
      cost: [C, C],
      damage: 30,
      damageCalculation: 'x',
      text: 'Flip 3 coins. This attack does 30 damage for each heads.'
    }
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '4';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Nuzleaf';
  public fullName: string = 'Nuzleaf TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      return MULTIPLE_COIN_FLIPS_PROMPT(store, state, player, 3, results => {
        const heads = results.filter(result => result).length;
        effect.damage = 30 * heads;
      });
    }

    return state;
  }
}
