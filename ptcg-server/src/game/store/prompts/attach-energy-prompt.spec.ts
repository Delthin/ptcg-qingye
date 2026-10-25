import { AttachEnergyPrompt } from './attach-energy-prompt';
import { GameMessage } from '../../game-message';
import { CardType, EnergyType, SuperType } from '../card/card-types';
import { EnergyCard } from '../card/energy-card';
import { PokemonCard } from '../card/pokemon-card';
import { PlayerType, SlotType } from '../actions/play-card-action';
import { State } from '../state/state';
import { Player } from '../state/player';
import { PokemonCardList } from '../state/pokemon-card-list';

class TestEnergy extends EnergyCard {
  public set = 'TEST';
  public fullName = 'Water Energy TEST';
  public name = 'Water Energy';
  public provides = [CardType.WATER];
  public energyType = EnergyType.BASIC;
}
class TestPokemon extends PokemonCard {
  public set = 'TEST';
  public fullName = 'Test Pokemon TEST';
  public name = 'Test Pokemon';
}
const active = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
const bench = { ...active, slot: SlotType.BENCH };
function fixture(options = {}) {
  const state = new State();
  const player = new Player(); player.id = 1;
  const opponent = new Player(); opponent.id = 2;
  state.players = [player, opponent];
  player.bench = [new PokemonCardList(), new PokemonCardList()];
  [player.active, player.bench[0], opponent.active].forEach(slot => slot.cards.push(new TestPokemon()));
  player.hand.cards = [new TestEnergy(), new TestEnergy(), new TestEnergy()];
  const prompt = new AttachEnergyPrompt(1, GameMessage.ATTACH_ENERGY_CARDS, player.hand,
    PlayerType.BOTTOM_PLAYER, [SlotType.ACTIVE, SlotType.BENCH],
    { superType: SuperType.ENERGY, energyType: EnergyType.BASIC, name: 'Water Energy' },
    { min: 0, max: 3, ...options });
  const valid = (raw: any) => {
    try { return prompt.validate(prompt.decode(raw, state), state); } catch (_) { return false; }
  };
  return { state, player, opponent, prompt, valid };
}

describe('AttachEnergyPrompt complete allocation contract', () => {
  it('allows identical printings as distinct physical cards and zero/cancel as declared', () => {
    const { valid } = fixture();
    expect(valid([{ to: active, index: 0 }, { to: bench, index: 1 }])).toBe(true);
    expect(valid([])).toBe(true);
    expect(valid(null)).toBe(true);
    expect(fixture({ allowCancel: false }).valid(null)).toBe(false);
  });
  it('rejects wrong source type/filter, blocked indices and non-source card objects', () => {
    const { player, prompt, state, valid } = fixture({ blocked: [2] });
    (player.hand.cards[0] as EnergyCard).energyType = EnergyType.SPECIAL;
    player.hand.cards[1].name = 'Fire Energy';
    for (let index = 0; index < 3; index++) expect(valid([{ to: active, index }])).toBe(false);
    expect(prompt.validate([{ to: active, card: new TestEnergy() }], state)).toBe(false);
  });
  it('rejects duplicate physical indices and aliases before accepting any member', () => {
    const { player, valid } = fixture();
    expect(valid([{ to: active, index: 0 }, { to: bench, index: 0 }])).toBe(false);
    player.hand.cards[1] = player.hand.cards[0];
    expect(valid([{ to: active, index: 0 }, { to: bench, index: 1 }])).toBe(false);
  });
  it('rejects malformed wire input without coercing indices or targets', () => {
    const { valid } = fixture();
    [false, {}, [null], [{ to: active, index: '0' }], [{ to: active, index: -1 }],
      [{ to: active, index: 0.5 }], [{ to: active, index: 99 }], [{ index: 0 }],
      [{ to: { ...active, index: '0' }, index: 0 }]].forEach(raw => expect(valid(raw)).toBe(false));
  });
  it('enforces owner, declared slots, occupied targets, blockedTo and active index', () => {
    const { valid, prompt } = fixture({ blockedTo: [bench] });
    [{ ...active, player: PlayerType.TOP_PLAYER }, { ...active, player: PlayerType.ANY },
      { ...active, slot: SlotType.HAND }, { ...bench, index: 1 }, { ...bench, index: 99 },
      { ...active, index: 1 }, bench].forEach(to => expect(valid([{ to, index: 0 }])).toBe(false));
    prompt.slots = [SlotType.BENCH];
    expect(valid([{ to: active, index: 0 }])).toBe(false);
  });
  it('resolves ANY/TOP and perspective overrides relative to the resource owner', () => {
    const { valid, prompt, opponent } = fixture();
    prompt.playerType = PlayerType.ANY;
    expect(valid([{ to: { ...active, player: PlayerType.TOP_PLAYER }, index: 0 }])).toBe(true);
    prompt.playerType = PlayerType.TOP_PLAYER;
    expect(valid([{ to: active, index: 0 }])).toBe(false);
    prompt.perspectivePlayerId = opponent.id;
    expect(valid([{ to: { ...active, player: PlayerType.TOP_PLAYER }, index: 0 }])).toBe(true);
  });
  it('enforces all quotas together (validCardTypes must not bypass differentTypes/targets)', () => {
    const { valid } = fixture({ validCardTypes: [CardType.WATER], differentTypes: true });
    expect(valid([{ to: active, index: 0 }, { to: bench, index: 1 }])).toBe(false);
    expect(fixture({ maxPerType: 1 }).valid([{ to: active, index: 0 }, { to: bench, index: 1 }])).toBe(false);
    expect(fixture({ maxPerType: 0 }).valid([{ to: active, index: 0 }])).toBe(false);
    expect(fixture({ sameTarget: true }).valid([{ to: active, index: 0 }, { to: bench, index: 1 }])).toBe(false);
    expect(fixture({ validCardTypes: [CardType.WATER], differentTargets: true }).valid(
      [{ to: active, index: 0 }, { to: active, index: 1 }])).toBe(false);
    expect(fixture({ min: 1 }).valid([])).toBe(false);
    expect(fixture({ max: 1 }).valid([{ to: active, index: 0 }, { to: bench, index: 1 }])).toBe(false);
  });
  it('validates targets again against state when occupancy changes after decode', () => {
    const { prompt, state, player } = fixture();
    const decoded = prompt.decode([{ to: bench, index: 0 }], state);
    player.bench[0].cards = [];
    expect(prompt.validate(decoded, state)).toBe(false);
  });
});
