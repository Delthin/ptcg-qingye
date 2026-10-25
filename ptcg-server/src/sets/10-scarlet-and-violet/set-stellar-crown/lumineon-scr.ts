import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { DRAW_CARDS_UNTIL_YOU_HAVE_X_CARDS_IN_HAND } from '../../../game/store/prefabs/attack-effects';

export class Lumineon extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Finneon';
  public cardType: CardType[] = [W];
  public hp: number = 110;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Return',
      cost: [C],
      damage: 20,
      text: 'You may draw cards until you have 6 cards in your hand.',
    },
    {
      name: 'Razor Fin',
      cost: [W, C],
      damage: 70,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '36';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Lumineon';
  public fullName: string = 'Lumineon SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      DRAW_CARDS_UNTIL_YOU_HAVE_X_CARDS_IN_HAND(6, effect, state);
    }
    return state;
  }
}
