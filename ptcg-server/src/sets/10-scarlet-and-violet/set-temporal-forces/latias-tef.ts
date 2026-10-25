import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DRAW_CARDS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Latias extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [P];
  public hp: number = 110;
  public weakness = [{ type: D }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Allure',
      cost: [C],
      damage: 0,
      text: 'Draw 2 cards.',
    },
    {
      name: 'Lagoon Flight',
      cost: [P, C],
      damage: 60,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '67';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Latias';
  public fullName: string = 'Latias TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      return DRAW_CARDS(store, state, player, 2);
    }

    return state;
  }
}
