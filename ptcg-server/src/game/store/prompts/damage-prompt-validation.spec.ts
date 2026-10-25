import { PlayerType, SlotType, CardTarget } from '../actions/play-card-action';
import { ResolvePromptAction } from '../actions/resolve-prompt-action';
import { PokemonCard } from '../card/pokemon-card';
import { State, GamePhase } from '../state/state';
import { Player } from '../state/player';
import { PokemonCardList } from '../state/pokemon-card-list';
import { Store } from '../store';
import { DamageMap, DamageTransfer, MoveDamagePrompt } from './move-damage-prompt';
import { RemoveDamagePrompt } from './remove-damage-prompt';
import { PutDamagePrompt } from './put-damage-prompt';
import { GameMessage } from '../../game-message';

class CounterTarget extends PokemonCard {
  public set = 'TEST';
  public name = 'Counter Target';
  public fullName = 'Counter Target TEST';
  public hp = 200;
}
const own: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
const ownBench: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 };
const opposing: CardTarget = { player: PlayerType.TOP_PLAYER, slot: SlotType.ACTIVE, index: 0 };
const opposingBench: CardTarget = { player: PlayerType.TOP_PLAYER, slot: SlotType.BENCH, index: 0 };
function board() {
  const state = new State();
  state.phase = GamePhase.PLAYER_TURN;
  state.turn = 3;
  state.players = [new Player(), new Player()];
  state.players[0].id = 17;
  state.players[1].id = 29;
  for (const player of state.players) {
    player.active.cards = [new CounterTarget()];
    player.bench = Array.from({ length: 5 }, () => new PokemonCardList());
    player.bench[0].cards = [new CounterTarget()];
    player.bench[0].damage = 10;
  }
  state.players[0].active.damage = 30;
  state.players[1].active.damage = 20;
  return state;
}
const transfer = (from = own, to = opposing): DamageTransfer => ({ from, to });

for (const kind of ['move', 'remove'] as const) {
  describe(`${kind} damage prompt live counter validation`, () => {
    function setup() {
      const state = board();
      const prompt = kind === 'move'
        ? new MoveDamagePrompt(17, GameMessage.MOVE_DAMAGE, PlayerType.ANY, [SlotType.ACTIVE, SlotType.BENCH], [], { allowCancel: false, min: 1 })
        : new RemoveDamagePrompt(17, GameMessage.MOVE_DAMAGE, PlayerType.ANY, [SlotType.ACTIVE, SlotType.BENCH], [], { allowCancel: false, min: 1 });
      return { state, prompt };
    }
    it('accepts existing counters and cross-player occupied targets', () => {
      const { state, prompt } = setup();
      expect(prompt.validate([transfer(), transfer()], state)).toBe(true);
    });
    it('rejects aggregated removal beyond the source damage', () => {
      const { state, prompt } = setup();
      expect(prompt.validate(Array.from({ length: 4 }, () => transfer()), state)).toBe(false);
    });
    it('does not spend counters newly received within the same result', () => {
      const { state, prompt } = setup();
      const moves = Array.from({ length: 4 }, () => transfer(own, ownBench));
      moves.push(transfer(ownBench, own));
      expect(prompt.validate(moves, state)).toBe(false);
    });
    it('rejects a source with no damage', () => {
      const { state, prompt } = setup();
      state.players[0].active.damage = 0;
      expect(prompt.validate([transfer()], state)).toBe(false);
    });
    it('rejects moving a counter to its own physical list', () => {
      const { state, prompt } = setup();
      expect(prompt.validate([transfer(own, own)], state)).toBe(false);
    });
    for (const side of ['from', 'to'] as const) {
      it(`rejects an empty ${side} slot`, () => {
        const { state, prompt } = setup();
        const entry = transfer(); entry[side] = { ...ownBench, index: 1 };
        expect(prompt.validate([entry], state)).toBe(false);
      });
      for (const invalid of [
        { ...own, index: 1 },
        { ...ownBench, index: -1 },
        { ...ownBench, index: 0.5 },
        { ...ownBench, index: 100 },
        { ...own, player: PlayerType.ANY },
        { ...own, slot: 99 as SlotType },
      ]) {
        it(`rejects invalid ${side} coordinate ${JSON.stringify(invalid)}`, () => {
          const { state, prompt } = setup();
          const entry = transfer(); entry[side] = invalid;
          expect(() => prompt.validate([entry], state)).not.toThrow();
          expect(prompt.validate([entry], state)).toBe(false);
        });
      }
    }
    it('honors direction blocks and min/max selection counts', () => {
      const { state, prompt } = setup();
      prompt.options.blockedFrom = [own];
      expect(prompt.validate([transfer()], state)).toBe(false);
      prompt.options.blockedFrom = [];
      prompt.options.blockedTo = [opposing];
      expect(prompt.validate([transfer()], state)).toBe(false);
      prompt.options.blockedTo = [];
      prompt.options.max = 1;
      expect(prompt.validate([transfer(), transfer()], state)).toBe(false);
      expect(prompt.validate([], state)).toBe(false);
    });
    it('honors one-source and one-destination constraints', () => {
      const { state, prompt } = setup();
      if (prompt instanceof MoveDamagePrompt) {
        prompt.options.singleSourceTarget = true; prompt.options.singleDestinationTarget = true;
      } else {
        prompt.options.sameSource = true; prompt.options.sameTarget = true;
      }
      expect(prompt.validate([transfer(), transfer(ownBench, opposing)], state)).toBe(false);
      expect(prompt.validate([transfer(), transfer(own, opposingBench)], state)).toBe(false);
      expect(prompt.validate([transfer(), transfer()], state)).toBe(true);
    });
    it('checks the receiving final damage cap rather than each individual transfer', () => {
      const { state, prompt } = setup();
      prompt.maxAllowedDamage = [{ target: opposing, damage: 30 }];
      expect(prompt.validate([transfer()], state)).toBe(true);
      expect(prompt.validate([transfer(), transfer()], state)).toBe(false);
    });
    it('preserves actual second-player perspective', () => {
      const { state, prompt } = setup();
      prompt.playerId = 29;
      state.players[1].active.damage = 10;
      expect(prompt.validate([transfer()], state)).toBe(true);
      expect(prompt.validate([transfer(), transfer()], state)).toBe(false);
    });
    it('returns false for malformed network results without throwing', () => {
      const { state, prompt } = setup();
      for (const result of [{}, [null], [{}], [{ from: null, to: opposing }]]) {
        expect(() => prompt.validate(result as DamageTransfer[], state)).not.toThrow();
        expect(prompt.validate(result as DamageTransfer[], state)).toBe(false);
      }
    });
    it('allows cancellation only when declared', () => {
      const { state, prompt } = setup();
      expect(prompt.validate(null, state)).toBe(false);
      prompt.options.allowCancel = true;
      expect(prompt.validate(null, state)).toBe(true);
    });
    it('revalidates live state before Store calls the card callback', () => {
      const { state, prompt } = setup();
      const store = new Store({ onStateChange() {} }, false); store.state = state;
      let calls = 0;
      store.prompt(state, prompt, () => calls++);
      state.players[0].active.damage = 0;
      expect(() => store.dispatch(new ResolvePromptAction(prompt.id, [transfer()]))).toThrow();
      expect(calls).toBe(0);
      expect(state.players[1].active.damage).toBe(20);
    });
  });
}

describe('put damage prompt validates actual placement amounts', () => {
  function setup(partial = false, step = 10) {
    const state = board();
    const prompt = new PutDamagePrompt(17, GameMessage.CHOOSE_POKEMON_TO_DAMAGE, PlayerType.ANY,
      [SlotType.ACTIVE, SlotType.BENCH], 30, [], { allowCancel: false, allowPlacePartialDamage: partial, damageMultiple: step });
    return { state, prompt };
  }
  it('accepts exact distribution, partial distribution and an explicit zero choice', () => {
    const { state, prompt } = setup();
    expect(prompt.validate([{ target: opposing, damage: 10 }, { target: opposingBench, damage: 20 }], state)).toBe(true);
    expect(prompt.validate([{ target: opposing, damage: 10 }], state)).toBe(false);
    prompt.options.allowPlacePartialDamage = true;
    expect(prompt.validate([{ target: opposing, damage: 10 }], state)).toBe(true);
    expect(prompt.validate([], state)).toBe(true);
  });
  for (const amount of [-10, 0, 15, 0.5, NaN, Infinity, 40]) {
    it(`rejects invalid or over-budget partial amount ${String(amount)}`, () => {
      const { state, prompt } = setup(true);
      expect(prompt.validate([{ target: opposing, damage: amount }], state)).toBe(false);
    });
  }
  it('rejects duplicate target entries rather than bypass aggregate caps', () => {
    const { state, prompt } = setup();
    expect(prompt.validate([{ target: opposing, damage: 10 }, { target: opposing, damage: 20 }], state)).toBe(false);
  });
  it('uses existing damage when checking the destination cap', () => {
    const { state, prompt } = setup(true);
    prompt.maxAllowedDamage = [{ target: opposing, damage: 30 }];
    expect(prompt.validate([{ target: opposing, damage: 10 }], state)).toBe(true);
    expect(prompt.validate([{ target: opposing, damage: 20 }], state)).toBe(false);
  });
  it('respects a configured two-counter placement step', () => {
    const { state, prompt } = setup(true, 20);
    prompt.damage = 40;
    expect(prompt.validate([{ target: opposing, damage: 20 }], state)).toBe(true);
    expect(prompt.validate([{ target: opposing, damage: 10 }], state)).toBe(false);
  });
  it('rejects unknown sides, active aliases and empty targets', () => {
    const { state, prompt } = setup();
    for (const target of [{ ...own, player: PlayerType.ANY }, { ...own, index: 1 }, { ...ownBench, index: 1 }]) {
      expect(prompt.validate([{ target, damage: 30 }], state)).toBe(false);
    }
  });
  it('does not throw on malformed payloads', () => {
    const { state, prompt } = setup();
    for (const result of [{}, [null], [{}], [{ target: null, damage: 30 }]]) {
      expect(() => prompt.validate(result as DamageMap[], state)).not.toThrow();
      expect(prompt.validate(result as DamageMap[], state)).toBe(false);
    }
  });
  it('Store rejects an over-budget partial result before the placement callback', () => {
    const { state, prompt } = setup(true);
    const store = new Store({ onStateChange() {} }, false); store.state = state;
    let calls = 0;
    store.prompt(state, prompt, () => calls++);
    expect(() => store.dispatch(new ResolvePromptAction(prompt.id, [{ target: opposing, damage: 40 }]))).toThrow();
    expect(calls).toBe(0);
    expect(state.players[1].active.damage).toBe(20);
  });
});
