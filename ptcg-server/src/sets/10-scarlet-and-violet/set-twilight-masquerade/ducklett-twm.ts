import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DRAW_CARDS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Ducklett extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 60;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Double Draw',
      cost: [C],
      damage: 0,
      text: 'Draw 2 cards.',
    },
    {
      name: 'Razor Wing',
      cost: [C, C],
      damage: 20,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '139';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Ducklett';
  public fullName: string = 'Ducklett TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = DRAW_CARDS(store, state, effect.player, 2);
    }

    return state;
  }
}
