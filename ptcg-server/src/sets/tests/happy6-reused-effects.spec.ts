import { Store } from '../../game/store/store';
import { State, GamePhase } from '../../game/store/state/state';
import { Player } from '../../game/store/state/player';
import { CardList } from '../../game/store/state/card-list';
import { PokemonCardList } from '../../game/store/state/pokemon-card-list';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { EnergyCard } from '../../game/store/card/energy-card';
import { TrainerCard } from '../../game/store/card/trainer-card';
import { CardType, CardTag, EnergyType, Stage, SpecialCondition } from '../../game/store/card/card-types';
import { AttackAction } from '../../game/store/actions/game-actions';
import { PlayCardAction, CardTarget, PlayerType, SlotType } from '../../game/store/actions/play-card-action';
import { ResolvePromptAction } from '../../game/store/actions/resolve-prompt-action';
import { Prompt } from '../../game/store/prompts/prompt';
import { WaitPrompt } from '../../game/store/prompts/wait-prompt';
import { ChooseCardsPrompt } from '../../game/store/prompts/choose-cards-prompt';
import { ChoosePokemonPrompt } from '../../game/store/prompts/choose-pokemon-prompt';
import { AttachEnergyPrompt } from '../../game/store/prompts/attach-energy-prompt';
import { ShuffleDeckPrompt } from '../../game/store/prompts/shuffle-prompt';
import { ShowCardsPrompt } from '../../game/store/prompts/show-cards-prompt';
import { CheckTableStateEffect, CheckPokemonAttacksEffect } from '../../game/store/effects/check-effects';
import { AttackEffect, PowerEffect } from '../../game/store/effects/game-effects';
import { EndTurnEffect } from '../../game/store/effects/game-phase-effects';
import { DealDamageEffect, PutDamageEffect, PutCountersEffect } from '../../game/store/effects/attack-effects';
import { Effect } from '../../game/store/effects/effect';
import { GameError } from '../../game/game-error';
import { GameMessage } from '../../game/game-message';
import { StoreLike } from '../../game/store/store-like';
import { TechnicalMachineEvolution } from '../10-scarlet-and-violet/set-paradox-rift/technical-machine-evolution';
import { Pikachuex } from '../10-scarlet-and-violet/set-surging-sparks/pikachu-ex';
import { RedeemableTicket } from '../10-scarlet-and-violet/set-journey-together/exchange-ticket';
import { DeliveryBox } from '../10-scarlet-and-violet/set-temporal-forces/delivery-box';
import { Furfrou } from '../10-scarlet-and-violet/set-shrouded-fable/furfrou-sfa';
import { LisiasAppeal } from '../10-scarlet-and-violet/set-surging-sparks/lisias-appeal';
import { Eeveeex } from '../10-scarlet-and-violet/set-prismatic-evolution/eevee-ex';
import { BlackBeltsTraining } from '../10-scarlet-and-violet/set-prismatic-evolution/black-belts-training';
import { Regirock } from '../10-scarlet-and-violet/set-journey-together/regirock';
import { Iono } from '../10-scarlet-and-violet/set-paldea-evolved/iono';
import { DeliveryDrone } from '../10-scarlet-and-violet/set-paldea-evolved/delivery-drone';
import { NightlyStretcher } from '../10-scarlet-and-violet/set-shrouded-fable/nightly-stretcher';
import { Decidueye } from '../08-sun-and-moon/set-cosmic-eclipse/decidueye';
import { BlackKyuremex } from '../10-scarlet-and-violet/set-surging-sparks/black-kyurem-ex';
import { PowerHourglass } from '../10-scarlet-and-violet/set-shrouded-fable/power-hourglass';
import { DoubleTurboEnergy } from '../09-sword-and-shield/set-brilliant-stars/double-turbo-energy';

class Target extends PokemonCard {
  public name = 'Test Basic'; public fullName = 'Test Basic TEST'; public set = 'TEST';
  public hp = 500; public cardType = [CardType.COLORLESS];
  public attacks = [{ name: 'Hit', cost: [], damage: 40, text: '' }];
}
class ExTarget extends Target { protected _tags = [CardTag.POKEMON_ex]; }
class TestEnergy extends EnergyCard {
  public name = 'Test Energy'; public fullName = 'Test Energy TEST'; public set = 'TEST';
  constructor(type = CardType.COLORLESS, special = false) { super(); this.provides = [type]; this.energyType = special ? EnergyType.SPECIAL : EnergyType.BASIC; }
}
class AbilityLock extends Target {
  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PowerEffect) throw new GameError(GameMessage.BLOCKED_BY_ABILITY);
    return state;
  }
}
const own: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
const bench: CardTarget = { ...own, slot: SlotType.BENCH };
const enemy: CardTarget = { ...own, player: PlayerType.TOP_PLAYER };
const enemyBench: CardTarget = { ...enemy, slot: SlotType.BENCH };
function board(card: PokemonCard = new Target()) {
  const state = new State(); state.phase = GamePhase.PLAYER_TURN; state.turn = 5;
  state.players = [new Player(), new Player()]; state.players[0].id = 17; state.players[1].id = 29;
  for (const p of state.players) {
    p.active.cards = [new Target()]; p.bench = Array.from({ length: 5 }, () => new PokemonCardList());
    p.bench[0].cards = [new Target()];
    p.prizes = Array.from({ length: 6 }, () => { const pile = new CardList(); pile.cards = [new Target()]; return pile; });
    p.deck.cards = Array.from({ length: 20 }, () => new Target());
  }
  const [player, opponent] = state.players; player.active.cards = [card];
  const store = new Store({ onStateChange() {} }, false); store.state = state;
  let nextId = 1;
  const identify = () => {
    for (const p of state.players) {
      const piles = [p.active, ...p.bench, p.hand, p.deck, p.discard, p.supporter, ...p.prizes];
      for (const pile of piles) for (const c of pile.cards) if (c.id <= 0) c.id = nextId++;
    }
  };
  const play = (c: TrainerCard | PokemonCard, target = own) => {
    if (!player.hand.cards.includes(c)) player.hand.cards.push(c);
    identify();
    store.dispatch(new PlayCardAction(17, player.hand.cards.indexOf(c), target), 17);
  };
  const attack = (name = card.attacks[0].name) => { identify(); return store.dispatch(new AttackAction(17, name), 17); };
  return { state, store, player, opponent, play, attack };
}
function first<T extends Prompt<any>>(store: Store, ctor: new (...args: any[]) => T): T {
  const p = store.state.prompts.find(p => p instanceof ctor && p.result === undefined) as T;
  expect(p).toBeDefined(); if (!p) throw new Error('Missing prompt: ' + ctor.name); return p;
}
function answer(store: Store, prompt: Prompt<any>, raw: any) {
  const result = prompt.decode(raw, store.state);
  expect(prompt.validate(result, store.state)).toBe(true);
  if (!prompt.validate(result, store.state)) throw new Error('Invalid test response: ' + prompt.type);
  store.dispatch(new ResolvePromptAction(prompt.id, result), prompt.playerId);
}
function idle(store: Store) {
  for (let i = 0; i < 40; i++) {
    const p = store.state.prompts.find(p => p.result === undefined);
    if (!p) return;
    if (p instanceof WaitPrompt || p instanceof ShowCardsPrompt) answer(store, p, null);
    else if (p instanceof ShuffleDeckPrompt) {
      const owner = store.state.players.find(v => v.id === p.playerId)!;
      answer(store, p, owner.deck.cards.map((_, n) => n));
    } else return;
  }
  throw new Error('Prompt loop');
}
function choose(store: Store, card: PokemonCard | TrainerCard | EnergyCard) {
  const p = first(store, ChooseCardsPrompt); answer(store, p, [p.cards.cards.indexOf(card)]);
}
function fuel(list: PokemonCardList, type = CardType.COLORLESS, count = 1) {
  for (let i = 0; i < count; i++) list.cards.push(new TestEnergy(type));
}

describe('Happy6 reused card real action regressions', () => {
  it('TM normal attachment supplies Evolution, permits zero targets with empty deck, and discards at turn end', () => {
    const g = board(); const tm = new TechnicalMachineEvolution(); fuel(g.player.active); g.player.deck.cards = [];
    g.play(tm); expect(g.player.active.tools).toContain(tm);
    g.attack('Evolution'); const p = first(g.store, ChoosePokemonPrompt);
    expect(p.options.min).toBe(0); answer(g.store, p, []); idle(g.store);
    expect(g.player.discard.cards).toContain(tm); expect(g.state.activePlayer).toBe(1);
  });
  it('TM allows failed hidden search but only a real evolution of a chosen bench Pokemon', () => {
    const g = board(); const tm = new TechnicalMachineEvolution(); fuel(g.player.active); g.play(tm);
    const good = new Target(); good.stage = Stage.STAGE_1; good.evolvesFrom = 'Test Basic'; good.name = 'Test Evolution';
    const bad = new Target(); bad.evolvesFrom = 'Test Basic';
    g.player.deck.cards = [good, bad]; g.attack('Evolution');
    answer(g.store, first(g.store, ChoosePokemonPrompt), [bench]);
    const p = first(g.store, ChooseCardsPrompt);
    expect(p.validate(p.decode([p.cards.cards.indexOf(bad)]))).toBe(false);
    choose(g.store, good); idle(g.store); expect(g.player.bench[0].getPokemonCard()).toBe(good);
  });
  it('TM can find no evolution and a blocked tool neither supplies attacks nor discards itself', () => {
    const g = board(); const tm = new TechnicalMachineEvolution(); fuel(g.player.active); g.play(tm);
    g.attack('Evolution'); answer(g.store, first(g.store, ChoosePokemonPrompt), [bench]);
    answer(g.store, first(g.store, ChooseCardsPrompt), []); idle(g.store);
    const h = board(); h.play(tm); h.player.stadiumAndToolHaveNoEffectTurnsRemaining = 1;
    const check = new CheckPokemonAttacksEffect(h.player); h.store.reduceEffect(h.state, check);
    expect(check.attacks).not.toContain(tm.attacks[0]); h.store.reduceEffect(h.state, new EndTurnEffect(h.player));
    expect(h.player.active.tools).toContain(tm);
  });
  it('TM works as a second tool and evolves two chosen benched Pokemon', () => {
    const g = board(); g.player.active.getPokemonCard()!.maxTools = 2; fuel(g.player.active);
    g.play(new PowerHourglass()); g.play(new TechnicalMachineEvolution());
    g.player.bench[1].cards = [new Target()];
    const evos = [new Target(), new Target()];
    evos.forEach((c, i) => { c.name = 'Evolution ' + i; c.stage = Stage.STAGE_1; c.evolvesFrom = 'Test Basic'; });
    g.player.deck.cards = evos.slice(); g.attack('Evolution');
    answer(g.store, first(g.store, ChoosePokemonPrompt), [bench, { ...bench, index: 1 }]);
    choose(g.store, evos[0]); choose(g.store, evos[1]); idle(g.store);
    expect(g.player.bench.map(b => b.getPokemonCard()).slice(0, 2)).toEqual(evos);
  });
  for (const invalid of ['active', 'opponent', 'duplicate']) it(`TM refuses forged ${invalid} evolution targets`, () => {
    const g = board(); fuel(g.player.active); g.play(new TechnicalMachineEvolution()); g.attack('Evolution');
    const p = first(g.store, ChoosePokemonPrompt);
    const raw = invalid === 'active' ? [own] : invalid === 'opponent' ? [enemyBench] : [bench, bench];
    // ChoosePokemonPrompt does not enforce its slot/player fields by itself;
    // exercise the card callback's guard through the real resolution action.
    const decoded = p.decode(raw, g.state);
    expect(() => g.store.dispatch(new ResolvePromptAction(p.id, decoded), 17)).toThrow(new GameError(GameMessage.INVALID_TARGET));
  });
  it('Pikachu survives exact lethal at 10 HP through AttackAction', () => {
    const hitter = new Target(); hitter.attacks[0].damage = 200; const g = board(hitter);
    g.opponent.active.cards = [new Pikachuex()]; g.attack(); idle(g.store);
    expect(g.opponent.active.damage).toBe(190); expect(g.opponent.active.getPokemonCard() instanceof Pikachuex).toBe(true);
  });
  for (const mode of ['overkill', 'damaged', 'blocked', 'counters']) it(`Pikachu survival control: ${mode}`, () => {
    const g = board(); const pikachu = new Pikachuex(); g.opponent.active.cards = [pikachu]; g.state.phase = GamePhase.ATTACK;
    if (mode === 'damaged') g.opponent.active.damage = 10;
    if (mode === 'blocked') g.player.bench[0].cards = [new AbilityLock()];
    const a = new AttackEffect(g.player, g.opponent, g.player.active.getPokemonCard()!.attacks[0]);
    const d = mode === 'counters' ? new PutCountersEffect(a, 200) : new PutDamageEffect(a, mode === 'overkill' ? 210 : 200);
    d.target = g.opponent.active; g.store.reduceEffect(g.state, d);
    expect(g.opponent.active.damage).toBe(mode === 'overkill' ? 190 : mode === 'damaged' ? 210 : 200);
  });
  it('Ticket takes A from [A,B,C], bottoming old prize P', () => {
    const g = board(); const [a, b, c, p] = [new Target(), new Target(), new Target(), new Target()];
    g.player.deck.cards = [a, b, c]; g.player.prizes.forEach(v => v.cards = []); g.player.prizes[0].cards = [p];
    g.play(new RedeemableTicket()); expect(g.player.prizes[0].cards).toEqual([a]); expect(g.player.deck.cards).toEqual([b, c, p]);
  });
  it('Ticket shuffles old prizes before bottoming, including an insufficient original deck', () => {
    spyOn(Math, 'random').and.returnValue(0);
    const g = board(); const a = new Target(); const p = new Target(); const q = new Target(); const r = new Target();
    g.player.deck.cards = [a]; g.player.prizes.forEach(v => v.cards = []);
    g.player.prizes[0].cards = [p]; g.player.prizes[1].cards = [q]; g.player.prizes[2].cards = [r];
    g.play(new RedeemableTicket()); expect(g.player.prizes.slice(0, 3).map(v => v.cards[0])).toEqual([a, q, r]);
    expect(g.player.deck.cards).toEqual([p]); expect(g.player.prizes.every(v => v.isSecret)).toBe(true);
  });
  for (const n of [0, 1, 2]) it(`Box resolves choose ${n}, reveal, shuffle, then ends turn`, () => {
    const g = board(); const items = [new DeliveryDrone(), new NightlyStretcher()]; g.player.deck.cards = items.slice();
    g.play(new DeliveryBox()); expect(g.state.activePlayer).toBe(0);
    const p = first(g.store, ChooseCardsPrompt); expect(p.options.min).toBe(0);
    answer(g.store, p, items.slice(0, n).map(c => p.cards.cards.indexOf(c)));
    expect(g.state.activePlayer).toBe(0);
    if (n > 0) { answer(g.store, first(g.store, ShowCardsPrompt), null); expect(g.state.activePlayer).toBe(0); }
    first(g.store, ShuffleDeckPrompt); idle(g.store); expect(g.state.activePlayer).toBe(1);
    items.slice(0, n).forEach(c => expect(g.player.hand.cards).toContain(c));
  });
  it('Box has no deadlock with no Item available', () => {
    const g = board(); g.play(new DeliveryBox()); answer(g.store, first(g.store, ChooseCardsPrompt), []); idle(g.store);
    expect(g.state.activePlayer).toBe(1);
  });
  it('Box does not trigger Powerglass until its search/reveal/shuffle have finished', () => {
    const g = board(); const energy = new TestEnergy(); const item = new DeliveryDrone();
    g.player.discard.cards = [energy]; g.player.deck.cards = [item]; g.play(new PowerHourglass());
    g.play(new DeliveryBox());
    expect(g.state.prompts.some(p => p instanceof AttachEnergyPrompt && p.result === undefined)).toBe(false);
    choose(g.store, item);
    expect(g.state.prompts.some(p => p instanceof AttachEnergyPrompt && p.result === undefined)).toBe(false);
    answer(g.store, first(g.store, ShowCardsPrompt), null);
    expect(g.state.prompts.some(p => p instanceof AttachEnergyPrompt && p.result === undefined)).toBe(false);
    answer(g.store, first(g.store, ShuffleDeckPrompt), []);
    answer(g.store, first(g.store, AttachEnergyPrompt), [{ to: own, index: g.player.discard.cards.indexOf(energy) }]); idle(g.store);
    expect(g.player.active.cards).toContain(energy); expect(g.state.activePlayer).toBe(1);
  });
  it('Furfrou attaches basic only to bench and retains 30 damage', () => {
    const g = board(new Furfrou()); fuel(g.player.active); const basic = new TestEnergy(); const special = new TestEnergy(CardType.COLORLESS, true);
    g.player.discard.cards = [basic, special]; g.attack(); const p = first(g.store, AttachEnergyPrompt);
    expect(p.slots).toEqual([SlotType.BENCH]); expect(p.filter.energyType).toBe(EnergyType.BASIC);
    expect(p.validate(p.decode([{ to: bench, index: g.player.discard.cards.indexOf(special) }], g.state), g.state)).toBe(false);
    answer(g.store, p, [{ to: bench, index: g.player.discard.cards.indexOf(basic) }]); idle(g.store);
    expect(g.player.bench[0].cards).toContain(basic); expect(g.opponent.active.damage).toBe(30);
  });
  for (const empty of ['energy', 'bench']) it(`Furfrou skips missing legal ${empty}`, () => {
    const g = board(new Furfrou()); fuel(g.player.active); g.player.discard.cards = [new TestEnergy(CardType.FIRE, empty === 'energy')];
    if (empty === 'bench') g.player.bench.forEach(b => b.cards = []);
    g.attack(); idle(g.store); expect(g.opponent.active.damage).toBe(30);
    expect(g.state.prompts.some(p => p.result === undefined)).toBe(false);
  });
  it('Lisia cannot be played with only evolved bench Pokemon', () => {
    const g = board(); g.opponent.bench[0].getPokemonCard()!.stage = Stage.STAGE_1; const c = new LisiasAppeal();
    expect(c.canPlay(g.store, g.state, g.player)).toBe(false); expect(() => g.play(c)).toThrow();
  });
  it('Lisia pulls a Basic and confuses the new Active', () => {
    const g = board(); const target = g.opponent.bench[0].getPokemonCard(); g.play(new LisiasAppeal());
    answer(g.store, first(g.store, ChoosePokemonPrompt), [enemyBench]); idle(g.store);
    expect(g.opponent.active.getPokemonCard()).toBe(target); expect(g.opponent.active.specialConditions).toContain(SpecialCondition.CONFUSED);
  });
  for (const mode of ['ex', 'ordinary', 'first-turn', 'just-played', 'blocked']) it(`Eevee Rainbow DNA: ${mode}`, () => {
    const eevee = new Eeveeex(); const g = board(eevee); const evo = mode === 'ordinary' ? new Target() : new ExTarget();
    evo.name = 'Sylveon' + (mode === 'ordinary' ? '' : ' ex'); evo.stage = Stage.STAGE_1; evo.evolvesFrom = 'Eevee';
    if (mode === 'first-turn') g.state.turn = 1;
    if (mode === 'just-played') g.player.active.pokemonPlayedTurn = g.state.turn;
    if (mode === 'blocked') g.opponent.active.cards = [new AbilityLock()];
    g.store.reduceEffect(g.state, new CheckTableStateEffect([5, 5]));
    if (mode === 'ex') { g.play(evo); expect(g.player.active.getPokemonCard()).toBe(evo); }
    else { expect(() => g.play(evo)).toThrow(); expect(g.player.active.getPokemonCard()).toBe(eevee); }
  });
  it('Black Belt does not add 40 to Black Kyurem self damage', () => {
    const g = board(new BlackKyuremex()); fuel(g.player.active, CardType.WATER, 4); g.opponent.active.cards = [new ExTarget()];
    g.play(new BlackBeltsTraining()); g.attack('Black Frost'); idle(g.store);
    expect(g.player.active.damage).toBe(30); expect(g.opponent.active.damage).toBe(290);
  });
  it('Black Belt preserves self weakness and Double Turbo only reduces opponent damage', () => {
    const kyurem = new BlackKyuremex(); kyurem.weakness = [{ type: CardType.WATER }];
    const g = board(kyurem); fuel(g.player.active, CardType.WATER, 2); g.player.active.cards.push(new DoubleTurboEnergy());
    g.opponent.active.cards = [new ExTarget()]; g.play(new BlackBeltsTraining()); g.attack('Black Frost'); idle(g.store);
    expect(g.player.active.damage).toBe(60); expect(g.opponent.active.damage).toBe(270);
  });
  for (const mode of ['enemy-ex', 'enemy-ordinary', 'enemy-bench', 'own-active', 'own-bench', 'expired']) it(`Black Belt damage target: ${mode}`, () => {
    const g = board(); const c = new BlackBeltsTraining(); g.play(c); g.state.phase = GamePhase.ATTACK;
    g.opponent.active.cards = [mode === 'enemy-ordinary' ? new Target() : new ExTarget()];
    g.opponent.bench[0].cards = [new ExTarget()]; g.player.active.cards = [new ExTarget()]; g.player.bench[0].cards = [new ExTarget()];
    if (mode === 'expired') g.store.reduceEffect(g.state, new EndTurnEffect(g.player));
    const a = new AttackEffect(g.player, g.opponent, g.player.active.getPokemonCard()!.attacks[0]); const d = new DealDamageEffect(a, 30);
    d.target = mode === 'enemy-bench' ? g.opponent.bench[0] : mode === 'own-active' ? g.player.active : mode === 'own-bench' ? g.player.bench[0] : g.opponent.active;
    g.store.reduceEffect(g.state, d); expect(d.target.damage).toBe(mode === 'enemy-ex' ? 70 : 30);
  });
  for (const mode of ['active', 'bench', 'no-energy', 'blocked', 'standard']) it(`Regirock after-weakness reduction: ${mode}`, () => {
    const g = board(mode === 'standard' ? new Target() : new Decidueye()); const rock = new Regirock();
    const target = mode === 'bench' ? g.opponent.bench[0] : g.opponent.active; target.cards = [rock];
    if (mode !== 'no-energy') fuel(target); if (mode === 'blocked') g.player.bench[0].cards = [new AbilityLock()];
    if (mode === 'standard') g.player.active.getPokemonCard()!.cardType = [CardType.GRASS]; else fuel(g.player.active, CardType.GRASS);
    g.attack(); if (mode !== 'standard') answer(g.store, first(g.store, ChoosePokemonPrompt), [mode === 'bench' ? enemyBench : enemy]);
    idle(g.store); expect(target.damage).toBe(mode === 'bench' ? 10 : mode === 'no-energy' || mode === 'blocked' ? 80 : 50);
  });
  it('Iono with own empty deck/otherwise empty hand still disrupts opponent', () => {
    const g = board(); const c = new Iono(); const old = new Target(); g.player.hand.cards = [c]; g.player.deck.cards = []; g.opponent.hand.cards = [old];
    expect(c.canPlay(g.store, g.state, g.player)).toBe(true); g.play(c); idle(g.store);
    expect(g.opponent.hand.cards).not.toContain(old); expect(g.opponent.hand.cards.length).toBe(6); expect(g.player.hand.cards.length).toBe(0);
  });
  it('Iono cannot draw when neither player has other hand cards', () => {
    const g = board(); const c = new Iono(); g.player.hand.cards = [c];
    expect(c.canPlay(g.store, g.state, g.player)).toBe(false); expect(() => g.play(c)).toThrow(); expect(g.player.deck.cards.length).toBe(20);
  });
  for (const heads of [true, false]) it(`Drone ${heads ? 'two heads requires one arbitrary card' : 'tails does not search'} and shuffles`, () => {
    spyOn(Math, 'random').and.returnValue(heads ? 0.25 : 0.75); const g = board(); const wanted = g.player.deck.cards[0];
    g.play(new DeliveryDrone()); answer(g.store, first(g.store, WaitPrompt), null); answer(g.store, first(g.store, WaitPrompt), null);
    if (heads) { const p = first(g.store, ChooseCardsPrompt); expect(p.validate([])).toBe(false); choose(g.store, wanted as PokemonCard); }
    first(g.store, ShuffleDeckPrompt); idle(g.store); expect(g.player.hand.cards.includes(wanted)).toBe(heads);
  });
  it('Stretcher requires one public legal card and excludes Special Energy', () => {
    const g = board(); const basic = new TestEnergy(); const special = new TestEnergy(CardType.COLORLESS, true); g.player.discard.cards = [basic, special];
    g.play(new NightlyStretcher()); const p = first(g.store, ChooseCardsPrompt); expect(p.validate([])).toBe(false);
    expect(p.validate(p.decode([p.cards.cards.indexOf(special)]))).toBe(false);
    choose(g.store, basic); idle(g.store); expect(g.player.hand.cards).toContain(basic); expect(g.player.discard.cards).toContain(special);
  });
  it('Stretcher can choose a Pokemon from the public discard', () => {
    const g = board(); const pokemon = new Target(); g.player.discard.cards = [pokemon];
    g.play(new NightlyStretcher()); choose(g.store, pokemon); idle(g.store); expect(g.player.hand.cards).toContain(pokemon);
  });
  it('Stretcher cannot play without Pokemon or Basic Energy', () => {
    const g = board(); g.player.discard.cards = [new TestEnergy(CardType.COLORLESS, true)]; const c = new NightlyStretcher();
    expect(c.canPlay(g.store, g.state, g.player)).toBe(false); expect(() => g.play(c)).toThrow();
  });
});
