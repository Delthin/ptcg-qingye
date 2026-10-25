import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, CardTag } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import {
  COPY_BENCH_ATTACK,
  THIS_ATTACKS_DAMAGE_ISNT_AFFECTED_BY_EFFECTS,
} from '../../../game/store/prefabs/attack-effects';

export class MewVMAX extends PokemonCard {
  public stage: Stage = Stage.VMAX;
  public evolvesFrom = 'Mew V';
  public cardType: CardType[] = [P];
  public hp: number = 310;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat: CardType[] = [];

  protected _tags = [CardTag.POKEMON_VMAX];

  public attacks = [
    {
      name: 'Cross Fusion Strike',
      cost: [C, C],
      damage: 0,
      text: 'Choose 1 of your Benched Fusion Strike Pokémon\'s attacks and use it as this attack.',
    },
    {
      name: 'Max Miracle',
      cost: [P, P],
      damage: 130,
      text: 'This attack\'s damage isn\'t affected by any effects on your opponent\'s Active Pokémon.',
    },
  ];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '114';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Mew VMAX';
  public fullName: string = 'Mew VMAX 30C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = COPY_BENCH_ATTACK(store, state, effect);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      THIS_ATTACKS_DAMAGE_ISNT_AFFECTED_BY_EFFECTS(store, state, effect, 130);
    }

    return state;
  }
}
