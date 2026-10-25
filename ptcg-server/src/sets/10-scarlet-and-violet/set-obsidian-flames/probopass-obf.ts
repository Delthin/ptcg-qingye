import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  MULTIPLE_COIN_FLIPS_PROMPT,
  THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Probopass extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Nosepass';
  public cardType: CardType[] = [M];
  public hp: number = 150;
  public weakness = [{ type: R }];
  public resistance = [{ type: G, value: -30 }];
  public retreat = [C, C, C, C];

  public attacks = [
    {
      name: 'Triple Nose',
      cost: [M, C],
      damage: 40,
      damageCalculation: 'x',
      text: 'Flip 3 coins. This attack does 40 damage for each heads.',
    },
    {
      name: 'Iron Buster',
      cost: [M, M, C],
      damage: 160,
      text: 'During your next turn, this Pokémon can\'t attack.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '146';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Probopass';
  public fullName: string = 'Probopass OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = MULTIPLE_COIN_FLIPS_PROMPT(store, state, effect.player, 3, results => {
        const heads = results.filter(result => result).length;
        effect.damage = 40 * heads;
      });
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_POKEMON_CANNOT_ATTACK_NEXT_TURN(effect.player);
    }

    return state;
  }
}
