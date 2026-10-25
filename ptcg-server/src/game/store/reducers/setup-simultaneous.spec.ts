import { StateSanitizer } from '../../../backend/socket/state-sanitizer';
import { GameMessage } from '../../game-message';
import { Format, Stage } from '../card/card-types';
import { PokemonCard } from '../card/pokemon-card';
import { EnergyCard } from '../card/energy-card';
import { Prompt } from '../prompts/prompt';
import { CardList } from '../state/card-list';
import { PokemonCardList } from '../state/pokemon-card-list';
import { Player } from '../state/player';
import { GamePhase } from '../state/state';
import { Store } from '../store';
import { ResolvePromptAction } from '../actions/resolve-prompt-action';
import { ChooseStartingPokemonPrompt } from '../prompts/choose-starting-pokemon-prompt';
import { PromptSerializer } from '../../serializer/prompt.serializer';
import { setupGame, setupStartingPlayersTogether } from './setup-reducer';

class Basic extends PokemonCard {
  set = 'TEST'; name = 'Basic'; fullName = 'Basic TEST 1'; hp = 100;
}
function basic(id: number): Basic { const card = new Basic(); card.id = id; return card; }
class Energy extends EnergyCard { set = 'TEST'; name = 'Energy'; fullName = 'Energy TEST'; format = Format.STANDARD; }
function energy(id: number): Energy { const card = new Energy(); card.id = id; return card; }
function resolve(store: Store, prompt: Prompt<any>, raw: any): void {
  const decoded = prompt.decode(raw, store.state);
  if (!prompt.validate(decoded, store.state)) throw new Error('Invalid prompt answer');
  store.dispatch(new ResolvePromptAction(prompt.id, decoded));
}
function player(id: number): Player {
  const p = new Player(); p.id = id; p.name = `Player ${id}`;
  p.active.isPublic = true;
  p.bench = Array.from({ length: 5 }, () => { const list = new PokemonCardList(); list.isPublic = true; return list; });
  p.prizes = Array.from({ length: 6 }, () => { const list = new CardList(); list.isSecret = true; return list; });
  p.deck.cards = Array.from({ length: 53 }, (_, i) => energy(id * 1000 + i));
  p.deck.isSecret = true;
  p.hand.cards = [basic(id * 100), basic(id * 100 + 1), ...Array.from({ length: 5 }, (_, i) => energy(id * 100 + 2 + i))];
  return p;
}
function harness(format = Format.STANDARD) {
  const store = new Store({ onStateChange: () => undefined });
  store.state.phase = GamePhase.SETUP;
  store.state.players = [player(1), player(2)];
  store.state.gameSettings = { ...store.state.gameSettings, format } as any;
  store.state.cardNames = ['Basic TEST 1'];
  let completed = 0;
  const generator = setupStartingPlayersTogether(store.state, store, () => { completed++; });
  generator.next();
  return { store, get completed() { return completed; } };
}

describe('Simultaneous starting Pokémon', () => {
  for (const first of [0, 1]) {
    it(`lets player ${first + 1} confirm first without moving or revealing either selection`, () => {
      const h = harness(); const state = h.store.state;
      const prompts = state.prompts as ChooseStartingPokemonPrompt[];
      expect(prompts.length).toBe(2);
      expect(prompts.map(p => p.playerId)).toEqual([1, 2]);
      resolve(h.store, prompts[first], [0, 1]);
      expect(h.completed).toBe(0);
      for (const p of state.players) {
        expect(p.hand.cards.length).toBe(7); expect(p.active.cards.length).toBe(0);
        expect(p.bench.every(list => list.cards.length === 0)).toBe(true);
        expect(p.prizes.every(list => list.cards.length === 0)).toBe(true);
      }
      const other = 1 - first;
      const view = StateSanitizer.sanitizeForViewer(state, { playerId: state.players[other].id, roleId: 1 });
      expect(view.prompts.filter(p => p.playerId === state.players[other].id).length).toBe(1);
      expect(view.players[first].hand.cards.every(c => c.fullName === 'Unknown')).toBe(true);
      resolve(h.store, prompts[other], [1]);
      expect(h.completed).toBe(1);
      expect(state.players[first].active.cards[0].id).toBe((first + 1) * 100);
      expect(state.players[first].bench[0].cards[0].id).toBe((first + 1) * 100 + 1);
      for (const p of state.players) {
        expect(p.active.isSecret).toBe(true);
        expect(p.prizes.reduce((n, list) => n + list.cards.length, 0)).toBe(6);
        expect(p.deck.cards.length).toBe(47);
        expect(p.deck.cards.length + p.hand.cards.length + p.active.cards.length +
          p.bench.reduce((n, b) => n + b.cards.length, 0) + p.prizes.reduce((n, b) => n + b.cards.length, 0)).toBe(60);
      }
    });
  }
  it('preserves the exact drafted bench slot and keeps the first submitted layout private', () => {
    const h = harness();
    resolve(h.store, h.store.state.prompts[0], { active: 1, bench: [null, null, null, null, 0] });
    const view = StateSanitizer.sanitizeForViewer(h.store.state, { playerId: 2, roleId: 1 });
    expect(view.players[0].active.cards.length).toBe(0);
    expect(view.players[0].bench.every(list => list.cards.length === 0)).toBe(true);
    resolve(h.store, h.store.state.prompts[1], { active: 0, bench: [null, null, null, null, null] });
    expect(h.store.state.players[0].active.cards[0].id).toBe(101);
    expect(h.store.state.players[0].bench[4].cards[0].id).toBe(100);
    expect(h.store.state.players[0].bench.slice(0, 4).every(list => list.cards.length === 0)).toBe(true);
  });
  it('rejects duplicate cards, missing Active, non-basics and invalid layout shapes', () => {
    const h = harness(); const p = h.store.state.prompts[0];
    for (const layout of [
      { active: 0, bench: [0, null, null, null, null] },
      { active: null, bench: [1, null, null, null, null] },
      { active: 2, bench: [null, null, null, null, null] },
      { active: 0, bench: [1] },
      { active: 0, bench: [99, null, null, null, null] },
    ]) expect(() => resolve(h.store, p, layout)).toThrow();
    expect(p.result).toBeUndefined(); expect(h.completed).toBe(0);
  });
  it('round-trips the prompt and prevents replacing occupied slots during extra bench preparation', () => {
    const owner = player(1); owner.active.cards = [basic(600)]; owner.bench[0].cards = [basic(601)];
    const p = new ChooseStartingPokemonPrompt(owner, [2, 3, 4, 5, 6], false);
    const serializer = new PromptSerializer();
    const restored = serializer.deserialize(serializer.serialize(p), {} as any) as ChooseStartingPokemonPrompt;
    expect(restored instanceof ChooseStartingPokemonPrompt).toBe(true);
    expect(restored.activeRequired).toBe(false);
    expect(restored.blockedBench).toEqual([0]);
    expect(restored.validate(restored.decode({ active: null, bench: [0, null, null, null, null] }))).toBe(false);
    expect(restored.validate(restored.decode({ active: null, bench: [null, null, null, null, 0] }))).toBe(true);
  });
  it('rejects a non-basic choice without accepting the other player prematurely', () => {
    const h = harness(); const prompts = h.store.state.prompts;
    expect(() => resolve(h.store, prompts[0], [2])).toThrow();
    expect(prompts[0].result).toBeUndefined(); expect(h.completed).toBe(0);
  });
  it('respects the four-prize pre-release format', () => {
    const h = harness(Format.PRE_RELEASE);
    resolve(h.store, h.store.state.prompts[0], [0]);
    resolve(h.store, h.store.state.prompts[1], [0]);
    expect(h.store.state.players[0].prizes.reduce((n, list) => n + list.cards.length, 0)).toBe(4);
  });
  it('strips face-down active/bench identities from an opponent view on the wire', () => {
    const h = harness(); const p = h.store.state.players[0];
    p.active.cards = [basic(800)]; p.active.isSecret = true;
    p.bench[0].cards = [basic(801)]; p.bench[0].isSecret = true;
    const opponent = StateSanitizer.sanitizeForViewer(h.store.state, { playerId: 2, roleId: 1 });
    expect(opponent.players[0].active.cards[0].fullName).toBe('Unknown');
    expect(opponent.players[0].bench[0].cards[0].fullName).toBe('Unknown');
    const own = StateSanitizer.sanitizeForViewer(h.store.state, { playerId: 1, roleId: 1 });
    expect(own.players[0].active.cards[0].fullName).toBe('Basic TEST 1');
    expect(p.active.cards[0].id).toBe(800);
  });
  it('finishes a one-sided mulligan before issuing BOTH starting prompts', () => {
    const h = harness(); const store = h.store; const state = store.state;
    // Discard the unused harness group and use a fresh real Store/generator.
    const actual = new Store({ onStateChange: () => undefined }); actual.state = state; state.prompts = [];
    state.players[0].hand.moveTo(state.players[0].deck);
    state.players[1].hand.moveTo(state.players[1].deck);
    state.players[0].deck.cards = [basic(500), ...Array.from({ length: 59 }, (_, i) => energy(510 + i))];
    state.players[1].deck.cards = [...Array.from({ length: 7 }, (_, i) => energy(600 + i)), basic(607), ...Array.from({ length: 52 }, (_, i) => energy(608 + i))];
    const generator = setupGame(() => generator.next(), actual, state); generator.next();
    const answer = (prompt: any, value: any) => resolve(actual, prompt, value);
    answer(state.prompts.find(p => p.result === undefined), true); // coin
    answer(state.prompts.find(p => p.result === undefined), true); // go first
    for (const prompt of state.prompts.filter(p => p.result === undefined)) answer(prompt, Array.from({ length: 60 }, (_, i) => i));
    const remaining = state.prompts.filter(p => p.result === undefined);
    expect(remaining.length).toBe(1);
    expect(remaining[0].playerId).toBe(2);
    expect(state.players[0].active.cards.length).toBe(0);
    answer(remaining[0], Array.from({ length: 60 }, (_, i) => i)); // moved-back energies are at deck tail
    const starting = state.prompts.filter(p => p.result === undefined) as ChooseStartingPokemonPrompt[];
    expect(starting.length).toBe(2);
    expect(starting.every(p => p.message === GameMessage.CHOOSE_STARTING_POKEMONS)).toBe(true);
    expect((state.players[0].hand.cards[0] as PokemonCard).stage).toBe(Stage.BASIC);
  });
});
