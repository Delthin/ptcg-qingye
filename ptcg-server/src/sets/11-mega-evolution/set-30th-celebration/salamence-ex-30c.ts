import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Card } from '../../../game/store/card/card';
import { CardTag, CardType, Stage, SuperType } from '../../../game/store/card/card-types';
import { ChooseCardsPrompt, GameMessage, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import {
  DISCARD_TOP_X_CARDS_FROM_YOUR_DECK,
  MOVE_CARDS,
  WAS_ATTACK_USED,
} from '../../../game/store/prefabs/prefabs';

export class Salamenceex extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [N];
  public hp: number = 330;
  public weakness = [];
  public resistance = [];
  public retreat = [C, C];

  protected _tags = [CardTag.POKEMON_ex];

  public attacks = [
    {
      name: 'Booming Call',
      cost: [C],
      damage: 0,
      text: 'Put up to 3 Dragon Pokémon from your discard pile onto your Bench.',
    },
    {
      name: 'Dragon Pulse',
      cost: [R, W],
      damage: 240,
      text: 'Discard the top 2 cards of your deck.',
    },
  ];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '109';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Salamence ex';
  public fullName: string = 'Salamence ex 30C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Booming Call: put up to 3 Dragon Pokémon from your discard pile onto your Bench.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      const openSlots = player.bench.filter(slot => slot.cards.length === 0);
      const dragonPokemon: Card[] = player.discard.cards.filter(card =>
        card instanceof PokemonCard && card.cardType.includes(CardType.DRAGON));

      if (openSlots.length === 0 || dragonPokemon.length === 0) {
        return state;
      }

      const maxCards = Math.min(3, openSlots.length, dragonPokemon.length);

      state = store.prompt(state, new ChooseCardsPrompt(
        player,
        GameMessage.CHOOSE_POKEMON_TO_HEAL,
        player.discard,
        { superType: SuperType.POKEMON, cardType: [CardType.DRAGON] },
        { min: 0, max: maxCards, allowCancel: false },
      ), (selected: Card[]) => {
        const cards = (selected || [])
          .filter(card => dragonPokemon.includes(card))
          .slice(0, maxCards);

        cards.forEach((card, index) => {
          const slot = openSlots[index];
          if (slot === undefined) {
            return;
          }

          MOVE_CARDS(store, state, player.discard, slot, {
            cards: [card],
            sourceCard: this,
            sourceEffect: effect,
          });
          slot.pokemonPlayedTurn = state.turn;
        });
      }) ?? state;
    }

    // Dragon Pulse: discard the top 2 cards of your deck.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      state = DISCARD_TOP_X_CARDS_FROM_YOUR_DECK(store, state, player, 2, this, effect);
    }

    return state;
  }
}
