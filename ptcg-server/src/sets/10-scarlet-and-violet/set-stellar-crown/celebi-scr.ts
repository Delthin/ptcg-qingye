import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED, DRAW_CARDS } from '../../../game/store/prefabs/prefabs';

export class Celebi extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [G];
  public hp: number = 80;
  public weakness = [{ type: R }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Collect',
      cost: [C],
      damage: 0,
      text: 'Draw a card.',
    },
    {
      name: 'Leaf Step',
      cost: [G],
      damage: 30,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '4';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Celebi';
  public fullName: string = 'Celebi SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      state = DRAW_CARDS(store, state, player, 1);
    }

    return state;
  }
}
