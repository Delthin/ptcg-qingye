import { Store } from '../../game/store/store';
import { State, GamePhase } from '../../game/store/state/state';
import { Player } from '../../game/store/state/player';
import { Card } from '../../game/store/card/card';
import { CardList } from '../../game/store/state/card-list';
import { PokemonCardList } from '../../game/store/state/pokemon-card-list';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { EnergyCard } from '../../game/store/card/energy-card';
import { CardType, EnergyType, SpecialCondition } from '../../game/store/card/card-types';
import { AttackAction } from '../../game/store/actions/game-actions';
import { ResolvePromptAction } from '../../game/store/actions/resolve-prompt-action';
import { Prompt } from '../../game/store/prompts/prompt';
import { WaitPrompt } from '../../game/store/prompts/wait-prompt';
import { CoinFlipPrompt } from '../../game/store/prompts/coin-flip-prompt';
import { ChooseAttackPrompt } from '../../game/store/prompts/choose-attack-prompt';
import { ChoosePrizePrompt } from '../../game/store/prompts/choose-prize-prompt';
import { Effect } from '../../game/store/effects/effect';
import { AttackEffect, KnockOutEffect } from '../../game/store/effects/game-effects';
import { AddSpecialConditionsEffect, AfterDamageEffect, PutDamageEffect } from '../../game/store/effects/attack-effects';
import { AfterAttackEffect, BeforeDoingDamageEffect } from '../../game/store/effects/game-phase-effects';
import { CoinFlipEffect } from '../../game/store/effects/play-card-effects';
import { HealTargetEffect } from '../../game/store/effects/attack-effects';
import { SelfPreventRetreatEffect, PreventRetreatEffect } from '../../game/store/effects/effect-of-attack-effects';
import { Happy6Sigilyph, Happy6Skarmory, Happy6Swellow, Happy6Komala, Happy6PaldeanClodsireEx,
  Happy6Sandslash } from '../10-scarlet-and-violet/set-happy-trainers/utility/cards';
import { Clefable } from '../10-scarlet-and-violet/set-twilight-masquerade/clefable';
import { Sudowoodo } from '../07-x-and-y/set-breakpoint/sudowoodo';

class Target extends PokemonCard {
  public name = 'Utility phase target'; public fullName = 'Utility phase target TEST'; public set = 'TEST';
  public hp = 500; public weakness = []; public resistance = [];
}
class Energy extends EnergyCard {
  public name = 'Utility phase energy'; public fullName = 'Utility phase energy TEST'; public set = 'TEST';
  constructor(type: CardType) { super(); this.provides = [type]; this.energyType = EnergyType.BASIC; }
}
let nextId = 2000;
function id<T extends Card>(card: T): T { card.id = nextId++; return card; }
function board(card: PokemonCard) {
  const state = new State(); state.phase = GamePhase.PLAYER_TURN; state.turn = 5;
  state.players = [new Player(), new Player()];
  for (const [i, p] of state.players.entries()) {
    p.id = i ? 29 : 17; p.active.cards = [id(new Target())];
    p.bench = Array.from({ length: 5 }, () => new PokemonCardList()); p.bench[0].cards = [id(new Target())];
    p.deck.cards = Array.from({ length: 20 }, () => id(new Target()));
    p.prizes = Array.from({ length: 6 }, () => { const pile = new CardList(); pile.cards = [id(new Target())]; return pile; });
  }
  const [player, opponent] = state.players; player.active.cards = [id(card)];
  const cost = card.attacks.reduce((a, b) => a.cost.length > b.cost.length ? a : b).cost;
  player.active.cards.push(...cost.map(type => id(new Energy(type))));
  const store = new Store({ onStateChange() {} }, false); store.state = state;
  return { store, state, player, opponent, card };
}
type Board = ReturnType<typeof board>;
function pending(g: Board): Prompt<any> {
  const prompt = g.state.prompts.find(p => p.result === undefined);
  if (!prompt) throw new Error('No pending prompt'); return prompt;
}
function respond(g: Board, raw: unknown): void {
  const prompt = pending(g); const result = prompt.decode(raw, g.state);
  expect(prompt.validate(result, g.state)).toBe(true);
  g.store.dispatch(new ResolvePromptAction(prompt.id, result), prompt.playerId);
}
function finish(g: Board, sleepHeads = false, copy?: PokemonCard, copyIndex = 0): void {
  for (let i = 0; g.store.hasPrompts() && i < 30; i++) {
    const prompt = pending(g);
    if (prompt instanceof WaitPrompt) respond(g, null);
    else if (prompt instanceof CoinFlipPrompt) respond(g, sleepHeads);
    else if (prompt instanceof ChooseAttackPrompt && copy) respond(g, { index: 0, attack: copy.attacks[copyIndex].name });
    else if (prompt instanceof ChoosePrizePrompt) respond(g, Array.from({ length: prompt.options.count }, (_, n) => n));
    else throw new Error('Unexpected prompt: ' + prompt.type);
  }
  expect(g.store.hasPrompts()).toBe(false);
}
function attack(g: Board, index = 0, sleepHeads = false, copy?: PokemonCard, copyIndex = 0): void {
  g.store.dispatch(new AttackAction(g.player.id, g.card.attacks[index].name)); finish(g, sleepHeads, copy, copyIndex);
  expect(g.state.activePlayer).toBe(1); expect(g.state.phase).toBe(GamePhase.PLAYER_TURN);
}
function observe(g: Board, onEffect: (effect: Effect) => void): void {
  const reduce = g.store.reduceEffect.bind(g.store);
  spyOn(g.store, 'reduceEffect').and.callFake((state: State, effect: Effect) => { onEffect(effect); return reduce(state, effect); });
}
function remembered(source: PokemonCard, index = 0): Board {
  const g = board(new Sudowoodo()); g.opponent.bench[0].cards = [id(source)];
  g.state.playerLastAttack[g.opponent.id] = { attack: source.attacks[index], sourceCard: source }; return g;
}

// All cases enter through AttackAction; observers inspect the actual shared phase pipeline.
describe('Happy6 utility attack phases through Actions', () => {
  for (const [create, count] of [[() => new Happy6Sigilyph(), 2], [() => new Happy6Swellow(), 3]] as const) {
    it(`${create().name} draws only in step 5 even with zero main damage`, () => {
      const g = board(create()); const phases: string[] = [];
      observe(g, effect => {
        if (effect instanceof BeforeDoingDamageEffect) {
          phases.push('before'); expect(g.player.hand.cards.length).toBe(0);
        }
        if (effect instanceof AfterAttackEffect) {
          phases.push('after'); expect(g.player.hand.cards.length).toBe(count);
        }
        if (effect instanceof AfterDamageEffect) phases.push('reaction');
      });
      attack(g); expect(phases).toEqual(['before', 'after']);
      expect(g.player.hand.cards.length).toBe(count); expect(g.player.deck.cards.length).toBe(20 - count);
    });
  }
  for (const heads of [false, true]) for (const protectedTarget of [false, true]) {
    it(`Sigilyph flips after its 60 damage, with status protection (${heads}/${protectedTarget})`, () => {
      const g = board(new Happy6Sigilyph()); spyOn(Math, 'random').and.returnValue(heads ? 0.25 : 0.75);
      if (protectedTarget) g.opponent.active.preventEffectsOfAttacksNextTurn = {};
      const events: string[] = [];
      observe(g, effect => {
        if (effect instanceof BeforeDoingDamageEffect) {
          events.push('before'); expect(g.opponent.active.specialConditions).toEqual([]);
        }
        if (effect instanceof CoinFlipEffect) { events.push('coin'); expect(g.opponent.active.damage).toBe(60); }
        if (effect instanceof AddSpecialConditionsEffect) {
          events.push('status'); expect(effect.source).toBe(g.player.active); expect(effect.target).toBe(g.opponent.active);
          expect(g.opponent.active.damage).toBe(60);
        }
        if (effect instanceof AfterAttackEffect) {
          events.push('after'); expect(g.opponent.active.specialConditions.includes(SpecialCondition.PARALYZED)).toBe(heads && !protectedTarget);
        }
        if (effect instanceof AfterDamageEffect) events.push('reaction');
      });
      attack(g, 1); expect(events).toEqual(heads ? ['before', 'coin', 'status', 'after', 'reaction'] : ['before', 'coin', 'after', 'reaction']);
    });
  }
  it('prevented Sigilyph main damage still flips and paralyzes', () => {
    const g = board(new Happy6Sigilyph()); spyOn(Math, 'random').and.returnValue(0.25);
    g.opponent.active.preventDamageNextTurn = {}; attack(g, 1);
    expect(g.opponent.active.damage).toBe(0); expect(g.opponent.active.specialConditions).toContain(SpecialCondition.PARALYZED);
  });
  for (const copy of [false, true]) it(`Skarmory heals and restricts the actual source in step 5 (${copy ? 'Clefable copy' : 'normal'})`, () => {
    const source = new Happy6Skarmory(); const g = board(copy ? new Clefable() : source);
    if (copy) { g.opponent.active.cards = [id(source)]; g.opponent.active.damage = 60; }
    g.player.active.damage = 70; let before = 0, after = 0, heal = 0, lock = 0;
    observe(g, effect => {
      if (effect instanceof BeforeDoingDamageEffect && effect.attack === source.attacks[0]) {
        before++; expect(g.player.active.damage).toBe(70); expect(g.player.active.cannotRetreatNextTurnPending).toBe(false);
      }
      if (effect instanceof HealTargetEffect) { heal++; expect(effect.target).toBe(g.player.active); }
      if (effect instanceof SelfPreventRetreatEffect) { lock++; expect(effect.target).toBe(g.player.active); }
      if (effect instanceof AfterAttackEffect && effect.attack === source.attacks[0]) {
        after++; expect(g.player.active.damage).toBe(20); expect(g.player.active.cannotRetreatNextTurnPending).toBe(true);
        expect(g.opponent.active.cannotRetreatNextTurn).toBe(false); expect(g.opponent.active.cannotRetreatNextTurnPending).toBe(false);
      }
    });
    attack(g, 0, false, copy ? source : undefined);
    expect([before, after, heal, lock]).toEqual([1, 1, 1, 1]);
    expect(g.player.active.cannotRetreatNextTurn).toBe(true); expect(g.player.active.cannotRetreatNextTurnPending).toBe(false);
    if (copy) expect(g.opponent.active.damage).toBe(60);
  });
  for (const sleepHeads of [false, true]) for (const protectedTarget of [false, true]) {
    it(`Komala sleeps after 30 damage, before checkup (${sleepHeads}/${protectedTarget})`, () => {
      const g = board(new Happy6Komala()); if (protectedTarget) g.opponent.active.preventEffectsOfAttacksNextTurn = {};
      const events: string[] = [];
      observe(g, effect => {
        if (effect instanceof BeforeDoingDamageEffect) {
          events.push('before'); expect(g.player.active.specialConditions).toEqual([]); expect(g.opponent.active.specialConditions).toEqual([]);
          // Future bonus registration remains in preparation, not a delayed damage calculation.
          expect(g.player.active.nextTurnAttackDamageBonusPending).not.toBeNull();
        }
        if (effect instanceof AddSpecialConditionsEffect) {
          events.push(effect.target === g.player.active ? 'own' : 'enemy'); expect(effect.source).toBe(g.player.active);
          expect(g.opponent.active.damage).toBe(30);
        }
        if (effect instanceof AfterAttackEffect) {
          events.push('after'); expect(g.player.active.specialConditions).toContain(SpecialCondition.ASLEEP);
          expect(g.opponent.active.specialConditions.includes(SpecialCondition.ASLEEP)).toBe(!protectedTarget);
        }
        if (effect instanceof AfterDamageEffect) events.push('reaction');
      });
      attack(g, 0, sleepHeads); expect(events).toEqual(['before', 'own', 'enemy', 'after', 'reaction']);
      expect(g.player.active.specialConditions.includes(SpecialCondition.ASLEEP)).toBe(!sleepHeads);
      expect(g.opponent.active.specialConditions.includes(SpecialCondition.ASLEEP)).toBe(!sleepHeads && !protectedTarget);
    });
  }
  it('Komala still sleeps both actives when its main damage is prevented', () => {
    const g = board(new Happy6Komala()); g.opponent.active.preventDamageNextTurn = {}; attack(g);
    expect(g.opponent.active.damage).toBe(0); expect(g.player.active.specialConditions).toContain(SpecialCondition.ASLEEP);
    expect(g.opponent.active.specialConditions).toContain(SpecialCondition.ASLEEP);
  });
  for (const preventDamage of [false, true]) for (const protectedTarget of [false, true]) {
    it(`Clodsire poisons and locks in step 5 (${preventDamage}/${protectedTarget})`, () => {
      const g = board(new Happy6PaldeanClodsireEx()); if (preventDamage) g.opponent.active.preventDamageNextTurn = {};
      if (protectedTarget) g.opponent.active.preventEffectsOfAttacksNextTurn = {};
      const events: string[] = [];
      observe(g, effect => {
        if (effect instanceof BeforeDoingDamageEffect) {
          events.push('before'); expect(g.opponent.active.specialConditions).toEqual([]); expect(g.opponent.active.cannotRetreatNextTurn).toBe(false);
        }
        if (effect instanceof AddSpecialConditionsEffect || effect instanceof PreventRetreatEffect) {
          events.push(effect instanceof AddSpecialConditionsEffect ? 'poison' : 'lock');
          expect(effect.source).toBe(g.player.active); expect(effect.target).toBe(g.opponent.active);
          expect(g.opponent.active.damage).toBe(preventDamage ? 0 : 60);
        }
        if (effect instanceof AfterAttackEffect) {
          events.push('after'); expect(g.opponent.active.specialConditions.includes(SpecialCondition.POISONED)).toBe(!protectedTarget);
          expect(g.opponent.active.cannotRetreatNextTurn).toBe(!protectedTarget);
        }
        if (effect instanceof AfterDamageEffect) events.push('reaction');
      });
      attack(g); expect(events).toEqual(['before', 'poison', 'lock', 'after', ...(preventDamage ? [] : ['reaction'])]);
      // The unprotected poison adds 10 only at the subsequent checkup.
      expect(g.opponent.active.damage).toBe((preventDamage ? 0 : 60) + (protectedTarget ? 0 : 10));
    });
  }
  for (const source of [new Happy6Sigilyph(), new Happy6Swellow(), new Happy6Komala(), new Happy6PaldeanClodsireEx()]) {
    it(`Sudowoodo's real remembered ${source.name} attack keeps step-5 effects`, () => {
      const index = source instanceof Happy6Sigilyph ? 1 : 0; const g = remembered(source, index);
      if (source instanceof Happy6Sigilyph) spyOn(Math, 'random').and.returnValue(0.25);
      let before = 0, after = 0;
      observe(g, effect => {
        if (effect instanceof BeforeDoingDamageEffect && effect.attack === source.attacks[index]) {
          before++; expect(g.player.hand.cards.length).toBe(0); expect(g.opponent.active.specialConditions).toEqual([]);
          expect(g.player.active.specialConditions).toEqual([]);
        }
        if (effect instanceof AddSpecialConditionsEffect) {
          expect(effect.source).toBe(g.player.active); expect(g.opponent.active.damage).toBe(source.attacks[index].damage);
        }
        if (effect instanceof AfterAttackEffect && effect.attack === source.attacks[index]) {
          after++;
          if (source instanceof Happy6Swellow) expect(g.player.hand.cards.length).toBe(3);
          if (source instanceof Happy6Sigilyph) expect(g.opponent.active.specialConditions).toContain(SpecialCondition.PARALYZED);
          if (source instanceof Happy6Komala) expect(g.player.active.specialConditions).toContain(SpecialCondition.ASLEEP);
          if (source instanceof Happy6PaldeanClodsireEx) expect(g.opponent.active.cannotRetreatNextTurn).toBe(true);
        }
      });
      attack(g); expect([before, after]).toEqual([1, 1]); expect(g.opponent.bench[0].damage).toBe(0);
      expect(g.opponent.bench[0].specialConditions).toEqual([]);
    });
  }
  for (const copy of [false, true]) it(`Sandslash damages own bench after main damage, before step 5 and reactions (${copy})`, () => {
    const source = new Happy6Sandslash(); const g = copy ? remembered(source, 1) : board(source);
    g.player.bench[3].cards = [id(new Target())];
    g.player.bench[0].getPokemonCard()!.weakness = [{ type: copy ? CardType.FIGHTING : source.cardType[0] }];
    g.player.bench[3].getPokemonCard()!.resistance = [{ type: CardType.FIGHTING, value: -30 }];
    const events: string[] = [];
    observe(g, effect => {
      if (effect instanceof AttackEffect && effect.attack === source.attacks[1]) {
        // Observe a step-5 continuation on the real attack, without changing damage or card effects.
        effect.afterDamageEffects.push(state => { events.push('step5'); expect(g.player.bench[0].damage).toBe(10); return state; });
      }
      if (effect instanceof BeforeDoingDamageEffect && effect.attack === source.attacks[1]) {
        events.push('before'); expect(g.player.bench[0].damage).toBe(0);
      }
      if (effect instanceof PutDamageEffect && g.player.bench.includes(effect.target)) {
        events.push('bench'); expect(g.opponent.active.damage).toBe(120); expect(effect.source).toBe(g.player.active);
      }
      if (effect instanceof AfterAttackEffect && effect.attack === source.attacks[1]) events.push('after');
      if (effect instanceof AfterDamageEffect) {
        events.push('reaction'); expect(g.player.bench[0].damage).toBe(10); expect(g.player.bench[3].damage).toBe(10);
      }
    });
    attack(g, copy ? 0 : 1);
    expect(events).toEqual(['before', 'bench', 'bench', 'step5', 'after', 'reaction', 'reaction', 'reaction']);
    expect(g.player.bench.map(p => p.damage)).toEqual([10, 0, 0, 10, 0]);
    expect(g.player.active.damage).toBe(0); expect(g.opponent.bench[0].damage).toBe(0);
  });
  it('Sandslash own-bench damage waits for reactions and never becomes an opponent attack KO', () => {
    const g = board(new Happy6Sandslash()); const victim = g.player.bench[0]; victim.damage = 490;
    const events: string[] = [];
    observe(g, effect => {
      if (effect instanceof AfterAttackEffect) { events.push('after'); expect(victim.damage).toBe(500); expect(g.opponent.prizesTaken).toBe(0); }
      if (effect instanceof AfterDamageEffect && effect.target === victim) {
        events.push('reaction'); expect(effect.damage).toBe(10);
        expect(victim.pendingKnockout!.event.cause).toBe('other');
        expect(victim.pendingKnockout!.event.source).toBe(g.card);
        expect(victim.pendingKnockout!.event.attackName).toBe(g.card.attacks[1].name);
      }
      if (effect instanceof KnockOutEffect && effect.target === victim) {
        events.push('ko'); expect(g.opponent.active.damage).toBe(120); expect(g.opponent.prizesTaken).toBe(0);
      }
    });
    attack(g, 1); expect(events).toEqual(['after', 'reaction', 'ko']); expect(g.opponent.prizesTaken).toBe(1);
    const event = g.player.knockoutEventsDuringOpponentsLastTurn.find(e => e.targetPlayerId === g.player.id);
    expect(event).toBeUndefined(); // An own-turn KO must not enter the opponent-turn revenge history.
  });
});
