import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  MULTIPLE_COIN_FLIPS_PROMPT,
  THIS_POKEMON_DOES_DAMAGE_TO_ITSELF,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Forretress extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Pineco';
  public cardType: CardType[] = [M];
  public hp: number = 130;
  public weakness = [{ type: R }];
  public resistance = [{ type: G, value: -30 }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Spike Cannon',
      cost: [M],
      damage: 30,
      damageCalculation: 'x',
      text: 'Flip 3 coins. This attack does 30 damage for each heads.'
    },
    {
      name: 'Steel Tackle',
      cost: [C, C, C],
      damage: 130,
      text: 'This Pokémon also does 40 damage to itself.'
    }
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '110';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Forretress';
  public fullName: string = 'Forretress TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const attackEffect = effect;
      state = MULTIPLE_COIN_FLIPS_PROMPT(store, state, attackEffect.player, 3, results => {
        const heads = results.filter(result => result).length;
        attackEffect.damage = 30 * heads;
      });
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 40);
    }

    return state;
  }
}
