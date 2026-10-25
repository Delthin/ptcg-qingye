import { Card } from '../../../game/store/card/card';
import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { PowerType, State, StateUtils, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  CONFIRMATION_PROMPT,
  IS_ABILITY_BLOCKED,
  JUST_EVOLVED,
  MOVE_CARDS,
  MULTIPLE_COIN_FLIPS_PROMPT,
  SHOW_CARDS_TO_PLAYER,
  SHUFFLE_DECK,
} from '../../../game/store/prefabs/prefabs';

export class Ambipom extends PokemonCard {
  public stage: Stage = Stage.STAGE_1;
  public evolvesFrom = 'Aipom';
  public cardType: CardType[] = [C];
  public hp: number = 110;
  public weakness = [{ type: F }];
  public retreat = [C];

  public powers = [{
    name: 'Wicked Tail',
    powerType: PowerType.ABILITY,
    text: 'When you play this Pokémon from your hand to evolve 1 of your Pokémon during your turn, you may flip 2 coins. For each heads, choose a random card from your opponent\'s hand. Your opponent reveals those cards and shuffles them into their deck.',
  }];

  public attacks = [{
    name: 'Gentle Slap',
    cost: [C, C, C],
    damage: 100,
    text: '',
  }];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '138';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Ambipom';
  public fullName: string = 'Ambipom TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (JUST_EVOLVED(effect, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      if (IS_ABILITY_BLOCKED(store, state, player, this)) {
        return state;
      }

      if (opponent.hand.cards.length === 0) {
        return state;
      }

      state = CONFIRMATION_PROMPT(store, state, player, useAbility => {
        if (!useAbility) {
          return;
        }

        state = MULTIPLE_COIN_FLIPS_PROMPT(store, state, player, 2, results => {
          const heads = results.filter(result => result).length;
          if (heads === 0) {
            return;
          }

          const handCards = opponent.hand.cards.slice();
          const chosen: Card[] = [];
          for (let i = 0; i < heads && handCards.length > 0; i++) {
            const index = Math.floor(Math.random() * handCards.length);
            chosen.push(handCards.splice(index, 1)[0]);
          }

          if (chosen.length === 0) {
            return;
          }

          state = SHOW_CARDS_TO_PLAYER(store, state, player, chosen);
          state = MOVE_CARDS(store, state, opponent.hand, opponent.deck, { cards: chosen });
          state = SHUFFLE_DECK(store, state, opponent);
        });
      });
    }

    return state;
  }
}
