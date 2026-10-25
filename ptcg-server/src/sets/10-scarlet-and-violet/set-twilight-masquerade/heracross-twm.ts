import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  ADD_PARALYZED_TO_PLAYER_ACTIVE,
  COIN_FLIP_PROMPT,
  WAS_ATTACK_USED
} from '../../../game/store/prefabs/prefabs';

export class Heracross extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 120;
  public weakness = [{ type: R }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Body Slam',
      cost: [G, C, C],
      damage: 60,
      text: 'Flip a coin. If heads, your opponent\'s Active Pokémon is now Paralyzed.',
    },
    {
      name: 'Seismic Toss',
      cost: [G, C, C, C],
      damage: 130,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '8';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Heracross';
  public fullName: string = 'Heracross TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = effect.opponent;

      return COIN_FLIP_PROMPT(store, state, player, result => {
        if (result) {
          ADD_PARALYZED_TO_PLAYER_ACTIVE(store, state, opponent, this);
        }
      });
    }

    return state;
  }
}
