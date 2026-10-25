import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, SuperType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { SEARCH_DECK_FOR_CARDS_TO_HAND, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Feebas extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 30;
  public weakness = [{ type: L }];
  public retreat = [C];

  public attacks = [{
    name: 'Drawup Power',
    cost: [W],
    damage: 0,
    text: 'Search your deck for an Energy card, reveal it, and put it into your hand. Then, shuffle your deck.',
  }];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '35';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Feebas';
  public fullName: string = 'Feebas PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      SEARCH_DECK_FOR_CARDS_TO_HAND(store, state, player, this, { superType: SuperType.ENERGY });
    }

    return state;
  }
}
