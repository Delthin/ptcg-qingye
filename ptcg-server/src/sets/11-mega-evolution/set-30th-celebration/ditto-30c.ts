import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage, SuperType } from '../../../game/store/card/card-types';
import { GameMessage, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ChooseCardsPrompt } from '../../../game/store/prompts/choose-cards-prompt';
import { COIN_FLIP_PROMPT, SHUFFLE_DECK, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Ditto extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 70;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Surprisingly Transform',
      cost: [C, C],
      damage: 0,
      text: 'Flip a coin. If heads, search your deck for a Pokémon and switch it with this Pokémon. Any attached cards, damage counters, Special Conditions, turns in play, and any other effects remain on the new Pokémon. If you switched a Pokémon in this way, put this card into your deck. Then, shuffle your deck.',
    },
  ];

  public regulationMark = 'J';
  public set: string = '30C';
  public setNumber: string = '115';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Ditto';
  public fullName: string = 'Ditto 30C';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const active = player.active;

      const hasPokemonInDeck = player.deck.cards.some(card => card instanceof PokemonCard);

      if (!hasPokemonInDeck) {
        return state;
      }

      state = COIN_FLIP_PROMPT(store, state, player, result => {
        if (!result) {
          return;
        }

        state = store.prompt(state, new ChooseCardsPrompt(
          player,
          GameMessage.CHOOSE_CARD_TO_HAND,
          player.deck,
          { superType: SuperType.POKEMON },
          { min: 1, max: 1, allowCancel: false },
        ), cards => {
          const chosen = cards[0];

          if (chosen === undefined) {
            return;
          }

          // Take the chosen Pokémon out of the deck and put it where this
          // Pokémon was. Attached cards, damage counters, Special Conditions,
          // turns in play and any other effects stay on the Active Spot as
          // they are; only the Pokémon card itself is swapped out.
          const deckIndex = player.deck.cards.indexOf(chosen);
          if (deckIndex !== -1) {
            player.deck.cards.splice(deckIndex, 1);
          }

          const activeIndex = active.cards.indexOf(this);
          if (activeIndex !== -1) {
            active.cards.splice(activeIndex, 1);
          }
          active.cards.push(chosen);

          // Put this card into the deck, then shuffle the deck.
          player.deck.cards.push(this);
          state = SHUFFLE_DECK(store, state, player);
        }) ?? state;
      });
    }

    return state;
  }
}
