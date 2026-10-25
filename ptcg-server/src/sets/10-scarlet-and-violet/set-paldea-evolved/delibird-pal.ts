import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DRAW_CARDS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Delibird extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 90;
  public weakness = [{ type: M }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Double Draw',
      cost: [C],
      damage: 0,
      text: 'Draw 2 cards.',
    },
    {
      name: 'Ice Wing',
      cost: [W, C],
      damage: 30,
      text: '',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '46';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Delibird';
  public fullName: string = 'Delibird PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = DRAW_CARDS(store, state, effect.player, 2);
    }
    return state;
  }
}
