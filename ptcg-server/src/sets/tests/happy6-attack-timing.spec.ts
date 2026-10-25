import { Store } from '../../game/store/store';
import { StoreLike } from '../../game/store/store-like';
import { State, GamePhase } from '../../game/store/state/state';
import { Player } from '../../game/store/state/player';
import { Card } from '../../game/store/card/card';
import { CardList } from '../../game/store/state/card-list';
import { PokemonCardList } from '../../game/store/state/pokemon-card-list';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { EnergyCard } from '../../game/store/card/energy-card';
import { CardType, EnergyType } from '../../game/store/card/card-types';
import { AttackAction } from '../../game/store/actions/game-actions';
import { ResolvePromptAction } from '../../game/store/actions/resolve-prompt-action';
import { PlayerType, SlotType } from '../../game/store/actions/play-card-action';
import { Prompt } from '../../game/store/prompts/prompt';
import { WaitPrompt } from '../../game/store/prompts/wait-prompt';
import { ChooseAttackPrompt } from '../../game/store/prompts/choose-attack-prompt';
import { ChooseCardsPrompt } from '../../game/store/prompts/choose-cards-prompt';
import { ChoosePokemonPrompt } from '../../game/store/prompts/choose-pokemon-prompt';
import { ChoosePrizePrompt } from '../../game/store/prompts/choose-prize-prompt';
import { MoveEnergyPrompt } from '../../game/store/prompts/move-energy-prompt';
import { Effect } from '../../game/store/effects/effect';
import { AttackEffect, KnockOutEffect } from '../../game/store/effects/game-effects';
import { AfterDamageEffect, DealDamageEffect, PutDamageEffect } from '../../game/store/effects/attack-effects';
import { AfterAttackEffect, BeforeDoingDamageEffect } from '../../game/store/effects/game-phase-effects';
import { COPY_BENCH_ATTACK, COPY_OPPONENT_ACTIVE_ATTACK } from '../../game/store/prefabs/attack-effects';
import { BreloomHappy6 } from '../10-scarlet-and-violet/set-happy-trainers/elements/breloom';
import { VirizionHappy6 } from '../10-scarlet-and-violet/set-happy-trainers/elements/virizion';
import { FloatzelHappy6 } from '../10-scarlet-and-violet/set-happy-trainers/elements/floatzel';
import { DarumakaHappy6 } from '../10-scarlet-and-violet/set-happy-trainers/elements/darumaka';
import { DarmanitanHappy6 } from '../10-scarlet-and-violet/set-happy-trainers/elements/darmanitan';
import { ArrokudaHappy6 } from '../10-scarlet-and-violet/set-happy-trainers/elements/arrokuda';
import { Happy6Forretress } from '../10-scarlet-and-violet/set-happy-trainers/utility/cards';
import { Sudowoodo } from '../07-x-and-y/set-breakpoint/sudowoodo';
import { Clefable } from '../10-scarlet-and-violet/set-twilight-masquerade/clefable';
import { PanicMask } from '../09-sword-and-shield/set-lost-origin/panic-mask';
import { ShieldEnergy } from '../07-x-and-y/set-primal-clash/shield-energy';
import { LuckyEnergy } from '../09-sword-and-shield/set-chilling-reign/lucky-energy';
import { DuraludonVMAX } from '../09-sword-and-shield/set-evolving-skies/duraludon-vmax';
import { DoubleTurboEnergy } from '../09-sword-and-shield/set-brilliant-stars/double-turbo-energy';
import { CoatingMetalEnergy } from '../09-sword-and-shield/set-vivid-voltage/coating-metal-energy';

class Target extends PokemonCard {
  public name = 'Timing target'; public fullName = 'Timing target TEST'; public set = 'TEST';
  public hp = 1000; public weakness = []; public resistance = [];
}
class Energy extends EnergyCard {
  public name = 'Timing energy'; public fullName = 'Timing energy TEST'; public set = 'TEST';
  constructor(type = CardType.COLORLESS, special = false) {
    super(); this.provides = [type]; this.energyType = special ? EnergyType.SPECIAL : EnergyType.BASIC;
  }
}
class Copier extends Target {
  public attacks = [{ name: 'Copy', cost: [CardType.COLORLESS], damage: 0, copycatAttack: true, text: '' }];
  constructor(private mode: 'bench' | 'active' = 'bench', private cancel = false) { super(); }
  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      return this.mode === 'bench' ? COPY_BENCH_ATTACK(store, state, effect, { allowCancel: this.cancel })
        : COPY_OPPONENT_ACTIVE_ATTACK(store, state, effect);
    }
    return state;
  }
}
// A phase-aware attack verifies the shared contract without a test-only production path.
class PhaseAttack extends Target {
  public attacks = [{ name: 'Phased hit', cost: [], damage: 10, text: '' }];
  public before = 0; public after = 0; public prepared = 0;
  public reduceEffect(_store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) this.prepared++;
    if (effect instanceof BeforeDoingDamageEffect && effect.attack === this.attacks[0]) {
      this.before++; effect.attackEffect.damage += 20;
    }
    if (effect instanceof AfterAttackEffect && effect.attack === this.attacks[0]) this.after++;
    return state;
  }
}
let nextId = 1000;
function id<T extends Card>(card: T): T { card.id = nextId++; return card; }
function board<T extends PokemonCard>(card: T) {
  const state = new State(); state.phase = GamePhase.PLAYER_TURN; state.turn = 5; state.activePlayer = 0;
  state.players = [new Player(), new Player()];
  for (const [i, player] of state.players.entries()) {
    player.id = i === 0 ? 17 : 29; player.active.cards = [id(new Target())];
    player.bench = Array.from({ length: 5 }, () => new PokemonCardList());
    player.bench[0].cards = [id(new Target())];
    player.deck.cards = Array.from({ length: 10 }, () => id(new Target()));
    player.prizes = Array.from({ length: 6 }, () => {
      const prize = new CardList(); prize.cards = [id(new Target())]; return prize;
    });
  }
  const [player, opponent] = state.players;
  player.active.cards = [id(card)];
  const cost = card.attacks.reduce((a, b) => a.cost.length > b.cost.length ? a : b).cost;
  player.active.cards.push(...cost.map(type => id(new Energy(type))));
  const store = new Store({ onStateChange() {} }, false); store.state = state;
  return { store, state, player, opponent, card };
}
type Board = ReturnType<typeof board>;
function pending(g: Board): Prompt<unknown> {
  const p = g.state.prompts.find(prompt => prompt.result === undefined);
  if (!p) throw new Error('Missing pending prompt');
  return p;
}
function respond(g: Board, raw: unknown): void {
  const prompt = pending(g); const result = prompt.decode(raw, g.state);
  expect(prompt.validate(result, g.state)).toBe(true);
  g.store.dispatch(new ResolvePromptAction(prompt.id, result), prompt.playerId);
}
function finish(g: Board, answer?: (prompt: Prompt<unknown>) => unknown): void {
  for (let count = 0; g.store.hasPrompts() && count < 40; count++) {
    const prompt = pending(g);
    if (prompt instanceof WaitPrompt) respond(g, true);
    else if (prompt instanceof ChoosePrizePrompt) respond(g, Array.from({ length: prompt.options.count }, (_, i) => i));
    else if (answer) respond(g, answer(prompt));
    else throw new Error('Unexpected prompt: ' + prompt.type);
  }
  expect(g.store.hasPrompts()).toBe(false);
}
function attack(g: Board, index = 0, answer?: (prompt: Prompt<unknown>) => unknown): void {
  g.store.dispatch(new AttackAction(g.player.id, g.card.attacks[index].name)); finish(g, answer);
}
function selectEnergy(prompt: Prompt<unknown>, energy: Card): number[] {
  if (!(prompt instanceof ChooseCardsPrompt)) throw new Error('Expected energy prompt: ' + prompt.type);
  return [prompt.cards.cards.indexOf(energy)];
}
const active = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
const bench = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 };
function copyChoice(prompt: Prompt<unknown>, source: PokemonCard, index = 0): unknown {
  if (prompt instanceof ChoosePokemonPrompt) return [bench];
  if (prompt instanceof ChooseAttackPrompt) return { index: 0, attack: source.attacks[index].name };
  throw new Error('Unexpected copy prompt: ' + prompt.type);
}
function mask(g: Board): void {
  const tool = id(new PanicMask()); g.opponent.active.cards.push(tool); g.opponent.active.tools.push(tool);
}
function notEnded(g: Board): void {
  expect(g.state.activePlayer).toBe(0); expect(g.state.phase).toBe(GamePhase.ATTACK);
  expect(g.player.active.getPokemonCard()).toBe(g.card);
}
function ended(g: Board): void {
  expect(g.state.activePlayer).toBe(1); expect(g.state.phase).toBe(GamePhase.PLAYER_TURN);
}

describe('Happy6 attack timing through AttackAction and decoded prompt restoration', () => {
  for (const create of [() => new BreloomHappy6(), () => new VirizionHappy6()]) {
    it(`${create().name}: Panic Mask checks the original 30 HP, then heals exactly 30`, () => {
      const g = board(create()); g.player.active.damage = g.card.hp - 30; mask(g);
      attack(g, g.card instanceof BreloomHappy6 ? 1 : 0);
      expect(g.opponent.active.damage).toBe(0); expect(g.player.active.damage).toBe(g.card.hp - 60); ended(g);
    });
    it(`${create().name}: heals after damage, even when the main damage is zero`, () => {
      const g = board(create()); g.player.active.damage = 60; g.opponent.active.preventDamageNextTurn = {};
      attack(g, g.card instanceof BreloomHappy6 ? 1 : 0);
      expect(g.opponent.active.damage).toBe(0); expect(g.player.active.damage).toBe(30); ended(g);
    });
  }
  it('zero base damage still executes step-5 healing without a damage reaction', () => {
    const g = board(new VirizionHappy6()); g.card.attacks[0].damage = 0; g.player.active.damage = 60;
    let reactions = 0; const reduce = g.store.reduceEffect.bind(g.store);
    spyOn(g.store, 'reduceEffect').and.callFake((state: State, effect: Effect) => {
      if (effect instanceof AfterDamageEffect) reactions++;
      return reduce(state, effect);
    });
    attack(g); expect(g.opponent.active.damage).toBe(0); expect(g.player.active.damage).toBe(30);
    expect(reactions).toBe(0); ended(g);
  });
  it('Floatzel hits a metal target for 20 while Shield Energy remains attached, then discards it', () => {
    const g = board(new FloatzelHappy6()); g.opponent.active.getPokemonCard()!.cardType = [CardType.METAL];
    const shield = id(new ShieldEnergy()); g.opponent.active.cards.push(shield);
    let selections = 0;
    attack(g, 0, prompt => {
      selections++; notEnded(g); expect(g.opponent.active.damage).toBe(20);
      expect(g.opponent.active.cards.includes(shield)).toBe(true);
      return selectEnergy(prompt, shield);
    });
    expect(selections).toBe(1); expect(g.opponent.discard.cards).toEqual([shield]); ended(g);
  });
  it('Floatzel removes Lucky Energy before damage reactions so it draws no card', () => {
    const g = board(new FloatzelHappy6()); const lucky = id(new LuckyEnergy()); g.opponent.active.cards.push(lucky);
    attack(g, 0, prompt => {
      expect(g.opponent.active.damage).toBe(30); expect(g.opponent.hand.cards.length).toBe(0);
      return selectEnergy(prompt, lucky);
    });
    expect(g.opponent.hand.cards.length).toBe(1); // Only the next-turn mandatory draw.
    expect(g.opponent.discard.cards).toEqual([lucky]); ended(g);
  });
  it('an unremoved Lucky Energy draws after the attack effect selection, not before it', () => {
    const g = board(new FloatzelHappy6()); const lucky = id(new LuckyEnergy()), other = id(new Energy());
    g.opponent.active.cards.push(lucky, other);
    attack(g, 0, prompt => {
      expect(g.opponent.hand.cards.length).toBe(0); return selectEnergy(prompt, other);
    });
    expect(g.opponent.hand.cards.length).toBe(2); ended(g);
  });
  it('Lucky Energy does not draw from prevented main damage', () => {
    const g = board(new VirizionHappy6()); g.opponent.active.preventDamageNextTurn = {};
    g.opponent.active.cards.push(id(new LuckyEnergy()));
    attack(g); expect(g.opponent.active.damage).toBe(0);
    expect(g.opponent.hand.cards.length).toBe(1); ended(g);
  });
  it('lethal damage draws Lucky Energy only after attack effects and before KO/prizes', () => {
    const g = board(new FloatzelHappy6()); g.opponent.active.damage = 990;
    const lucky = id(new LuckyEnergy()), other = id(new Energy()); g.opponent.active.cards.push(lucky, other);
    let checkedKo = false; const reduce = g.store.reduceEffect.bind(g.store);
    spyOn(g.store, 'reduceEffect').and.callFake((state: State, effect: Effect) => {
      if (effect instanceof KnockOutEffect && effect.target === g.opponent.active) {
        checkedKo = true; expect(g.opponent.hand.cards.length).toBe(1);
        expect(g.opponent.discard.cards).toEqual([other]); expect(g.player.prizesTaken).toBe(0);
      }
      return reduce(state, effect);
    });
    attack(g, 0, prompt => {
      if (prompt instanceof ChooseCardsPrompt) {
        notEnded(g); expect(g.opponent.active.damage).toBe(1020);
        expect(g.opponent.hand.cards.length).toBe(0); expect(g.player.prizesTaken).toBe(0);
        return selectEnergy(prompt, other);
      }
      if (prompt instanceof ChoosePokemonPrompt) return [bench];
      throw new Error('Unexpected lethal Lucky Energy prompt: ' + prompt.type);
    });
    expect(checkedKo).toBe(true); expect(g.player.prizesTaken).toBe(1); ended(g);
  });
  for (const preventDamage of [false, true]) it(`Floatzel respects effect protection (damage prevented: ${preventDamage})`, () => {
    const g = board(new FloatzelHappy6()); const energy = id(new Energy()); g.opponent.active.cards.push(energy);
    g.opponent.active.preventEffectsOfAttacksNextTurn = {};
    if (preventDamage) g.opponent.active.preventDamageNextTurn = {};
    attack(g, 0, prompt => selectEnergy(prompt, energy));
    expect(g.opponent.active.damage).toBe(preventDamage ? 0 : 30);
    expect(g.opponent.active.cards.includes(energy)).toBe(true); expect(g.opponent.discard.cards.length).toBe(0); ended(g);
  });
  it('prevented main damage still allows an unprotected Floatzel energy discard', () => {
    const g = board(new FloatzelHappy6()); const energy = id(new Energy()); g.opponent.active.cards.push(energy);
    g.opponent.active.preventDamageNextTurn = {};
    attack(g, 0, prompt => selectEnergy(prompt, energy));
    expect(g.opponent.active.damage).toBe(0); expect(g.opponent.discard.cards).toEqual([energy]); ended(g);
  });

  for (const moveOut of [true, false]) it(`Forretress checks special energy before moving it ${moveOut ? 'out' : 'in'} against Duraludon VMAX`, () => {
    const g = board(new Happy6Forretress()); g.opponent.active.cards = [id(new DuraludonVMAX())];
    const special = id(new Energy(CardType.METAL, true)); const from = moveOut ? g.player.active : g.player.bench[0];
    from.cards.push(special); let choices = 0;
    attack(g, 0, prompt => {
      if (!(prompt instanceof MoveEnergyPrompt)) throw new Error('Expected energy move');
      choices++; notEnded(g); expect(g.opponent.active.damage).toBe(moveOut ? 0 : 20);
      expect(from.cards.includes(special)).toBe(true);
      return [{ from: moveOut ? active : bench, to: moveOut ? bench : active, index: from.cards.indexOf(special) }];
    });
    expect(choices).toBe(1); expect((moveOut ? g.player.bench[0] : g.player.active).cards.includes(special)).toBe(true); ended(g);
  });
  it('Forretress permits zero transfers after dealing damage', () => {
    const g = board(new Happy6Forretress()); const metal = id(new Energy(CardType.METAL)); g.player.bench[0].cards.push(metal);
    attack(g, 0, prompt => { expect(prompt instanceof MoveEnergyPrompt).toBe(true); expect(g.opponent.active.damage).toBe(20); notEnded(g); return []; });
    expect(g.player.bench[0].cards.includes(metal)).toBe(true); ended(g);
  });
  it('lethal main damage does not award prizes or replace the target before Forretress transfers', () => {
    const g = board(new Happy6Forretress()); g.opponent.active.damage = 990;
    const metal = id(new Energy(CardType.METAL)); g.player.active.cards.push(metal);
    attack(g, 0, prompt => {
      if (prompt instanceof MoveEnergyPrompt) {
        notEnded(g); expect(g.opponent.active.damage).toBe(1010); expect(g.player.prizesTaken).toBe(0);
        return [{ from: active, to: bench, index: g.player.active.cards.indexOf(metal) }];
      }
      if (prompt instanceof ChooseCardsPrompt) return [0];
      if (prompt instanceof ChoosePokemonPrompt) return [bench];
      throw new Error('Unexpected KO prompt: ' + prompt.type);
    });
    expect(g.player.bench[0].cards.includes(metal)).toBe(true); expect(g.player.prizesTaken).toBe(1); ended(g);
  });

  for (const mode of ['bench', 'clefable', 'last', 'last-absent', 'active'] as const) {
    it(`${mode} copy: main hit, before-damage modifier and after-attack phase each run once`, () => {
      const source = id(new PhaseAttack());
      const g = board(mode === 'clefable' ? new Clefable() : mode.startsWith('last') ? new Sudowoodo() : new Copier(mode === 'active' ? 'active' : 'bench'));
      if (mode === 'bench') g.player.bench[0].cards = [source];
      else if (mode === 'clefable' || mode === 'active') g.opponent.active.cards = [source];
      else {
        g.state.playerLastAttack[g.opponent.id] = { attack: source.attacks[0], sourceCard: source };
        if (mode === 'last') g.opponent.bench[0].cards = [source];
        else g.opponent.lostzone.cards = [source];
      }
      attack(g, 0, prompt => copyChoice(prompt, source));
      expect(g.opponent.active.damage).toBe(30);
      expect(source.prepared).toBe(1); expect(source.before).toBe(1); expect(source.after).toBe(1); ended(g);
    });
  }
  for (const mode of ['bench', 'clefable', 'last'] as const) {
    it(`${mode} copy heals the actual attacker only once after Panic Mask prevented damage`, () => {
      const source = id(new BreloomHappy6());
      const g = board(mode === 'bench' ? new Copier() : mode === 'clefable' ? new Clefable() : new Sudowoodo());
      g.player.active.damage = g.card.hp - 30;
      if (mode === 'bench') { g.player.bench[0].cards = [source]; g.player.bench[0].damage = 60; }
      else if (mode === 'clefable') g.opponent.active.cards = [source];
      else { g.opponent.bench[0].cards = [source]; g.state.playerLastAttack[g.opponent.id] = { attack: source.attacks[1], sourceCard: source }; }
      mask(g); attack(g, 0, prompt => copyChoice(prompt, source, 1));
      expect(g.opponent.active.damage).toBe(0); expect(g.player.active.damage).toBe(g.card.hp - 60);
      if (mode === 'bench') expect(g.player.bench[0].damage).toBe(60);
      ended(g);
    });
    it(`${mode} copy removes Lucky Energy before its damage reaction`, () => {
      const source = id(new FloatzelHappy6());
      const g = board(mode === 'bench' ? new Copier() : mode === 'clefable' ? new Clefable() : new Sudowoodo());
      if (mode === 'bench') g.player.bench[0].cards = [source];
      else if (mode === 'clefable') g.opponent.active.cards = [source];
      else { g.opponent.bench[0].cards = [source]; g.state.playerLastAttack[g.opponent.id] = { attack: source.attacks[0], sourceCard: source }; }
      const lucky = id(new LuckyEnergy()); g.opponent.active.cards.push(lucky); let discards = 0;
      attack(g, 0, prompt => {
        if (!(prompt instanceof ChooseCardsPrompt)) return copyChoice(prompt, source);
        discards++; expect(g.opponent.active.damage).toBe(30);
        expect(g.opponent.hand.cards.length).toBe(0); notEnded(g); return selectEnergy(prompt, lucky);
      });
      expect(discards).toBe(1); expect(g.opponent.discard.cards).toEqual([lucky]);
      expect(g.opponent.hand.cards.length).toBe(1); ended(g);
    });
    it(`${mode} copy: Floatzel sees Shield Energy before its discard prompt`, () => {
      const source = id(new FloatzelHappy6());
      const g = board(mode === 'bench' ? new Copier() : mode === 'clefable' ? new Clefable() : new Sudowoodo());
      if (mode === 'bench') g.player.bench[0].cards = [source];
      else if (mode === 'clefable') g.opponent.active.cards = [source];
      else { g.opponent.bench[0].cards = [source]; g.state.playerLastAttack[g.opponent.id] = { attack: source.attacks[0], sourceCard: source }; }
      g.opponent.active.getPokemonCard()!.cardType = [CardType.METAL];
      const energy = id(new ShieldEnergy()); g.opponent.active.cards.push(energy); let discards = 0;
      attack(g, 0, prompt => {
        if (!(prompt instanceof ChooseCardsPrompt)) return copyChoice(prompt, source);
        discards++; expect(g.opponent.active.damage).toBe(20); notEnded(g); return selectEnergy(prompt, energy);
      });
      expect(discards).toBe(1); expect(g.opponent.discard.cards).toEqual([energy]); ended(g);
    });
  }
  it('cancelling a permitted bench copy creates no copied attack phases or damage', () => {
    const source = id(new PhaseAttack()), g = board(new Copier('bench', true)); g.player.bench[0].cards = [source];
    attack(g, 0, prompt => { expect(prompt instanceof ChoosePokemonPrompt).toBe(true); return null; });
    expect(source.prepared).toBe(0); expect(g.opponent.active.damage).toBe(0); ended(g);
  });
  it('a copied Floatzel discard still runs when the copied main hit is prevented', () => {
    const source = id(new FloatzelHappy6()), g = board(new Copier()); g.player.bench[0].cards = [source];
    g.opponent.active.preventDamageNextTurn = {}; const energy = id(new Energy()); g.opponent.active.cards.push(energy);
    attack(g, 0, prompt => prompt instanceof ChooseCardsPrompt ? selectEnergy(prompt, energy) : copyChoice(prompt, source));
    expect(g.opponent.active.damage).toBe(0); expect(g.opponent.discard.cards).toEqual([energy]); ended(g);
  });

  for (const [create, index, main, recoil] of [
    [() => new DarumakaHappy6(), 1, 50, 20], [() => new DarmanitanHappy6(), 1, 210, 70],
    [() => new ArrokudaHappy6(), 0, 30, 10],
  ] as const) {
    it(`${create().name}: dropping from above 40 HP to 40 or below does not retroactively enable Panic Mask`, () => {
      const g = board(create()); g.player.active.damage = g.card.hp - (40 + recoil); mask(g);
      attack(g, index); expect(g.opponent.active.damage).toBe(main); expect(g.player.active.damage).toBe(g.card.hp - 40); ended(g);
    });
    it(`${create().name}: initially 40 HP is blocked, but self-damage still occurs before AfterAttack`, () => {
      const g = board(create()); g.player.active.damage = g.card.hp - 40; mask(g);
      let observed = false; const reduce = g.store.reduceEffect.bind(g.store);
      spyOn(g.store, 'reduceEffect').and.callFake((state: State, effect: Effect) => {
        if (effect instanceof AfterAttackEffect && effect.attack === g.card.attacks[index]) {
          observed = true; expect(g.player.active.damage).toBe(g.card.hp - 40 + recoil); notEnded(g);
        }
        return reduce(state, effect);
      });
      attack(g, index, prompt => {
        if (prompt instanceof ChooseCardsPrompt) return [0];
        if (prompt instanceof ChoosePokemonPrompt) return [bench];
        throw new Error('Unexpected recoil KO prompt');
      });
      expect(observed).toBe(true); expect(g.opponent.active.damage).toBe(0); ended(g);
    });
    it(`${create().name}: Double Turbo reduces only the opposing hit; modified self weakness still doubles recoil`, () => {
      const g = board(create()); g.player.active.weaknessOverrideType = g.card.cardType[0];
      g.player.active.cards.push(id(new DoubleTurboEnergy()));
      attack(g, index, prompt => {
        if (prompt instanceof ChooseCardsPrompt) return [0];
        if (prompt instanceof ChoosePokemonPrompt) return [bench];
        throw new Error('Unexpected weakness KO prompt');
      });
      expect(g.opponent.active.damage).toBe(main - 20);
      // For lethal recoil the KO check replaces Active only after damage and AfterAttack.
      if (recoil * 2 < g.card.hp) expect(g.player.active.damage).toBe(recoil * 2);
      else expect(g.player.discard.cards.includes(g.card)).toBe(true);
      ended(g);
    });
    it(`${create().name}: Coating Metal Energy removes self-damage weakness`, () => {
      const g = board(create()); g.card.cardType = [CardType.METAL]; g.card.weakness = [{ type: CardType.METAL }];
      g.player.active.cards.push(id(new CoatingMetalEnergy()));
      attack(g, index);
      expect(g.opponent.active.damage).toBe(main); expect(g.player.active.damage).toBe(recoil); ended(g);
    });
  }
  it('self-damage applies resistance by default', () => {
    const g = board(new ArrokudaHappy6()); const card: PokemonCard = g.card;
    card.resistance = [{ type: CardType.WATER, value: -10 }];
    attack(g); expect(g.opponent.active.damage).toBe(30); expect(g.player.active.damage).toBe(0); ended(g);
  });
  it('lethal self-damage waits until attack effects and damage reactions before KO', () => {
    const g = board(new DarmanitanHappy6()); g.player.active.weaknessOverrideType = CardType.FIRE;
    const original = g.player.active; let afterAttack = false, reaction = false, knockedOut = false;
    const reduce = g.store.reduceEffect.bind(g.store);
    spyOn(g.store, 'reduceEffect').and.callFake((state: State, effect: Effect) => {
      if (effect instanceof AfterAttackEffect && effect.attack === g.card.attacks[1]) {
        afterAttack = true; expect(original.damage).toBe(140); expect(g.opponent.active.damage).toBe(210);
        expect(g.opponent.prizesTaken).toBe(0); notEnded(g);
      }
      if (effect instanceof AfterDamageEffect && effect.target === original) {
        reaction = true; expect(afterAttack).toBe(true); expect(g.opponent.prizesTaken).toBe(0); notEnded(g);
      }
      if (effect instanceof KnockOutEffect && effect.target === original) {
        knockedOut = true; expect(reaction).toBe(true); expect(g.opponent.prizesTaken).toBe(0);
      }
      return reduce(state, effect);
    });
    attack(g, 1, prompt => {
      if (prompt instanceof ChoosePokemonPrompt) return [bench];
      throw new Error('Unexpected lethal recoil prompt: ' + prompt.type);
    });
    expect(afterAttack && reaction && knockedOut).toBe(true);
    expect(g.player.discard.cards.includes(g.card)).toBe(true); expect(g.opponent.prizesTaken).toBe(1); ended(g);
  });
  it('copied self-damage uses the copying attacker and stays before AfterAttack, after main damage calculation', () => {
    const source = id(new DarumakaHappy6()), g = board(new Copier()); g.player.bench[0].cards = [source];
    g.player.active.damage = g.card.hp - 50; mask(g);
    attack(g, 0, prompt => copyChoice(prompt, source, 1));
    expect(g.opponent.active.damage).toBe(50); expect(g.player.active.damage).toBe(g.card.hp - 30);
    expect(g.player.bench[0].damage).toBe(0); ended(g);
  });
  it('standalone DealDamageEffect retains immediate AfterDamage notification', () => {
    const g = board(new FloatzelHappy6()); g.state.phase = GamePhase.ATTACK;
    const effect = new AttackEffect(g.player, g.opponent, g.card.attacks[0]); let reactions = 0;
    const reduce = g.store.reduceEffect.bind(g.store);
    spyOn(g.store, 'reduceEffect').and.callFake((state: State, e: Effect) => {
      if (e instanceof AfterDamageEffect) reactions++;
      return reduce(state, e);
    });
    g.store.reduceEffect(g.state, new DealDamageEffect(effect, 30));
    expect(g.opponent.active.damage).toBe(30); expect(reactions).toBe(1);
    g.store.reduceEffect(g.state, new PutDamageEffect(effect, 10));
    expect(g.opponent.active.damage).toBe(40); expect(reactions).toBe(2);
  });
});
