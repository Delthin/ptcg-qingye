import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Card } from '../../../game/store/card/card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { ChooseCardsPrompt, GameMessage, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { BLOCK_IF_DECK_EMPTY, MOVE_CARDS, SHUFFLE_DECK, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { FLIP_A_COIN_IF_HEADS_DEAL_MORE_DAMAGE } from '../../../game/store/prefabs/attack-effects';

export class Eevee extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 50;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Ascension',
      cost: [C],
      damage: 0,
      text: 'Search your deck for a card that evolves from this Pokémon and put it onto this Pokémon to evolve it. Then, shuffle your deck.',
    },
    {
      name: 'Quick Attack',
      cost: [C, C, C],
      damage: 20,
      damageCalculation: '+',
      text: 'Flip a coin. If heads, this attack does 20 more damage.',
    },
  ];

  public regulationMark = 'H';
  public set: string = 'TWM';
  public setNumber: string = '135';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Eevee';
  public fullName: string = 'Eevee TWM';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Ascension
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      BLOCK_IF_DECK_EMPTY(player);

      const cardList = player.active;

      // Only cards that evolve from this Pokémon may be chosen. `blocked` holds indexes
      // into the card list, not the cards themselves.
      const blocked: number[] = [];
      player.deck.cards.forEach((card, index) => {
        if (!(card instanceof PokemonCard) || card.evolvesFrom !== this.name) {
          blocked.push(index);
        }
      });

      if (blocked.length === player.deck.cards.length) {
        return SHUFFLE_DECK(store, state, player);
      }

      state = store.prompt(state, new ChooseCardsPrompt(
        player,
        GameMessage.CHOOSE_CARD_TO_HAND,
        player.deck,
        {},
        { min: 1, max: 1, allowCancel: false, blocked },
      ), (cards: Card[] | undefined) => {
        const selected = cards ?? [];

        if (selected.length > 0) {
          state = MOVE_CARDS(store, state, player.deck, cardList, {
            cards: [selected[0]],
            sourceCard: this,
            sourceEffect: effect,
          });
        }

        state = SHUFFLE_DECK(store, state, player);
      }) ?? state;

      return state;
    }

    // Quick Attack
    if (WAS_ATTACK_USED(effect, 1, this)) {
      return FLIP_A_COIN_IF_HEADS_DEAL_MORE_DAMAGE(store, state, effect, 20);
    }

    return state;
  }
}
