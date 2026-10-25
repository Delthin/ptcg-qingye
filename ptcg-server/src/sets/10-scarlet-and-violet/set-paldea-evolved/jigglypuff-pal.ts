import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_ASLEEP } from '../../../game/store/prefabs/attack-effects';

export class Jigglypuff extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 70;
  public weakness = [{ type: M }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Sing',
      cost: [C],
      damage: 0,
      text: 'Your opponent\'s Active Pokémon is now Asleep.',
    },
    {
      name: 'Slap',
      cost: [P, C],
      damage: 20,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '83';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Jigglypuff';
  public fullName: string = 'Jigglypuff PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_ASLEEP(store, state, effect);
    }

    return state;
  }
}
