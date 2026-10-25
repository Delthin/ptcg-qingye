import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { FLIP_A_COIN_IF_HEADS_DEAL_MORE_DAMAGE, YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_ASLEEP } from '../../../game/store/prefabs/attack-effects';

export class Amoongussex extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Foongus';
  public cardType: CardType[] = [G];
  public hp: number = 260;
  public weakness = [{ type: R }];
  public retreat = [C, C];
  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Spore Ball',
      cost: [G],
      damage: 30,
      text: 'Your opponent\'s Active Pokémon is now Asleep.'
    },
    {
      name: 'Champignon\'s Swing',
      cost: [G, C],
      damage: 100,
      damageCalculation: '+',
      text: 'Flip a coin. If heads, this attack does 80 more damage.'
    }
  ];

  public regulationMark = 'H';
  public set: string = 'JTG';
  public setNumber: string = '11';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Amoonguss ex';
  public fullName: string = 'Amoonguss ex JTG';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Spore Ball: Your opponent's Active Pokemon is now Asleep.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_ASLEEP(store, state, effect);
    }

    // Champignon's Swing: Flip a coin. If heads, this attack does 80 more damage.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = FLIP_A_COIN_IF_HEADS_DEAL_MORE_DAMAGE(store, state, effect, 80);
    }

    return state;
  }
}
