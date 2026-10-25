import { Store } from '../../game/store/store';
import { State, GamePhase } from '../../game/store/state/state';
import { Player } from '../../game/store/state/player';
import { Card } from '../../game/store/card/card';
import { CardList } from '../../game/store/state/card-list';
import { PokemonCardList } from '../../game/store/state/pokemon-card-list';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { EnergyCard } from '../../game/store/card/energy-card';
import { CardType, EnergyType, Stage, SuperType, CardTag } from '../../game/store/card/card-types';
import { AttackAction } from '../../game/store/actions/game-actions';
import { PlayCardAction, CardTarget, PlayerType, SlotType } from '../../game/store/actions/play-card-action';
import { ResolvePromptAction } from '../../game/store/actions/resolve-prompt-action';
import { Prompt } from '../../game/store/prompts/prompt';
import { WaitPrompt } from '../../game/store/prompts/wait-prompt';
import { ShuffleDeckPrompt } from '../../game/store/prompts/shuffle-prompt';
import { ChooseCardsPrompt } from '../../game/store/prompts/choose-cards-prompt';
import { MoveEnergyPrompt } from '../../game/store/prompts/move-energy-prompt';
import { DiscardEnergyPrompt } from '../../game/store/prompts/discard-energy-prompt';
import { AttachEnergyPrompt } from '../../game/store/prompts/attach-energy-prompt';
import { StateSerializer } from '../../game/serializer/state-serializer';
import { CheckProvidedEnergyEffect } from '../../game/store/effects/check-effects';
import { AttackEffect } from '../../game/store/effects/game-effects';
import { DiscardCardsEffect } from '../../game/store/effects/attack-effects';
import { AttachEnergyEffect } from '../../game/store/effects/play-card-effects';
import { GameMessage } from '../../game/game-message';
import { StateUtils } from '../../game/store/state-utils';
import { EnergySwitch } from '../10-scarlet-and-violet/set-scarlet-and-violet/energy-switch';
import { UltraBallSLG as UltraBall } from '../set-shining-legends/other-prints';
import { EthansMagcargo } from '../10-scarlet-and-violet/set-destined-rivals/ethans-magcargo';
import { TeamRocketsMewtwoex } from '../10-scarlet-and-violet/set-destined-rivals/team-rockets-mewtwo-ex';
import { TeamRocketsEnergy } from '../10-scarlet-and-violet/set-destined-rivals/team-rockets-energy';
import { LuminousEnergy } from '../10-scarlet-and-violet/set-paldea-evolved/luminous-energy';
import { TempleofSinnoh as TempleOfSinnoh } from '../09-sword-and-shield/set-astral-radiance/temple-of-sinnoh';
import { DoubleTurboEnergy } from '../09-sword-and-shield/set-brilliant-stars/double-turbo-energy';
import { TripleAccelerationEnergy } from '../08-sun-and-moon/set-unbroken-bonds/triple-acceleration-energy';
import { CaptureEnergy } from '../09-sword-and-shield/set-rebel-clash/capture-energy';
import { Laprasex } from '../10-scarlet-and-violet/set-stellar-crown/lapras-ex';
import { Clefable } from '../10-scarlet-and-violet/set-twilight-masquerade/clefable';

class Target extends PokemonCard {
  public name = 'Contract Target'; public fullName = 'Contract Target TEST'; public set = 'TEST';
  public hp = 2000; public weakness = []; public resistance = [];
  protected _tags = [CardTag.TEAM_ROCKET];
}
class Basic extends EnergyCard {
  public name = ''; public fullName = ''; public set = 'TEST';
  constructor(type: CardType = CardType.FIRE) {
    super(); this.provides = [type]; this.name = 'Basic ' + type; this.fullName = this.name + ' TEST'; this.set = 'TEST';
  }
}
let cards: Card[];
function id<T extends Card>(card: T): T { card.id = cards.length; cards.push(card); return card; }
function board(card: PokemonCard = new Target(), side = 0) {
  cards = [];
  const state = new State(); state.phase = GamePhase.PLAYER_TURN; state.turn = 5; state.activePlayer = side;
  state.players = [new Player(), new Player()];
  state.players.forEach((p, index) => {
    p.id = index === 0 ? 17 : 29; p.active.cards = [id(new Target())];
    p.bench = Array.from({ length: 5 }, () => new PokemonCardList());
    p.bench.slice(0, 3).forEach(b => b.cards = [id(new Target())]);
    p.deck.cards = Array.from({ length: 8 }, () => id(new Target()));
    p.prizes = Array.from({ length: 6 }, () => { const list = new CardList(); list.cards = [id(new Target())]; return list; });
  });
  const player = state.players[side], opponent = state.players[1 - side];
  player.active.cards = [id(card)];
  const store = new Store({ onStateChange() {} }, false); store.state = state;
  return { store, state, player, opponent, card };
}
type Board = ReturnType<typeof board>;
const own = (slot = SlotType.ACTIVE, index = 0): CardTarget => ({ player: PlayerType.BOTTOM_PLAYER, slot, index });
const other = (slot = SlotType.ACTIVE, index = 0): CardTarget => ({ player: PlayerType.TOP_PLAYER, slot, index });
function pending(g: Board): Prompt<any> {
  const prompt = g.state.prompts.find(p => p.result === undefined);
  if (!prompt) throw new Error('No pending prompt');
  return prompt;
}
function answer(g: Board, raw: any): void {
  const prompt = pending(g);
  const decoded = prompt.decode(JSON.parse(JSON.stringify(raw)), g.state);
  expect(prompt.validate(decoded, g.state)).toBe(true);
  g.store.dispatch(new ResolvePromptAction(prompt.id, decoded), prompt.playerId);
}
function finish(g: Board): void {
  for (let i = 0; g.store.hasPrompts() && i < 20; i++) {
    const prompt = pending(g);
    if (prompt instanceof WaitPrompt) answer(g, true);
    else if (prompt instanceof ShuffleDeckPrompt) {
      answer(g, g.state.players.find(p => p.id === prompt.playerId)!.deck.cards.map((_, index) => index));
    } else throw new Error('Unexpected prompt ' + prompt.type);
  }
  expect(g.store.hasPrompts()).toBe(false);
}
function attack(g: Board, index = 0): void {
  g.store.dispatch(new AttackAction(g.player.id, g.card.attacks[index].name));
}
function play(g: Board, card: Card): void {
  g.store.dispatch(new PlayCardAction(g.player.id, g.player.hand.cards.indexOf(card), own()));
}
function wire(g: Board): State {
  g.state.cardNames = cards.map(card => card.fullName);
  const known = StateSerializer.knownCards;
  StateSerializer.setKnownCards(cards);
  try { const serializer = new StateSerializer(); return serializer.deserialize(serializer.serialize(g.state)); }
  finally { StateSerializer.setKnownCards(known); }
}
function fireCost(g: Board): void { g.player.active.cards.push(...[1, 2, 3].map(() => id(new Basic()))); }

// The raw answer is exactly the index-based socket protocol; decoded actions
// are also attacked independently, since bots can bypass the socket decoder.
describe('Happy6 energy and card selection contracts', () => {
  for (const side of [0, 1]) it('Energy Switch wire roundtrip enforces own single basic transfer, side ' + side, () => {
    const g = board(new Target(), side), item = id(new EnergySwitch());
    const energy = id(new Basic()), second = id(new Basic()), enemy = id(new Basic());
    const special = id(new LuminousEnergy());
    g.player.hand.cards = [item]; g.player.active.cards.push(energy, second, special); g.opponent.active.cards.push(enemy);
    play(g, item);
    const prompt = pending(g) as MoveEnergyPrompt;
    expect(prompt instanceof MoveEnergyPrompt).toBe(true);
    const client = wire(g), cp = client.prompts.find(p => p.id === prompt.id) as MoveEnergyPrompt;
    expect(cp instanceof MoveEnergyPrompt).toBe(true);
    const good = [{ from: own(), to: own(SlotType.BENCH), index: 1 }];
    expect(cp.validate(cp.decode(good, client), client)).toBe(true);
    const bad = [
      [{ from: other(), to: own(SlotType.BENCH), index: 1 }],
      [{ from: own(), to: other(), index: 1 }],
      [{ from: own(), to: own(), index: 1 }],
      [{ from: own(), to: own(SlotType.BENCH), index: 3 }],
      [...good, { from: own(), to: own(SlotType.BENCH, 1), index: 2 }],
      [...good, ...good], [],
      [{ from: own(), to: own(SlotType.BENCH, 4), index: 1 }],
      [{ from: own(), to: own(SlotType.ACTIVE, 1), index: 1 }],
    ];
    bad.forEach(raw => expect(() => prompt.decode(raw, g.state)).toThrow());
    expect(g.player.active.cards).toContain(energy); expect(g.opponent.active.cards).toContain(enemy);
    answer(g, good); finish(g);
    expect(g.player.bench[0].cards).toContain(energy); expect(g.player.active.cards).toContain(second);
    expect(g.opponent.active.cards).toContain(enemy);
  });

  it('Energy Switch direct action rejects a mixed legal/illegal batch before moving any card', () => {
    const g = board(), item = id(new EnergySwitch()), a = id(new Basic()), b = id(new Basic());
    g.player.hand.cards = [item]; g.player.active.cards.push(a); g.opponent.active.cards.push(b); play(g, item);
    const prompt = pending(g);
    expect(() => g.store.dispatch(new ResolvePromptAction(prompt.id,
      [{ from: own(), to: own(SlotType.BENCH), card: a }, { from: other(), to: own(SlotType.BENCH), card: b }]), g.player.id)).toThrow();
    expect(g.player.active.cards).toContain(a); expect(g.opponent.active.cards).toContain(b);
    expect(g.player.bench[0].cards).not.toContain(a);
  });

  it('shared movement respects explicit opponent/multiple/special permissions and all block maps', () => {
    const g = board(), a = id(new LuminousEnergy()), b = id(new LuminousEnergy());
    g.opponent.active.cards.push(a, b);
    const prompt = new MoveEnergyPrompt(g.player.id, GameMessage.MOVE_ENERGY_CARDS, PlayerType.ANY,
      [SlotType.ACTIVE, SlotType.BENCH], { energyType: EnergyType.SPECIAL }, { min: 2, max: 2, allowCancel: false });
    const raw = [1, 2].map(index => ({ from: other(), to: own(SlotType.BENCH), index }));
    expect(prompt.validate(prompt.decode(raw, g.state), g.state)).toBe(true);
    prompt.options.blockedMap = [{ source: other(), blocked: [2] }];
    expect(() => prompt.decode(raw, g.state)).toThrow(); prompt.options.blockedMap = [];
    prompt.options.blockedFrom = [other()]; expect(() => prompt.decode(raw, g.state)).toThrow(); prompt.options.blockedFrom = [];
    prompt.options.blockedTo = [own(SlotType.BENCH)]; expect(() => prompt.decode(raw, g.state)).toThrow();
    expect(prompt.validate(null, g.state)).toBe(false);
    prompt.options.allowCancel = true; expect(prompt.validate(null, g.state)).toBe(true);
  });

  it('discard validates wire indices, side/slot/filter/blocked/unique and permits authorized opponent specials', () => {
    const g = board(), a = id(new Basic()), b = id(new LuminousEnergy());
    g.player.active.cards.push(a); g.opponent.bench[0].cards.push(b);
    const p = new DiscardEnergyPrompt(g.player.id, GameMessage.CHOOSE_ENERGIES_TO_DISCARD,
      PlayerType.BOTTOM_PLAYER, [SlotType.ACTIVE], { energyType: EnergyType.BASIC }, { min: 0, max: 1, allowCancel: false });
    const good = [{ from: own(), index: 1 }];
    expect(p.validate(p.decode(good, g.state), g.state)).toBe(true);
    [ [{ from: other(SlotType.BENCH), index: 1 }], [{ from: own(SlotType.BENCH), index: 0 }],
      [{ from: own(), index: 0 }], [{ from: own(), index: -1 }], [{ from: own(), index: 99 }],
      [...good, ...good] ].forEach(raw => expect(() => p.decode(raw, g.state)).toThrow());
    p.options.blockedMap = [{ source: own(), blocked: [1] }]; expect(() => p.decode(good, g.state)).toThrow();
    p.options.blockedMap = []; p.options.blockedFrom = [own()]; expect(() => p.decode(good, g.state)).toThrow();
    expect(p.validate([], g.state)).toBe(true); expect(p.validate(null, g.state)).toBe(false);
    p.options.allowCancel = true; expect(p.validate(null, g.state)).toBe(true);
    const opponent = new DiscardEnergyPrompt(g.player.id, GameMessage.CHOOSE_ENERGIES_TO_DISCARD,
      PlayerType.TOP_PLAYER, [SlotType.BENCH], { energyType: EnergyType.SPECIAL }, { min: 1, max: 1 });
    expect(opponent.validate(opponent.decode([{ from: other(SlotType.BENCH), index: 1 }], g.state), g.state)).toBe(true);
  });

  it('Magcargo pays a normally effective Luminous Fire, counts one card rather than rainbow types', () => {
    const g = board(new EthansMagcargo()), luminous = id(new LuminousEnergy()); fireCost(g);
    g.player.active.cards.push(luminous); attack(g);
    const prompt = pending(g) as DiscardEnergyPrompt;
    expect(prompt instanceof DiscardEnergyPrompt).toBe(true);
    const client = wire(g), cp = client.prompts.find(p => p.id === prompt.id)!;
    expect(cp.validate(cp.decode([{ from: own(), index: 4 }], client), client)).toBe(true);
    answer(g, [{ from: own(), index: 4 }]); finish(g);
    expect(g.player.discard.cards).toContain(luminous); expect(g.opponent.active.damage).toBe(70);
  });

  for (const rewrite of ['temple', 'another-special']) it('Magcargo excludes Luminous after ' + rewrite + ' removes Fire', () => {
    const g = board(new EthansMagcargo()), luminous = id(new LuminousEnergy()); fireCost(g);
    g.player.active.cards.push(luminous);
    if (rewrite === 'temple') g.player.stadium.cards = [id(new TempleOfSinnoh())];
    else g.player.active.cards.push(id(new DoubleTurboEnergy()));
    attack(g); const prompt = pending(g) as DiscardEnergyPrompt;
    expect(() => prompt.decode([{ from: own(), index: 4 }], g.state)).toThrow();
    answer(g, []); finish(g); expect(g.opponent.active.damage).toBe(0); expect(g.player.discard.cards.length).toBe(0);
  });

  it('Magcargo rejects wrong sources at live Store boundary with zero discard and zero damage', () => {
    const g = board(new EthansMagcargo()); fireCost(g);
    const energy = id(new Basic()); g.player.bench[0].cards.push(energy); attack(g);
    expect(() => g.store.dispatch(new ResolvePromptAction(pending(g).id,
      [{ from: own(SlotType.BENCH), card: energy }]), g.player.id)).toThrow();
    expect(g.player.discard.cards.length).toBe(0); expect(g.player.bench[0].cards).toContain(energy);
    expect(g.opponent.active.damage).toBe(0);
  });

  it('Magcargo gains no damage when the validated discard is prevented', () => {
    const g = board(new EthansMagcargo()); fireCost(g);
    g.opponent.active.getPokemonCard()!.reduceEffect = (_store, state, effect) => {
      if (effect instanceof DiscardCardsEffect) effect.preventDefault = true;
      return state;
    };
    attack(g); answer(g, [{ from: own(), index: 1 }]); finish(g);
    expect(g.player.discard.cards.length).toBe(0); expect(g.opponent.active.damage).toBe(0);
    expect(g.player.active.cards.filter(card => card instanceof EnergyCard).length).toBe(3);
  });

  it('Mewtwo discards a benched Team Rocket special as one card, alongside a basic', () => {
    const g = board(new TeamRocketsMewtwoex());
    g.player.active.cards.push(id(new Basic(CardType.PSYCHIC)), id(new Basic(CardType.PSYCHIC)), id(new Basic()));
    const special = id(new TeamRocketsEnergy()), basic = id(new Basic());
    g.player.bench[0].cards.push(special, basic); attack(g);
    answer(g, [{ from: own(SlotType.BENCH), index: 1 }, { from: own(SlotType.BENCH), index: 2 }]); finish(g);
    expect(g.opponent.active.damage).toBe(280); expect(g.player.discard.cards).toContain(special); expect(g.player.discard.cards).toContain(basic);
  });

  it('Mewtwo rejects a partly legal active/bench response before any payment', () => {
    const g = board(new TeamRocketsMewtwoex());
    const active = id(new Basic(CardType.PSYCHIC)), bench = id(new Basic());
    g.player.active.cards.push(active, id(new Basic(CardType.PSYCHIC)), id(new Basic())); g.player.bench[0].cards.push(bench); attack(g);
    expect(() => g.store.dispatch(new ResolvePromptAction(pending(g).id,
      [{ from: own(SlotType.BENCH), card: bench }, { from: own(), card: active }]), g.player.id)).toThrow();
    expect(g.player.discard.cards.length).toBe(0); expect(g.player.bench[0].cards).toContain(bench); expect(g.player.active.cards).toContain(active);
    expect(g.opponent.active.damage).toBe(0);
  });

  it('ChooseCards rejects duplicate indices/entities and out-of-range while retaining names, hidden filters, zero and cancel', () => {
    const g = board(), a = id(new Basic()), b = id(new Basic()); g.player.hand.cards = [a, b];
    const p = new ChooseCardsPrompt(g.player, GameMessage.CHOOSE_CARD_TO_DISCARD, g.player.hand, {}, { min: 2, max: 2 });
    [[0, 0], [-1, 0], [0, 2], [0, 0.5]].forEach(raw => expect(() => p.decode(raw)).toThrow());
    expect(p.validate([a, a])).toBe(false); expect(p.validate([a, undefined as any])).toBe(false);
    expect(p.validate(p.decode([0, 1]))).toBe(true);
    g.player.hand.cards = [a, a]; expect(() => p.decode([0, 1])).toThrow();
    const hidden = new ChooseCardsPrompt(g.player, GameMessage.CHOOSE_CARD_TO_HAND, g.player.deck,
      { superType: SuperType.ENERGY }, { min: 0, max: 1, isSecret: true, allowCancel: false });
    expect(hidden.validate([])).toBe(true); expect(hidden.validate([g.player.deck.cards[0]])).toBe(false);
    expect(hidden.validate(null)).toBe(false); hidden.options.allowCancel = true; expect(hidden.validate(null)).toBe(true);
  });

  it('SLG Ultra Ball cannot pay with one entity twice and never reaches search', () => {
    const g = board(), ball = id(new UltraBall()), a = id(new Basic()), b = id(new Basic());
    g.player.hand.cards = [ball, a, b]; const deck = g.player.deck.cards.slice(); play(g, ball);
    const prompt = pending(g) as ChooseCardsPrompt;
    const client = wire(g), cp = client.prompts.find(p => p.id === prompt.id) as ChooseCardsPrompt;
    expect(() => cp.decode([0, 0])).toThrow(); expect(() => prompt.decode([0, 0])).toThrow();
    expect(() => g.store.dispatch(new ResolvePromptAction(prompt.id, [a, a]), g.player.id)).toThrow();
    expect(g.player.hand.cards).toContain(a); expect(g.player.hand.cards).toContain(b);
    expect(g.player.discard.cards).not.toContain(a); expect(g.player.deck.cards).toEqual(deck);
    expect(g.state.prompts.filter(p => p instanceof ChooseCardsPrompt).length).toBe(0);
  });

  it('SLG Ultra Ball pays two same-named distinct cards, then may fail hidden search', () => {
    const g = board(), ball = id(new UltraBall()), a = id(new Basic()), b = id(new Basic());
    g.player.hand.cards = [ball, a, b]; play(g, ball); answer(g, [0, 1]);
    expect(pending(g) instanceof ChooseCardsPrompt).toBe(true); answer(g, []); finish(g);
    expect(g.player.discard.cards).toContain(a); expect(g.player.discard.cards).toContain(b);
  });

  it('Team Rocket mixed units obey final Temple map and recover after its removal', () => {
    const g = board(), energy = id(new TeamRocketsEnergy()); g.player.active.cards.push(energy);
    const check = () => { const effect = new CheckProvidedEnergyEffect(g.player); g.store.reduceEffect(g.state, effect); return effect.energyMap; };
    const P = CardType.PSYCHIC, D = CardType.DARK, C = CardType.COLORLESS;
    const normal = check();
    [[P, P], [P, D], [D, D], [C, C]].forEach(cost => expect(StateUtils.checkEnoughEnergy(normal, cost)).toBe(true));
    expect(StateUtils.checkEnoughEnergy(normal, [P, D, C])).toBe(false);
    expect(StateUtils.checkEnoughEnergy(normal, [CardType.WATER])).toBe(false);
    g.player.stadium.cards = [id(new TempleOfSinnoh())]; const muted = check();
    expect(muted[0].provides).toEqual([C]); expect(StateUtils.getEnergyUnits(muted[0])).toEqual([[C]]);
    [[P], [D], [P, D], [C, C]].forEach(cost => expect(StateUtils.checkEnoughEnergy(muted, cost)).toBe(false));
    expect(StateUtils.checkEnoughEnergy(muted, [C])).toBe(true);
    g.player.stadium.cards = []; expect(StateUtils.checkEnoughEnergy(check(), [P, D])).toBe(true);
    const rewritten = check(); rewritten[0].provides = [CardType.FIRE, CardType.FIRE];
    expect(StateUtils.checkEnoughEnergy(rewritten, [P])).toBe(false);
    expect(StateUtils.checkEnoughEnergy(rewritten, [CardType.FIRE, CardType.FIRE])).toBe(true);
    // A same-length but different final type map must not revive printed P/D.
    expect(StateUtils.checkEnoughEnergy([{ card: energy, provides: [CardType.WATER, CardType.WATER] }], [P])).toBe(false);
  });

  it('Lapras Power Splash counts final units: Water + Double Turbo is 3x40 minus20 =100', () => {
    const g = board(new Laprasex()); g.player.active.cards.push(id(new Basic(CardType.WATER)), id(new DoubleTurboEnergy()));
    attack(g); finish(g); expect(g.opponent.active.damage).toBe(100);
  });

  it('Lapras Power Splash respects final Temple count and one rainbow is one unit', () => {
    const g = board(new Laprasex()); g.player.active.cards.push(id(new Basic(CardType.WATER)), id(new DoubleTurboEnergy()));
    g.player.stadium.cards = [id(new TempleOfSinnoh())]; attack(g); finish(g); expect(g.opponent.active.damage).toBe(80);
    const rainbow = board(new Laprasex()); rainbow.player.active.cards.push(id(new LuminousEnergy()));
    attack(rainbow); finish(rainbow); expect(rainbow.opponent.active.damage).toBe(40);
  });

  // Direct attack-effect contracts only: the timing unit owns the complete
  // Metronome/AttackAction sequence and its copied-attack damage phase.
  it('Clefable copied Power Splash counts its two basics, not the opposing Lapras energies', () => {
    const g = board(new Clefable()), lapras = id(new Laprasex());
    g.opponent.active.cards = [lapras, id(new Basic(CardType.WATER)), id(new DoubleTurboEnergy())];
    g.player.active.cards.push(id(new Basic()), id(new Basic()));
    const effect = new AttackEffect(g.player, g.opponent, lapras.attacks[0]); effect.source = g.player.active;
    lapras.reduceEffect(g.store, g.state, effect); expect(effect.damage).toBe(80);
  });

  it('copied Power Splash honors an explicit source distinct from the active slot', () => {
    const g = board(new Clefable()), lapras = id(new Laprasex());
    g.player.active.cards.push(id(new Basic()));
    g.player.bench[0].cards.push(id(new Basic()), id(new DoubleTurboEnergy()));
    const effect = new AttackEffect(g.player, g.opponent, lapras.attacks[0]); effect.source = g.player.bench[0];
    lapras.reduceEffect(g.store, g.state, effect); expect(effect.damage).toBe(120);
  });

  it('copied Power Splash counts two Rocket units before Temple and one after its final rewrite', () => {
    const g = board(), lapras = id(new Laprasex());
    g.player.active.cards.push(id(new Basic(CardType.WATER)), id(new TeamRocketsEnergy()));
    const count = () => {
      const effect = new AttackEffect(g.player, g.opponent, lapras.attacks[0]); effect.source = g.player.active;
      lapras.reduceEffect(g.store, g.state, effect); return effect.damage;
    };
    expect(count()).toBe(120);
    g.player.stadium.cards = [id(new TempleOfSinnoh())]; expect(count()).toBe(80);
  });

  it('Larimar Rain attaches basic/Capture from revealed deck without using a hand attachment or Capture search', () => {
    const g = board(new Laprasex());
    g.player.active.cards.push(id(new Basic(CardType.WATER)), id(new Basic(CardType.PSYCHIC)), id(new Basic(CardType.METAL)));
    const basic = id(new Basic()), capture = id(new CaptureEnergy()); g.player.deck.cards = [basic, capture, id(new Target())];
    g.player.energyPlayedTurn = g.state.turn; g.player.bench[0].cannotAttachEnergyFromHandNextTurn = true;
    const played = g.player.energyPlayedTurn; attack(g, 1); const prompt = pending(g) as AttachEnergyPrompt;
    expect(prompt instanceof AttachEnergyPrompt).toBe(true);
    answer(g, [{ to: own(SlotType.BENCH), index: prompt.cardList.cards.indexOf(basic) },
      { to: own(SlotType.BENCH), index: prompt.cardList.cards.indexOf(capture) }]); finish(g);
    expect(g.player.bench[0].cards).toContain(basic); expect(g.player.bench[0].cards).toContain(capture);
    expect(g.player.bench[0].energies.cards).toContain(capture); expect(g.player.energyPlayedTurn).toBe(played);
    expect(g.state.prompts.some(p => p instanceof ChooseCardsPrompt)).toBe(false);
    expect(g.player.deck.cards.length).toBe(1);
  });

  it('Capture still searches when the real source is hand', () => {
    const g = board(), capture = id(new CaptureEnergy()); g.player.hand.cards = [capture];
    g.store.reduceEffect(g.state, new AttachEnergyEffect(g.player, capture, g.player.active));
    expect(g.store.hasPrompts()).toBe(true); expect(pending(g) instanceof ChooseCardsPrompt).toBe(true);
  });

  it('Larimar Rain rejects a later Triple Acceleration on Basic with no earlier attachment/marker committed', () => {
    const g = board(new Laprasex());
    g.player.active.cards.push(id(new Basic(CardType.WATER)), id(new Basic(CardType.PSYCHIC)), id(new Basic(CardType.METAL)));
    const basic = id(new Basic()), triple = id(new TripleAccelerationEnergy()); g.player.deck.cards = [basic, triple]; attack(g, 1);
    const p = pending(g) as AttachEnergyPrompt, before = g.player.bench[0].cards.slice();
    const raw = [{ to: own(SlotType.BENCH), index: p.cardList.cards.indexOf(basic) },
      { to: own(SlotType.BENCH), index: p.cardList.cards.indexOf(triple) }];
    const decoded = p.decode(raw, g.state); expect(p.validate(decoded, g.state)).toBe(true);
    expect(() => g.store.dispatch(new ResolvePromptAction(p.id, decoded), g.player.id)).toThrow();
    expect(g.player.bench[0].cards).toEqual(before); expect(p.cardList.cards).toContain(basic); expect(p.cardList.cards).toContain(triple);
    expect(g.player.marker.hasMarker(triple.TRIPLE_ACCELERATION_MARKER, triple)).toBe(false);
  });

  it('Larimar Rain retains genuine attachment prevention and returns the un-attached card to the deck', () => {
    const g = board(new Laprasex());
    g.player.active.cards.push(id(new Basic(CardType.WATER)), id(new Basic(CardType.PSYCHIC)), id(new Basic(CardType.METAL)));
    const evolution = id(new Target()); evolution.stage = Stage.STAGE_1; g.player.bench[0].cards = [evolution];
    evolution.reduceEffect = (_store, state, effect) => {
      if (effect instanceof AttachEnergyEffect) effect.preventDefault = true;
      return state;
    };
    const triple = id(new TripleAccelerationEnergy()); g.player.deck.cards = [triple]; attack(g, 1);
    const p = pending(g) as AttachEnergyPrompt;
    answer(g, [{ to: own(SlotType.BENCH), index: p.cardList.cards.indexOf(triple) }]); finish(g);
    expect(g.player.deck.cards).toContain(triple); expect(g.player.bench[0].cards).not.toContain(triple);
    expect(g.player.marker.hasMarker(triple.TRIPLE_ACCELERATION_MARKER, triple)).toBe(false);
  });

  it('Larimar Rain legally attaches Triple Acceleration to evolution and discards at that turn end', () => {
    const g = board(new Laprasex());
    g.player.active.cards.push(id(new Basic(CardType.WATER)), id(new Basic(CardType.PSYCHIC)), id(new Basic(CardType.METAL)));
    const evolution = id(new Target()); evolution.stage = Stage.STAGE_1; g.player.bench[0].cards = [evolution];
    const triple = id(new TripleAccelerationEnergy()); g.player.deck.cards = [triple]; attack(g, 1);
    const p = pending(g) as AttachEnergyPrompt;
    answer(g, [{ to: own(SlotType.BENCH), index: p.cardList.cards.indexOf(triple) }]);
    expect(g.player.bench[0].cards).toContain(triple);
    expect(g.player.marker.hasMarker(triple.TRIPLE_ACCELERATION_MARKER, triple)).toBe(true);
    finish(g);
    expect(g.player.discard.cards).toContain(triple); expect(g.player.bench[0].cards).not.toContain(triple);
    expect(g.player.marker.hasMarker(triple.TRIPLE_ACCELERATION_MARKER, triple)).toBe(false);
  });
});
