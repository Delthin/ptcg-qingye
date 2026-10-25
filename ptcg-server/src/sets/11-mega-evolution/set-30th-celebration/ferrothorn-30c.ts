import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  THIS_ATTACK_DOES_X_DAMAGE_TO_EACH_OF_YOUR_OPPONENTS_POKEMON,
  THIS_POKEMON_DOES_DAMAGE_TO_ITSELF,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Ferrothorn extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public cardType: CardType[] = [M];
  public hp: number = 130;
  public weakness = [{ type: R }];
  public resistance = [{ type: G, value: -30 }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Spike Sting',
      cost: [C, C],
      damage: 50,
      text: '',
    },
    {
      name: 'Kaboom Needles',
      cost: [M, M],
      damage: 0,
      text: 'This attack does 50 damage to each of your opponent\'s Pokémon. (Don\'t apply Weakness and Resistance for Benched Pokémon.) This Pokémon also does 130 damage to itself.',
    },
  ];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '104';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Ferrothorn';
  public fullName: string = 'Ferrothorn 30C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 1, this)) {
      // 50 damage to each of the opponent's Pokemon (no Weakness/Resistance on the Bench).
      THIS_ATTACK_DOES_X_DAMAGE_TO_EACH_OF_YOUR_OPPONENTS_POKEMON(50, effect, store, state);
      // This Pokemon also does 130 damage to itself.
      THIS_POKEMON_DOES_DAMAGE_TO_ITSELF(store, state, effect, 130);
    }
    return state;
  }
}
