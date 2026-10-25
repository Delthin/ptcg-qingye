import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import {
  FLIP_A_COIN_IF_HEADS_DEAL_MORE_DAMAGE,
  YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_ASLEEP,
} from '../../../game/store/prefabs/attack-effects';

export class Parasect extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Paras';
  public cardType: CardType[] = [G];
  public hp: number = 120;
  public weakness = [{ type: R }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Spore',
      cost: [C],
      damage: 0,
      text: 'Your opponent\'s Active Pokémon is now Asleep.',
    },
    {
      name: 'Scissor Swing',
      cost: [G, C],
      damage: 60,
      damageCalculation: '+' as const,
      text: 'Flip 2 coins. This attack does 30 more damage for each heads.',
    },
  ];

  public regulationMark = 'I';
  public set: string = 'JTG';
  public setNumber: string = '5';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Parasect';
  public fullName: string = 'Parasect JTG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_ASLEEP(store, state, effect);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = FLIP_A_COIN_IF_HEADS_DEAL_MORE_DAMAGE(store, state, effect, 30);
      state = FLIP_A_COIN_IF_HEADS_DEAL_MORE_DAMAGE(store, state, effect, 30);
    }

    return state;
  }
}
