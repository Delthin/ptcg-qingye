import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { DISCARD_TOP_X_CARDS_FROM_YOUR_DECK, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Diglett extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 50;
  public weakness = [{ type: G }];
  public retreat = [C];

  public attacks = [{
    name: 'Hole-Diggin\' Noggin',
    cost: [F],
    damage: 30,
    text: 'Discard the top card of your deck.',
  }];

  public regulationMark = 'G';
  public set: string = 'OBF';
  public setNumber: string = '103';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Diglett';
  public fullName: string = 'Diglett OBF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      if (player.deck.cards.length === 0) {
        return state;
      }

      state = DISCARD_TOP_X_CARDS_FROM_YOUR_DECK(store, state, player, 1, this, effect);
    }
    return state;
  }
}
