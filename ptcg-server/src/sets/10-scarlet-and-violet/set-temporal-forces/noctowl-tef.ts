import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SEARCH_DECK_FOR_CARDS_TO_HAND, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Noctowl extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Hoothoot';
  public cardType: CardType[] = [C];
  public hp: number = 110;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C];

  public attacks = [{
    name: 'Talon Hunt',
    cost: [C, C],
    damage: 70,
    text: 'You may search your deck for up to 2 cards and put them into your hand. Then, shuffle your deck.',
  }];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '127';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Noctowl';
  public fullName: string = 'Noctowl TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      SEARCH_DECK_FOR_CARDS_TO_HAND(store, state, player, this, {}, { min: 0, max: 2 });
    }
    return state;
  }
}
