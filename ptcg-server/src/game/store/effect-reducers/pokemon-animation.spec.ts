import { PokemonCard } from '../card/pokemon-card';
import { PlayPokemonEffect, PlayPokemonFromDeckEffect, PlayPokemonFromDiscardEffect } from '../effects/play-card-effects';
import { Player } from '../state/player';
import { PokemonCardList } from '../state/pokemon-card-list';
import { State } from '../state/state';
import { StoreLike } from '../store-like';
import { SlotType } from '../actions/play-card-action';
import { playPokemonReducer } from './play-pokemon-effect';
import { playPokemonFromDeckReducer } from './play-pokemon-from-deck-effect';
import { playPokemonFromDiscardReducer } from './play-pokemon-from-discard-effect';

class Basic extends PokemonCard { set = 'TEST'; name = 'Basic'; fullName = 'Basic TEST'; hp = 70; }

const entrances = [
  { source: 'hand' as const, Effect: PlayPokemonEffect, reduce: playPokemonReducer },
  { source: 'deck' as const, Effect: PlayPokemonFromDeckEffect, reduce: playPokemonFromDeckReducer },
  { source: 'discard' as const, Effect: PlayPokemonFromDiscardEffect, reduce: playPokemonFromDiscardReducer },
];

function fixture() {
  const state = new State();
  state.turn = 3;
  state.players = [11, 22].map(id => {
    const player = new Player();
    player.id = id;
    player.bench = Array.from({ length: 5 }, () => new PokemonCardList());
    return player;
  });
  const old = new Basic(); old.id = 10;
  state.players[0].bench[1].cards = [old];
  state.players[0].bench[1].damage = 20;
  const incoming = new Basic(); incoming.id = 20;
  const events: { name: string; data: unknown }[] = [];
  const store = {
    log() {},
    handler: { id: 7, core: { emit(notify: (client: { socket: { emit(name: string, data: unknown): void } }) => void) {
      notify({ socket: { emit(name, data) { events.push({ name, data }); } } });
    } } },
  } as unknown as StoreLike;
  return { state, store, incoming, old, events };
}

describe('Pokemon entrance animation uses the real target', () => {
  for (const entrance of entrances) {
    for (const location of [
      { owner: 0, slot: SlotType.ACTIVE, index: 0 },
      { owner: 0, slot: SlotType.BENCH, index: 0 },
      { owner: 0, slot: SlotType.BENCH, index: 3 },
      { owner: 1, slot: SlotType.BENCH, index: 2 },
    ]) {
      it(`${entrance.source}: derives owner ${location.owner}, slot ${location.slot}, index ${location.index} without caller metadata`, () => {
        const { state, store, incoming, old, events } = fixture();
        const source = state.players[0];
        const owner = state.players[location.owner];
        const target = location.slot === SlotType.ACTIVE ? owner.active : owner.bench[location.index];
        source[entrance.source].cards = [incoming];
        const effect = new entrance.Effect(source, incoming, target);
        expect(entrance.reduce(store, state, effect)).toBe(state);
        expect(events).toEqual([{ name: 'game[7]:playBasicAnimation', data: {
          playerId: owner.id, cardId: 20, slot: String(location.slot), index: location.index,
        } }]);
        expect(source[entrance.source].cards).toEqual([]);
        expect(target.cards).toEqual([incoming]);
        expect(source.bench[1].cards).toEqual([old]);
        expect(source.bench[1].damage).toBe(20);
      });
    }

    it(`${entrance.source}: ignores stale caller position in favor of the target reference`, () => {
      const { state, store, incoming, events } = fixture();
      const player = state.players[0];
      player[entrance.source].cards = [incoming];
      entrance.reduce(store, state, new entrance.Effect(player, incoming, player.bench[3], SlotType.ACTIVE, 0));
      expect(events).toEqual([{ name: 'game[7]:playBasicAnimation', data: {
        playerId: 11, cardId: 20, slot: String(SlotType.BENCH), index: 3,
      } }]);
    });

    it(`${entrance.source}: does not guess a position for a list outside the board`, () => {
      const { state, store, incoming, events } = fixture();
      const player = state.players[0];
      player[entrance.source].cards = [incoming];
      const detached = new PokemonCardList();
      entrance.reduce(store, state, new entrance.Effect(player, incoming, detached, SlotType.BENCH, 0));
      expect(events).toEqual([]);
      // Resolving animation metadata must not introduce new card-play rules.
      expect(detached.cards).toEqual([incoming]);
    });
  }
});
