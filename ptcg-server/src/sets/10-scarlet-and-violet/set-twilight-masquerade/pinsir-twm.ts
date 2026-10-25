import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DISCARD_ALL_ENERGY_FROM_POKEMON, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { KNOCK_OUT_DEFENDING_POKEMON_AT_END_OF_OPPONENTS_NEXT_TURN } from '../../../game/store/prefabs/attack-effects';

export class Pinsir extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 110;
  public weakness = [{ type: R }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Slow Crunch',
      cost: [G, C],
      damage: 0,
      text: 'Discard all Energy from this Pokémon. At the end of your opponent\'s next turn, the Defending Pokémon will be Knocked Out.',
    },
    {
      name: 'Superpowered Horns',
      cost: [G, C, C],
      damage: 100,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '3';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Pinsir';
  public fullName: string = 'Pinsir TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      DISCARD_ALL_ENERGY_FROM_POKEMON(store, state, effect, this);
      state = KNOCK_OUT_DEFENDING_POKEMON_AT_END_OF_OPPONENTS_NEXT_TURN(store, state, effect, this);
    }

    return state;
  }
}
