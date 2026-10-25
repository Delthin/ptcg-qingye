import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { CardType, Stage, SuperType } from '../../../game/store/card/card-types';
import { GameMessage, PlayerType, State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { ChooseCardsPrompt } from '../../../game/store/prompts/choose-cards-prompt';
import { MOVE_CARDS, SHUFFLE_DECK, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_ASLEEP } from '../../../game/store/prefabs/attack-effects';

export class Indeedee extends PokemonCard {

  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [C];
  public hp: number = 90;
  public weakness = [{ type: F }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Expert Nurturer',
      cost: [C],
      damage: 0,
      text: 'Search your deck for a card that evolves from 1 of your Pokémon and put it onto that Pokémon to evolve it. Then, shuffle your deck.'
    },
    {
      name: 'Hypnoblast',
      cost: [C, C],
      damage: 30,
      text: 'Your opponent\'s Active Pokémon is now Asleep.'
    }
  ];

  public regulationMark = 'G';
  public set: string = 'SVI';
  public setNumber: string = '153';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Indeedee';
  public fullName: string = 'Indeedee SVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Expert Nurturer
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;

      // Names of the Pokemon you have in play, any of which may be evolved.
      const evolvableNames: string[] = [];
      player.forEachPokemon(PlayerType.BOTTOM_PLAYER, cardList => {
        const pokemon = cardList.getPokemonCard();
        if (pokemon !== undefined && !evolvableNames.includes(pokemon.name)) {
          evolvableNames.push(pokemon.name);
        }
      });

      // Deck indices that cannot be picked: not an Evolution card, or it does
      // not evolve from one of your Pokemon in play.
      const blocked: number[] = [];
      player.deck.cards.forEach((card, index) => {
        if (!(card instanceof PokemonCard)
          || card.evolvesFrom === ''
          || !evolvableNames.includes(card.evolvesFrom)) {
          blocked.push(index);
        }
      });

      if (blocked.length === player.deck.cards.length) {
        return SHUFFLE_DECK(store, state, player);
      }

      return store.prompt(state, new ChooseCardsPrompt(
        player,
        GameMessage.CHOOSE_CARD_TO_DECK,
        player.deck,
        { superType: SuperType.POKEMON },
        { allowCancel: false, min: 1, max: 1, blocked }
      ), cards => {
        const chosen = cards[0];

        if (!(chosen instanceof PokemonCard)) {
          return SHUFFLE_DECK(store, state, player);
        }

        let evolved = false;
        player.forEachPokemon(PlayerType.BOTTOM_PLAYER, cardList => {
          if (evolved) {
            return;
          }
          const pokemon = cardList.getPokemonCard();
          if (pokemon === undefined || pokemon.name !== chosen.evolvesFrom) {
            return;
          }
          evolved = true;
          state = MOVE_CARDS(store, state, player.deck, cardList, { cards: [chosen] });
        });

        return SHUFFLE_DECK(store, state, player);
      }) ?? state;
    }

    // Hypnoblast
    if (WAS_ATTACK_USED(effect, 1, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_ASLEEP(store, state, effect);
    }

    return state;
  }
}
