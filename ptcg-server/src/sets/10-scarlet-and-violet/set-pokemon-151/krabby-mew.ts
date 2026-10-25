import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON,
  COIN_FLIP_PROMPT,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Krabby extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 70;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Salt Water',
      cost: [W],
      damage: 0,
      text: 'Flip a coin. If heads, search your deck for up to 2 Basic Water Energy cards and attach them to this Pokémon. Then, shuffle your deck.'
    },
    {
      name: 'Crabhammer',
      cost: [W, W, W],
      damage: 50,
      text: ''
    }
  ];

  public regulationMark = 'G';
  public set: string = 'MEW';
  public setNumber: string = '98';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Krabby';
  public fullName: string = 'Krabby MEW';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      state = COIN_FLIP_PROMPT(store, state, player, result => {
        if (!result) {
          return;
        }

        state = ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON(store, state, player, 2, 1);
      });
    }

    return state;
  }
}
