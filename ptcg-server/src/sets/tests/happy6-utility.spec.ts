import { Store } from '../../game/store/store';
import { GameError } from '../../game/game-error';
import { GameMessage } from '../../game/game-message';
import { State, GamePhase } from '../../game/store/state/state';
import { Player } from '../../game/store/state/player';
import { CardList } from '../../game/store/state/card-list';
import { PokemonCardList } from '../../game/store/state/pokemon-card-list';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { EnergyCard } from '../../game/store/card/energy-card';
import { CardType, CardTag, EnergyType, SpecialCondition, Stage } from '../../game/store/card/card-types';
import { AttackEffect, PowerEffect } from '../../game/store/effects/game-effects';
import { AfterAttackEffect, EndTurnEffect } from '../../game/store/effects/game-phase-effects';
import { DealDamageEffect } from '../../game/store/effects/attack-effects';
import { CardTarget, PlayerType, SlotType } from '../../game/store/actions/play-card-action';
import { ResolvePromptAction } from '../../game/store/actions/resolve-prompt-action';
import { AttackAction, PassTurnAction } from '../../game/store/actions/game-actions';
import { Effect } from '../../game/store/effects/effect';
import { CoinFlipPrompt } from '../../game/store/prompts/coin-flip-prompt';
import { Prompt } from '../../game/store/prompts/prompt';
import { WaitPrompt } from '../../game/store/prompts/wait-prompt';
import { ConfirmPrompt } from '../../game/store/prompts/confirm-prompt';
import { ChoosePokemonPrompt } from '../../game/store/prompts/choose-pokemon-prompt';
import { MoveEnergyPrompt } from '../../game/store/prompts/move-energy-prompt';
import { DoubleTurboEnergy } from '../09-sword-and-shield/set-brilliant-stars/double-turbo-energy';
import { HappyTrainersUtility } from '../10-scarlet-and-violet/set-happy-trainers/utility';
import {
  Happy6AlolanMarowak, Happy6Sigilyph, Happy6Elgyem, Happy6Beheeyem,
  Happy6Sandshrew, Happy6Sandslash, Happy6Meditite, Happy6Medicham,
  Happy6Forretress, Happy6Skarmory, Happy6Swellow, Happy6Komala,
  Happy6Squawkabilly, Happy6AlcremieEx, Happy6KoraidonEx, Happy6PaldeanClodsireEx
} from '../10-scarlet-and-violet/set-happy-trainers/utility/cards';

class Target extends PokemonCard {
  public name = 'Happy6 Test Target'; public fullName = 'Happy6 Test Target TEST'; public set = 'TEST';
  public hp = 500; public cardType = [CardType.COLORLESS];
}
class TestEnergy extends EnergyCard {
  public name = 'Happy6 Test Energy'; public fullName = 'Happy6 Test Energy TEST'; public set = 'TEST';
  constructor(type: CardType, special = false) {
    super(); this.provides = [type]; this.energyType = special ? EnergyType.SPECIAL : EnergyType.BASIC;
  }
}
function board(card: PokemonCard) {
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
  const attack = (index = 0) => {
    const effect = new AttackEffect(player, opponent, card.attacks[index]);
    store.reduceEffect(state, effect); return effect;
  };
  const power = () => store.reduceEffect(state, new PowerEffect(player, card.powers[0], card));
  const end = (owner: Player) => store.reduceEffect(state, new EndTurnEffect(owner));
  return { state, store, player, opponent, attack, power, end };
}
const ownActive: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
const ownBench: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 };
const enemyBench: CardTarget = { player: PlayerType.TOP_PLAYER, slot: SlotType.BENCH, index: 0 };
function first<T extends Prompt<any>>(store: Store, ctor: new (...args: any[]) => T): T {
  const prompt = store.state.prompts.find(p => p instanceof ctor && p.result === undefined) as T | undefined;
  expect(prompt).toBeDefined(); return prompt!;
}
function answer(store: Store, prompt: Prompt<any>, raw: unknown, owner = 17): void {
  const decoded = prompt.decode(raw, store.state);
  expect(prompt.validate(decoded, store.state)).toBe(true);
  store.dispatch(new ResolvePromptAction(prompt.id, decoded), owner);
}
function finishFlip(store: Store): void {
  // Undefined means unresolved to Store.reducePrompt; animation acknowledgements use null.
  answer(store, first(store, WaitPrompt), null);
}
function withCoins<T>(store: Store, results: boolean[], attack: () => T): T {
  const current = Math.random as jasmine.Spy;
  const random = current.and ? current : spyOn(Math, 'random');
  // Stats IDs and source maps also use randomness. Hold each outcome until its
  // animation resolves, instead of letting unrelated calls consume a sequence.
  random.and.returnValue(results[0] ? 0.25 : 0.75);
  const effect = attack();
  for (let i = 0; i < results.length; i++) {
    random.and.returnValue(results[i + 1] ? 0.25 : 0.75);
    finishFlip(store);
  }
  return effect;
}
function attach(list: PokemonCardList, ...energies: EnergyCard[]) { list.cards.push(...energies); }
// Direct card-effect contract fixtures. Real KO production and turn rotation are
// covered through Actions in happy6-state-lifecycle.spec.ts.
function previousKnockout(g: ReturnType<typeof board>, owner: Player, direct: boolean): void {
  const source = owner === g.player ? g.opponent : g.player;
  const victim = new Target();
  owner.knockoutEventsDuringOpponentsLastTurn = [{
    turn: g.state.turn - 1, phase: GamePhase.ATTACK, target: victim, targetPlayerId: owner.id,
    targetTypes: victim.cardType.slice(), targetTags: victim.tags.slice(),
    cause: direct ? 'attack-damage' : 'attack-effect', source: source.active.getPokemonCard(),
    sourcePlayerId: source.id, attackName: 'Previous attack',
  }];
}
// Forretress's transfers belong to step 5, not AttackEffect preparation.
function startForretress(g: ReturnType<typeof board>): void {
  const card = g.player.active.getPokemonCard()!;
  g.store.dispatch(new AttackAction(g.player.id, card.attacks[0].name));
  finishFlip(g.store); // Decode and acknowledge the real attack animation.
  expect(g.opponent.active.damage).toBe(20);
  expect(g.state.phase).toBe(GamePhase.ATTACK);
  expect(g.state.activePlayer).toBe(0);
}

// These attacks mutate only in the managed damage/effect phases. Keep the
// before-checkup assertions separate from the completed Action's turn rotation.
function finishUtilityAction(g: ReturnType<typeof board>): void {
  for (let i = 0; g.store.hasPrompts() && i < 20; i++) {
    const prompt = g.state.prompts.find(p => p.result === undefined)!;
    if (prompt instanceof WaitPrompt) answer(g.store, prompt, null, prompt.playerId);
    else if (prompt instanceof CoinFlipPrompt) answer(g.store, prompt, false, prompt.playerId);
    else throw new Error('Unexpected utility prompt: ' + prompt.type);
  }
  expect(g.store.hasPrompts()).toBe(false);
}
function utilityAttack(g: ReturnType<typeof board>, index = 0, beforeCheckup?: () => void): void {
  const card = g.player.active.getPokemonCard()!;
  attach(g.player.active, ...card.attacks[index].cost.map(type => new TestEnergy(type)));
  if (beforeCheckup) {
    const reduce = g.store.reduceEffect.bind(g.store); let observed = false;
    spyOn(g.store, 'reduceEffect').and.callFake((state: State, effect: Effect) => {
      if (!observed && effect instanceof AfterAttackEffect && effect.attack === card.attacks[index]) { observed = true; beforeCheckup(); }
      return reduce(state, effect);
    });
    g.store.dispatch(new AttackAction(g.player.id, card.attacks[index].name)); finishUtilityAction(g);
    expect(observed).toBe(true);
  } else {
    g.store.dispatch(new AttackAction(g.player.id, card.attacks[index].name)); finishUtilityAction(g);
  }
  expect(g.state.activePlayer).toBe(1);
}
function passUtilityTurn(g: ReturnType<typeof board>): void {
  g.store.dispatch(new PassTurnAction(g.state.players[g.state.activePlayer].id)); finishUtilityAction(g);
}

describe('Happy6 utility printed data', () => {
  // 022 itself plus the eighteen entries after it, and three ex cards: 22 unique effects.
  const expected: [string, string, number, Stage, number][] = [
    ['CSVH6eC', '022', 120, Stage.STAGE_1, 2], ['CSVH6eC', '023', 110, Stage.BASIC, 1],
    ['CSVH6eC', '024', 60, Stage.BASIC, 1], ['CSVH6eC', '025', 100, Stage.STAGE_1, 1],
    ['CSVH6eC', '027', 50, Stage.BASIC, 1], ['CSVH6eC', '028', 60, Stage.BASIC, 1],
    ['CSVH6eC', '029', 120, Stage.STAGE_1, 1], ['CSVH6eC', '030', 70, Stage.BASIC, 1],
    ['CSVH6eC', '031', 70, Stage.BASIC, 1], ['CSVH6eC', '032', 120, Stage.STAGE_1, 1],
    ['CSVH6eC', '035', 120, Stage.STAGE_1, 1], ['CSVH6eC', '036', 130, Stage.STAGE_1, 2],
    ['CSVH6eC', '037', 110, Stage.BASIC, 1], ['CSVH6eC', '038', 60, Stage.BASIC, 1],
    ['CSVH6eC', '039', 100, Stage.STAGE_1, 0], ['CSVH6eC', '040', 70, Stage.BASIC, 1],
    ['CSVH6eC', '041', 100, Stage.STAGE_1, 1], ['CSVH6eC', '042', 100, Stage.BASIC, 2],
    ['CSVH6eC', '043', 70, Stage.BASIC, 1], ['CSVH6pC', '003', 250, Stage.STAGE_1, 2],
    ['CSVH6pC', '004', 230, Stage.BASIC, 2], ['CSVH6pC', '005', 280, Stage.STAGE_1, 3]
  ];
  it('exports one aggregate and unique PokemonCards without duplicating the Komala alias', () => {
    expect(HappyTrainersUtility.length).toBe(22);
    expect(new Set(HappyTrainersUtility.map(c => c.fullName)).size).toBe(22);
    expect(HappyTrainersUtility.filter(c => c.name === 'Komala').length).toBe(1);
    for (const [set, number, hp, stage, retreat] of expected) {
      const card = HappyTrainersUtility.find(c => c.set === set && c.setNumber === number) as PokemonCard;
      expect(card instanceof PokemonCard).toBe(true); expect(card.hp).toBe(hp); expect(card.stage).toBe(stage);
      expect(card.retreat).toEqual(Array(retreat).fill(CardType.COLORLESS));
      expect(card.fullName).toBe(card.name + ' ' + set);
      if (set === 'CSVH6pC') expect(card.tags).toContain(CardTag.POKEMON_ex);
    }
  });
});

describe('Happy6 utility attack effects', () => {
  for (const [anyKo, attackKo, expected] of [[false, false, 30], [true, false, 30], [true, true, 120]] as [boolean, boolean, number][]) {
    it(`Alolan Marowak requires an own last-opponent-turn attack-damage KO (${anyKo}/${attackKo})`, () => {
      const g = board(new Happy6AlolanMarowak());
      if (anyKo) previousKnockout(g, g.player, attackKo);
      expect(g.attack().damage).toBe(expected); expect(g.attack(1).damage).toBe(90);
    });
  }
  it('an opponent KO does not activate Alolan Marowak revenge', () => {
    const g = board(new Happy6AlolanMarowak());
    previousKnockout(g, g.opponent, true);
    expect(g.attack().damage).toBe(30);
  });
  it('Medicham counts two energy units supplied by a single special Energy', () => {
    const g = board(new Happy6Medicham()); attach(g.player.active, new DoubleTurboEnergy());
    attach(g.opponent.active, new TestEnergy(CardType.FIRE), new TestEnergy(CardType.WATER));
    expect(g.attack().damage).toBe(170);
  });
  it('Medicham does not compare physical energy-card counts', () => {
    const g = board(new Happy6Medicham()); attach(g.player.active, new DoubleTurboEnergy());
    attach(g.opponent.active, new TestEnergy(CardType.FIRE)); expect(g.attack().damage).toBe(50);
  });
  it('Forretress moves any number of Metal-providing basic and special energies between own Pokemon', () => {
    const g = board(new Happy6Forretress()); const metal = new TestEnergy(CardType.METAL); const rainbow = new TestEnergy(CardType.ANY, true);
    const fire = new TestEnergy(CardType.FIRE); attach(g.player.active, metal, fire); attach(g.player.bench[0], rainbow);
    startForretress(g); const prompt = first(g.store, MoveEnergyPrompt);
    expect(prompt.options.min).toBe(0); expect(prompt.options.max).toBeUndefined();
    expect(prompt.options.blockedMap.find(e => e.source.slot === SlotType.ACTIVE)!.blocked).toContain(2);
    answer(g.store, prompt, [{ from: ownActive, to: ownBench, index: 1 }, { from: ownBench, to: ownActive, index: 1 }]);
    expect(g.player.active.cards).toContain(rainbow); expect(g.player.active.cards).toContain(fire);
    expect(g.player.active.cards).not.toContain(metal); expect(g.player.bench[0].cards).toContain(metal);
    expect(g.opponent.active.damage).toBe(20); expect(g.state.activePlayer).toBe(1);
    expect(g.store.hasPrompts()).toBe(false);
  });
  it('Forretress can choose zero transfers', () => {
    const g = board(new Happy6Forretress()); attach(g.player.active, new TestEnergy(CardType.METAL)); startForretress(g);
    answer(g.store, first(g.store, MoveEnergyPrompt), []); expect(g.player.active.cards.length).toBe(2);
    expect(g.state.activePlayer).toBe(1); expect(g.store.hasPrompts()).toBe(false);
  });
  for (const invalid of ['non-metal', 'opponent', 'duplicate']) it(`Forretress rejects ${invalid} transfers before any movement`, () => {
    const g = board(new Happy6Forretress()); const metal = new TestEnergy(CardType.METAL); const fire = new TestEnergy(CardType.FIRE);
    attach(g.player.active, metal, fire); startForretress(g); const prompt = first(g.store, MoveEnergyPrompt);
    const valid = { from: ownActive, to: ownBench, index: 1 };
    const bad = invalid === 'non-metal' ? { ...valid, index: 2 } : invalid === 'opponent' ? { ...valid, to: enemyBench } : valid;
    expect(() => prompt.decode([valid, bad], g.state)).toThrow(new GameError(GameMessage.INVALID_PROMPT_RESULT));
    const decoded = [valid, bad].map(t => ({ from: t.from, to: t.to, card: g.player.active.cards[t.index] }));
    expect(() => g.store.dispatch(new ResolvePromptAction(prompt.id, decoded), 17)).toThrow(new GameError(GameMessage.INVALID_PROMPT_RESULT));
    expect(g.player.active.cards).toContain(metal); expect(g.player.bench[0].cards).not.toContain(metal);
  });
  it('Forretress flips four coins for eighty per heads', () => {
    const g = board(new Happy6Forretress());
    const effect = withCoins(g.store, [true, false, true, true], () => g.attack(1));
    expect(effect.damage).toBe(240);
  });
  it('Skarmory heals 50 and locks only its next own turn, then expires', () => {
    const g = board(new Happy6Skarmory()); g.player.active.damage = 70;
    utilityAttack(g, 0, () => {
      expect(g.player.active.damage).toBe(20); expect(g.player.active.cannotRetreatNextTurn).toBe(false);
      expect(g.player.active.cannotRetreatNextTurnPending).toBe(true);
    });
    expect(g.player.active.cannotRetreatNextTurn).toBe(true); expect(g.player.active.cannotRetreatNextTurnPending).toBe(false);
    passUtilityTurn(g); expect(g.player.active.cannotRetreatNextTurn).toBe(true);
    passUtilityTurn(g); expect(g.player.active.cannotRetreatNextTurn).toBe(false);
  });
  it('switching Skarmory clears its delayed retreat restriction', () => {
    const g = board(new Happy6Skarmory()); utilityAttack(g); const stack = g.player.active;
    g.player.switchPokemon(g.player.bench[0], g.store, g.state);
    expect(stack.cannotRetreatNextTurnPending).toBe(false); expect(stack.cannotRetreatNextTurn).toBe(false);
  });
  it('Komala sleeps both actives and gains 100 only on its next own turn', () => {
    const g = board(new Happy6Komala());
    utilityAttack(g, 0, () => {
      expect(g.opponent.active.damage).toBe(30);
      expect(g.player.active.specialConditions).toContain(SpecialCondition.ASLEEP);
      expect(g.opponent.active.specialConditions).toContain(SpecialCondition.ASLEEP);
      expect(g.player.active.nextTurnAttackDamageBonus).toBeNull();
    });
    // Both checkup coins are deterministically tails; step-5 sleep remains.
    expect(g.player.active.specialConditions).toContain(SpecialCondition.ASLEEP);
    expect(g.opponent.active.specialConditions).toContain(SpecialCondition.ASLEEP);
    g.player.active.specialConditions = []; g.opponent.active.specialConditions = [];
    passUtilityTurn(g); const damage = g.opponent.active.damage;
    utilityAttack(g); expect(g.opponent.active.damage - damage).toBe(130);
  });
  it('switching Komala clears both active and pending next-turn damage bonuses', () => {
    const g = board(new Happy6Komala()); utilityAttack(g); g.player.active.specialConditions = []; g.opponent.active.specialConditions = [];
    passUtilityTurn(g); const stack = g.player.active;
    g.player.switchPokemon(g.player.bench[0], g.store, g.state);
    expect(stack.nextTurnAttackDamageBonus).toBeNull(); expect(stack.nextTurnAttackDamageBonusPending).toBeNull();
    g.player.switchPokemon(stack, g.store, g.state); const damage = g.opponent.active.damage;
    utilityAttack(g); expect(g.opponent.active.damage - damage).toBe(30);
  });
  for (const wantsSwitch of [false, true]) it(`Squawkabilly offers an optional opponent-chosen switch after damage (${wantsSwitch})`, () => {
    const card = new Happy6Squawkabilly(); const g = board(card); const oldActive = g.opponent.active;
    const effect = g.attack(); expect(g.state.prompts.length).toBe(0);
    g.store.reduceEffect(g.state, new DealDamageEffect(effect, effect.damage)); expect(oldActive.damage).toBe(20);
    g.store.reduceEffect(g.state, new AfterAttackEffect(g.player, g.opponent, card.attacks[0]));
    const confirm = first(g.store, ConfirmPrompt); expect(confirm.playerId).toBe(g.player.id);
    answer(g.store, confirm, wantsSwitch);
    if (wantsSwitch) {
      const choose = first(g.store, ChoosePokemonPrompt); expect(choose.playerId).toBe(g.opponent.id);
      answer(g.store, choose, [ownBench], g.opponent.id); expect(g.opponent.active).not.toBe(oldActive);
      expect(g.opponent.bench).toContain(oldActive);
    } else expect(g.opponent.active).toBe(oldActive);
  });
  it('Alcremie ex heals only the chosen own target by 30, once per turn, and resets next turn', () => {
    const card = new Happy6AlcremieEx(); const g = board(card); g.player.active.damage = 60; g.player.bench[0].damage = 50;
    g.power(); const prompt = first(g.store, ChoosePokemonPrompt); expect(prompt.options.allowCancel).toBe(false);
    answer(g.store, prompt, [ownBench]); expect(g.player.active.damage).toBe(60); expect(g.player.bench[0].damage).toBe(20);
    expect(() => g.power()).toThrow(new GameError(GameMessage.POWER_ALREADY_USED)); g.end(g.player); g.end(g.opponent);
    g.power(); answer(g.store, first(g.store, ChoosePokemonPrompt), [ownActive]); expect(g.player.active.damage).toBe(30);
  });
  it('Alcremie ex rejects an opponent healing target', () => {
    const g = board(new Happy6AlcremieEx()); g.opponent.bench[0].damage = 50; g.power();
    const prompt = first(g.store, ChoosePokemonPrompt); const decoded = prompt.decode([enemyBench], g.state)!;
    expect(() => g.store.dispatch(new ResolvePromptAction(prompt.id, decoded), 17)).toThrow(new GameError(GameMessage.INVALID_PROMPT_RESULT));
    expect(g.opponent.bench[0].damage).toBe(50);
  });
  it('two Alcremie ex each have their own once-per-turn use', () => {
    const g = board(new Happy6AlcremieEx()); const second = new Happy6AlcremieEx(); g.player.bench[0].cards = [second];
    g.player.active.damage = 80; g.power(); answer(g.store, first(g.store, ChoosePokemonPrompt), [ownActive]);
    g.store.reduceEffect(g.state, new PowerEffect(g.player, second.powers[0], second));
    answer(g.store, first(g.store, ChoosePokemonPrompt), [ownActive]); expect(g.player.active.damage).toBe(20);
  });
  for (const where of ['none', 'own-active', 'enemy-bench', 'empty-own-slot', 'own-bench']) it(`Koraidon ex damage condition checks occupied own bench (${where})`, () => {
    const g = board(new Happy6KoraidonEx());
    if (where === 'own-active') g.player.active.damage = 10;
    if (where === 'enemy-bench') g.opponent.bench[0].damage = 10;
    if (where === 'empty-own-slot') g.player.bench[1].damage = 10;
    if (where === 'own-bench') g.player.bench[0].damage = 10;
    expect(g.attack(1).damage).toBe(where === 'own-bench' ? 220 : 100);
  });
  it('Paldean Clodsire ex poisons and locks opponent retreat through their next turn only', () => {
    const g = board(new Happy6PaldeanClodsireEx()); utilityAttack(g, 0, () => {
      expect(g.opponent.active.specialConditions).toContain(SpecialCondition.POISONED);
      expect(g.opponent.active.cannotRetreatNextTurn).toBe(true);
    });
    expect(g.opponent.active.cannotRetreatNextTurn).toBe(true); passUtilityTurn(g);
    expect(g.opponent.active.cannotRetreatNextTurn).toBe(false);
  });
  it('Paldean Clodsire ex locks attacks on next own turn and clears on switching', () => {
    const g = board(new Happy6PaldeanClodsireEx()); expect(g.attack(1).damage).toBe(220);
    expect(g.player.active.cannotAttackNextTurn).toBe(false); expect(g.player.active.cannotAttackNextTurnPending).toBe(true);
    g.end(g.player); g.end(g.opponent); expect(g.player.active.cannotAttackNextTurn).toBe(true);
    const stack = g.player.active; g.player.switchPokemon(g.player.bench[0], g.store, g.state);
    expect(stack.cannotAttackNextTurn).toBe(false); expect(stack.cannotAttackNextTurnPending).toBe(false);
  });
  for (const [card, count] of [[new Happy6Sigilyph(), 2], [new Happy6Swellow(), 3]] as [PokemonCard, number][]) it(`${card.name} draws exactly ${count}`, () => {
    const g = board(card); utilityAttack(g); expect(g.player.hand.cards.length).toBe(count); expect(g.player.deck.cards.length).toBe(20 - count);
  });
  it('Beheeyem counts own active and occupied bench only', () => {
    const g = board(new Happy6Beheeyem()); g.player.bench[2].cards = [new Target()]; expect(g.attack().damage).toBe(60);
  });
  it('Sandslash deals ten damage to every occupied own bench slot only', () => {
    const g = board(new Happy6Sandslash()); g.player.bench[3].cards = [new Target()]; utilityAttack(g, 1);
    expect(g.player.bench.map(p => p.damage)).toEqual([10, 0, 0, 10, 0]); expect(g.player.active.damage).toBe(0);
    expect(g.opponent.bench[0].damage).toBe(0);
  });
  for (const heads of [false, true]) it(`Sigilyph paralysis and Meditite bonus depend on coin (${heads})`, () => {
    const g = board(new Happy6Sigilyph()); spyOn(Math, 'random').and.returnValue(heads ? 0.25 : 0.75); utilityAttack(g, 1);
    expect(g.opponent.active.specialConditions.includes(SpecialCondition.PARALYZED)).toBe(heads);
    const m = board(new Happy6Meditite()); const effect = withCoins(m.store, [heads], () => m.attack());
    expect(effect.damage).toBe(heads ? 30 : 10);
  });
  it('Sandshrew counts heads on exactly two flips', () => {
    const g = board(new Happy6Sandshrew());
    const effect = withCoins(g.store, [true, false], () => g.attack(1)); expect(effect.damage).toBe(20);
  });
  for (const heads of [false, true]) it(`Elgyem coin arms both native damage and effect protection (${heads})`, () => {
    const g = board(new Happy6Elgyem()); withCoins(g.store, [heads], () => g.attack());
    expect(g.player.active.preventDamageNextTurnPending !== null).toBe(heads);
    expect(g.player.active.preventEffectsOfAttacksNextTurnPending !== null).toBe(heads);
  });
});
