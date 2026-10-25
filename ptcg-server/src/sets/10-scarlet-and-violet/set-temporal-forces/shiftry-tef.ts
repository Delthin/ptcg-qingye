import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType, SuperType } from '../../../game/store/card/card-types';
import { EnergyCard } from '../../../game/store/card/energy-card';
import { Effect } from '../../../game/store/effects/effect';
import {
  ChooseCardsPrompt, ChoosePokemonPrompt, GameMessage, PlayerType, SlotType, State, StateUtils, StoreLike,
} from '../../../game';
import { MOVE_CARDS, SHUFFLE_DECK, WAS_ATTACK_USED } from '../../../game/store/prefabs/prefabs';

export class Shiftry extends PokemonCard {
  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom = 'Nuzleaf';
  public cardType: CardType[] = [G];
  public hp: number = 150;
  public weakness = [{ type: R }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Expelling Tornado',
      cost: [G],
      damage: 0,
      text: 'Choose 3 of your opponent\'s Benched Pokémon. If you do, shuffle all of your opponent\'s Benched Pokémon that you didn\'t choose, and all cards attached to those Pokémon, into their deck.'
    },
    {
      name: 'Energy Loop',
      cost: [C, C],
      damage: 140,
      text: 'Put an Energy attached to this Pokémon into your hand.'
    }
  ];

  public regulationMark = 'H';
  public set: string = 'TEF';
  public setNumber: string = '5';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Shiftry';
  public fullName: string = 'Shiftry TEF';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    // Expelling Tornado: keep 3 of the opponent's Benched Pokémon, shuffle the rest (with attached cards) into their deck.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);
      const benchedCount = opponent.bench.filter(slot => slot.cards.length > 0).length;

      if (benchedCount === 0) {
        return state;
      }

      const chooseCount = Math.min(3, benchedCount);

      return store.prompt(state, new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_CARD_TO_DECK,
        PlayerType.TOP_PLAYER,
        [SlotType.BENCH],
        { min: chooseCount, max: chooseCount, allowCancel: false }
      ), chosen => {
        const kept = chosen || [];

        if (kept.length === 0) {
          return;
        }

        opponent.bench.forEach(slot => {
          if (slot.cards.length === 0 || kept.indexOf(slot) !== -1) {
            return;
          }

          state = MOVE_CARDS(store, state, slot, opponent.deck, {
            cards: slot.cards.slice(),
            sourceCard: this
          });
        });

        state = SHUFFLE_DECK(store, state, opponent);
      }) ?? state;
    }

    // Energy Loop: put an Energy attached to this Pokémon into your hand.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const pokemon = player.active.getPokemonCard() === this
        ? player.active
        : player.bench.find(slot => slot.getPokemonCard() === this);

      if (pokemon === undefined) {
        return state;
      }

      const pokemonList = pokemon;
      const energyCards = pokemonList.cards.filter(card => card instanceof EnergyCard);

      if (energyCards.length === 0) {
        return state;
      }

      if (energyCards.length === 1) {
        return MOVE_CARDS(store, state, pokemonList, player.hand, {
          cards: energyCards,
          sourceCard: this
        });
      }

      return store.prompt(state, new ChooseCardsPrompt(
        player,
        GameMessage.CHOOSE_CARD_TO_HAND,
        pokemonList,
        { superType: SuperType.ENERGY },
        { min: 1, max: 1, allowCancel: false }
      ), selected => {
        state = MOVE_CARDS(store, state, pokemonList, player.hand, {
          cards: selected,
          sourceCard: this
        });
      }) ?? state;
    }

    return state;
  }
}
