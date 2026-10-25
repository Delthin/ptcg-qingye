import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DEFENDING_POKEMON_WEAKNESS_IS_NOW } from '../../../game/store/prefabs/effect-of-attack-prefabs';

export class Oranguru extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 120;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Now You\'re in My Power',
      cost: [C],
      damage: 0,
      text: 'Until the end of your next turn, the Defending Pokémon\'s Weakness is now Colorless. (The amount of Weakness doesn\'t change.)'
    },
    {
      name: 'Smack',
      cost: [C, C, C],
      damage: 80,
      text: ''
    }
  ];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '156';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Oranguru';
  public fullName: string = 'Oranguru SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = DEFENDING_POKEMON_WEAKNESS_IS_NOW(store, state, effect, this, CardType.COLORLESS);
    }
    return state;
  }
}
