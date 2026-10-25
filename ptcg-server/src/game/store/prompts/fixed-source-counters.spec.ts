import { PokemonCard } from '../card/pokemon-card';
import { Player } from '../state/player';
import { State } from '../state/state';
import { PokemonCardList } from '../state/pokemon-card-list';
import { CardTarget, PlayerType, SlotType } from '../actions/play-card-action';
import { MoveDamagePrompt } from './move-damage-prompt';
import { GameMessage } from '../../game-message';

class CounterSource extends PokemonCard {
  public set = 'TEST'; public name = 'Fixed Source'; public fullName = 'Fixed Source TEST'; public hp = 200;
}
const from: CardTarget = { player: PlayerType.TOP_PLAYER, slot: SlotType.ACTIVE, index: 0 };
const to: CardTarget = { player: PlayerType.TOP_PLAYER, slot: SlotType.BENCH, index: 0 };
function fixture(damage: number) {
  const state = new State(); state.players = [new Player(), new Player()];
  state.players[0].id = 17; state.players[1].id = 29;
  state.players[1].active.cards = [new CounterSource()]; state.players[1].active.damage = damage;
  state.players[1].bench = [new PokemonCardList()];
  state.players[1].bench[0].cards = [new CounterSource()]; state.players[1].bench[0].damage = 40;
  const prompt = new MoveDamagePrompt(17, GameMessage.MOVE_DAMAGE, PlayerType.TOP_PLAYER,
    [SlotType.ACTIVE, SlotType.BENCH], [], { min: 1, max: 3, allowCancel: true,
      singleSourceTarget: true, singleDestinationTarget: true, fixedSourceCounters: 3 });
  const moves = (count: number) => Array.from({ length: count }, () => ({ from, to }));
  return { state, prompt, moves };
}
describe('fixed counters from the selected source (Cursed Eyes rulings 62/63)', () => {
  it('requires three when the chosen source has at least three', () => {
    const { state, prompt, moves } = fixture(40);
    expect(prompt.validate(moves(3), state)).toBe(true);
    expect(prompt.validate(moves(1), state)).toBe(false);
    expect(prompt.validate(moves(2), state)).toBe(false);
  });
  it('permits choosing a two-counter source even when another source has four', () => {
    const { state, prompt, moves } = fixture(20);
    expect(prompt.validate(moves(2), state)).toBe(true);
    expect(prompt.validate(moves(1), state)).toBe(false);
    expect(prompt.validate(moves(3), state)).toBe(false);
  });
  it('moves the sole counter when that source has only one', () => {
    const { state, prompt, moves } = fixture(10);
    expect(prompt.validate(moves(1), state)).toBe(true);
  });
  it('allows all three even if they exceed the recipient HP', () => {
    const { state, prompt, moves } = fixture(30); state.players[1].bench[0].damage = 190;
    expect(prompt.validate(moves(3), state)).toBe(true);
  });
  it('distinguishes declining the optional effect from choosing zero counters', () => {
    const { state, prompt, moves } = fixture(40);
    expect(prompt.validate(null, state)).toBe(true);
    expect(prompt.validate(moves(0), state)).toBe(false);
  });
});
