import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ATTACH_X_TYPE_ENERGY_FROM_DISCARD_TO_1_OF_YOUR_POKEMON,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';
import { DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON } from '../../../game/store/prefabs/costs';

export class ChienPao extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 120;
  public weakness = [{ type: M }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Snow Bringer',
      cost: [W],
      damage: 0,
      text: 'Attach up to 2 Basic Water Energy cards from your discard pile to 1 of your Pokémon.',
    },
    {
      name: 'Wrathful Blade',
      cost: [W, W, C],
      damage: 130,
      text: 'Discard 2 Energy from this Pokémon.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '57';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Chien-Pao';
  public fullName: string = 'Chien-Pao PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      return ATTACH_X_TYPE_ENERGY_FROM_DISCARD_TO_1_OF_YOUR_POKEMON(
        store,
        state,
        player,
        2,
        CardType.WATER
      );
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      return DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON(store, state, effect, 2, {}, 2);
    }

    return state;
  }
}
