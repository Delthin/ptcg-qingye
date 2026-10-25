import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DRAW_CARDS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Keldeo extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 110;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Rapid Draw',
      cost: [W],
      damage: 20,
      text: 'Draw 2 cards.',
    },
    {
      name: 'Aqua Blade',
      cost: [W, W, C],
      damage: 110,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '44';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Keldeo';
  public fullName: string = 'Keldeo TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      state = DRAW_CARDS(store, state, effect.player, 2);
    }
    return state;
  }
}
