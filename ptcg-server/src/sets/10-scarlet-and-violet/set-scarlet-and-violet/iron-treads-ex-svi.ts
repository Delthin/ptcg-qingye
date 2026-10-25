import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardTag, CardType, Stage } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  SWITCH_ACTIVE_WITH_BENCHED,
  THIS_ATTACK_DOES_X_DAMAGE_TO_X_OF_YOUR_OPPONENTS_POKEMON,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class IronTreadsex extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [M];
  public hp: number = 220;
  public weakness = [{ type: R }];
  public resistance = [{ type: G, value: -30 }];
  public retreat = [C, C, C];
  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Triple Laser',
      cost: [C, C, C],
      damage: 0,
      text: 'This attack does 30 damage to 3 of your opponent\'s Pokémon. (Don\'t apply Weakness and Resistance for Benched Pokémon.)',
    },
    {
      name: 'Cybernetic Wheels',
      cost: [M, M, M, C],
      damage: 160,
      text: 'Switch this Pokémon with 1 of your Benched Pokémon.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '143';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Iron Treads ex';
  public fullName: string = 'Iron Treads ex SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = THIS_ATTACK_DOES_X_DAMAGE_TO_X_OF_YOUR_OPPONENTS_POKEMON(30, effect, store, state, 3, 3);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      SWITCH_ACTIVE_WITH_BENCHED(store, state, effect.player);
    }

    return state;
  }
}
