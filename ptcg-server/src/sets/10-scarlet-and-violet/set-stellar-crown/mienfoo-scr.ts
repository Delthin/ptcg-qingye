import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { MOVE_CARDS, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Mienfoo extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [F];
  public hp: number = 60;
  public weakness = [{ type: P }];
  public retreat = [C];

  public attacks = [{
    name: 'Knock Off',
    cost: [F],
    damage: 10,
    text: 'Discard a random card from your opponent\'s hand.',
  }];

  public regulationMark = 'H';
  public set: string = 'SCR';
  public setNumber: string = '83';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Mienfoo';
  public fullName: string = 'Mienfoo SCR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponent = effect.opponent;

      if (opponent.hand.cards.length === 0) {
        return state;
      }

      const randomIndex = Math.floor(Math.random() * opponent.hand.cards.length);
      const randomCard = opponent.hand.cards[randomIndex];

      if (randomCard === undefined) {
        return state;
      }

      state = MOVE_CARDS(store, state, opponent.hand, opponent.discard, {
        cards: [randomCard],
        sourceCard: this,
        sourceEffect: effect,
      });
    }

    return state;
  }
}
