import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, SuperType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SEARCH_DECK_FOR_CARDS_TO_HAND, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Heliolisk extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Helioptile';
  public cardType: CardType[] = [C];
  public hp: number = 110;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Parabolic Charge',
      cost: [C],
      damage: 0,
      text: 'Search your deck for up to 4 Energy cards, reveal them, and put them into your hand. Then, shuffle your deck.',
    },
    {
      name: 'Electroslug',
      cost: [C, C, C],
      damage: 80,
      text: '',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'SSP';
  public setNumber: string = '155';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Heliolisk';
  public fullName: string = 'Heliolisk SSP';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      SEARCH_DECK_FOR_CARDS_TO_HAND(
        store,
        state,
        player,
        this,
        { superType: SuperType.ENERGY },
        { min: 0, max: 4 },
        effect
      );
    }
    return state;
  }
}
