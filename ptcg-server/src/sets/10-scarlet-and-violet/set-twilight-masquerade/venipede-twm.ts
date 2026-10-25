import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_POISIONED } from '../../../game/store/prefabs/attack-effects';

export class Venipede extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [D];
  public hp: number = 80;
  public weakness = [{ type: F }];
  public retreat = [C, C, C];

  public attacks = [
    {
      name: 'Spit Poison',
      cost: [D],
      damage: 0,
      text: 'Your opponent\'s Active Pokémon is now Poisoned.'
    },
    {
      name: 'Spinning Attack',
      cost: [D, C, C],
      damage: 40,
      text: ''
    }
  ];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '115';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Venipede';
  public fullName: string = 'Venipede TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_POISIONED(store, state, effect);
    }
    return state;
  }
}
