import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage, SuperType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SEARCH_DECK_FOR_CARDS_TO_HAND, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Floette extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Flabébé';
  public cardType: CardType[] = [P];
  public hp: number = 70;
  public weakness = [{ type: M }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Minor Errand-Running',
      cost: [C],
      damage: 0,
      text: 'Search your deck for up to 3 Basic Energy cards, reveal them, and put them into your hand. Then, shuffle your deck.',
    },
    {
      name: 'Spinning Attack',
      cost: [P, C],
      damage: 40,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '87';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Floette';
  public fullName: string = 'Floette TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      SEARCH_DECK_FOR_CARDS_TO_HAND(
        store,
        state,
        effect.player,
        this,
        { superType: SuperType.ENERGY },
        { min: 0, max: 3, allowCancel: false },
      );
    }

    return state;
  }
}
