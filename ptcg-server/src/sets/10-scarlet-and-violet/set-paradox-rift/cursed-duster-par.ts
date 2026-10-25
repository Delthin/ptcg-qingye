import { TrainerCard, TrainerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { KnockOutEffect } from '../../../game/store/effects/game-effects';
import { MOVE_CARDS } from '../../../game/store/prefabs/prefabs';

export class CursedDuster extends TrainerCard {
  public trainerType = TrainerType.TOOL;

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '161';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Cursed Duster';
  public fullName: string = 'Cursed Duster PAR';

  public text: string =
    'If the Pokémon this card is attached to is Knocked Out by damage from an attack from your opponent\'s Pokémon, discard a random card from your opponent\'s hand.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof KnockOutEffect && effect.target.tools.includes(this)) {
      const opponent = StateUtils.getOpponent(state, effect.player);

      if (opponent.hand.cards.length > 0) {
        const randomIndex = Math.floor(Math.random() * opponent.hand.cards.length);
        const randomCard = opponent.hand.cards[randomIndex];
        state = MOVE_CARDS(store, state, opponent.hand, opponent.discard, { cards: [randomCard] });
      }
    }

    return state;
  }
}
