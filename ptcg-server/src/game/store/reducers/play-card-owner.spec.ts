import { CardType, EnergyType, Format } from '../card/card-types';
import { PokemonCard } from '../card/pokemon-card';
import { EnergyCard } from '../card/energy-card';
import { CardList } from '../state/card-list';
import { PokemonCardList } from '../state/pokemon-card-list';
import { Player } from '../state/player';
import { GamePhase } from '../state/state';
import { Store } from '../store';
import { PlayCardAction, PlayerType, SlotType } from '../actions/play-card-action';
import { GameMessage } from '../../game-message';
import { GameError } from '../../game-error';

class Basic extends PokemonCard { set = 'TEST'; name = 'Basic'; fullName = 'Basic TEST'; hp = 100; }
class Energy extends EnergyCard { set = 'TEST'; name = 'Energy'; fullName = 'Energy TEST'; format = Format.UNLIMITED; provides = [CardType.WATER]; }
function fixture(type: EnergyType) {
  const store = new Store({ onStateChange: () => undefined });
  store.state.phase = GamePhase.PLAYER_TURN; store.state.turn = 2; store.state.activePlayer = 0;
  store.state.players = [1, 2].map(id => {
    const player = new Player(); player.id = id;
    player.active.cards = [new Basic()];
    player.bench = Array.from({ length: 5 }, () => new PokemonCardList());
    player.bench[0].cards = [new Basic()];
    player.deck.cards = [new Energy()];
    player.prizes = Array.from({ length: 6 }, () => Object.assign(new CardList(), { cards: [new Energy()] }));
    return player;
  });
  const card = new Energy(); card.energyType = type; card.id = 50;
  store.state.players[0].hand.cards = [card];
  return { store, card };
}

describe('Normal hand energy attachment ownership', () => {
  for (const type of [EnergyType.BASIC, EnergyType.SPECIAL]) {
    for (const slot of [SlotType.ACTIVE, SlotType.BENCH]) {
      for (const player of [PlayerType.TOP_PLAYER, PlayerType.ANY]) {
        it(`rejects energy ${type} to player ${player} slot ${slot} without using the card/turn attachment`, () => {
          const { store, card } = fixture(type);
          const before = store.state.players[0].energyPlayedTurn;
          expect(() => store.dispatch(new PlayCardAction(1, 0, { player, slot, index: 0 }))).toThrow(new GameError(GameMessage.INVALID_TARGET));
          expect(store.state.players[0].hand.cards).toEqual([card]);
          expect(store.state.players[0].energyPlayedTurn).toBe(before);
          expect(store.state.players[1].active.energies.cards.length).toBe(0);
          expect(store.state.players[1].bench[0].energies.cards.length).toBe(0);
        });
      }
      it(`still attaches energy ${type} to the owner's slot ${slot}`, () => {
        const { store, card } = fixture(type);
        store.dispatch(new PlayCardAction(1, 0, { player: PlayerType.BOTTOM_PLAYER, slot, index: 0 }));
        const owner = store.state.players[0];
        const target = slot === SlotType.ACTIVE ? owner.active : owner.bench[0];
        expect(owner.hand.cards.length).toBe(0);
        expect(target.cards.includes(card)).toBe(true);
        expect(target.energies.cards).toEqual([card]);
        expect(owner.energyPlayedTurn).toBe(2);
      });
    }
  }
  it('rejects malformed Active index and non-Pokémon slot', () => {
    for (const target of [
      { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 1 },
      { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: .5 },
      { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BOARD, index: 0 },
    ]) {
      const { store } = fixture(EnergyType.BASIC);
      expect(() => store.dispatch(new PlayCardAction(1, 0, target))).toThrow(new GameError(GameMessage.INVALID_TARGET));
    }
  });
  it('allows a correct retry after a rejected opponent attachment', () => {
    const { store, card } = fixture(EnergyType.BASIC);
    expect(() => store.dispatch(new PlayCardAction(1, 0, { player: PlayerType.TOP_PLAYER, slot: SlotType.ACTIVE, index: 0 }))).toThrow();
    store.dispatch(new PlayCardAction(1, 0, { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 }));
    expect(store.state.players[0].active.energies.cards).toEqual([card]);
  });
});
