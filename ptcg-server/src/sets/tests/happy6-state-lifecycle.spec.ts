import { Store } from '../../game/store/store';
import { GameError } from '../../game/game-error';
import { GameMessage } from '../../game/game-message';
import { State, GamePhase } from '../../game/store/state/state';
import { Player } from '../../game/store/state/player';
import { CardList } from '../../game/store/state/card-list';
import { PokemonCardList } from '../../game/store/state/pokemon-card-list';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { EnergyCard } from '../../game/store/card/energy-card';
import { CardType, CardTag, EnergyType, SpecialCondition } from '../../game/store/card/card-types';
import { AttackEffect, HealEffect } from '../../game/store/effects/game-effects';
import { PutDamageEffect, PutCountersEffect } from '../../game/store/effects/attack-effects';
import { Effect } from '../../game/store/effects/effect';
import { StoreLike } from '../../game/store/store-like';
import { AttackAction, PassTurnAction, RetreatAction, RetreatStartAction, UseAbilityAction } from '../../game/store/actions/game-actions';
import { CardTarget, PlayerType, SlotType, PlayCardAction } from '../../game/store/actions/play-card-action';
import { ResolvePromptAction } from '../../game/store/actions/resolve-prompt-action';
import { Prompt } from '../../game/store/prompts/prompt';
import { WaitPrompt } from '../../game/store/prompts/wait-prompt';
import { ChoosePokemonPrompt } from '../../game/store/prompts/choose-pokemon-prompt';
import { ChooseEnergyPrompt } from '../../game/store/prompts/choose-energy-prompt';
import { ChoosePrizePrompt } from '../../game/store/prompts/choose-prize-prompt';
import { PutDamagePrompt } from '../../game/store/prompts/put-damage-prompt';
import { AttachEnergyPrompt } from '../../game/store/prompts/attach-energy-prompt';
import { CheckPokemonTypeEffect } from '../../game/store/effects/check-effects';
import { WAS_POKEMON_KNOCKED_OUT_DURING_OPPONENTS_LAST_TURN } from '../../game/store/prefabs/prefabs';
import { RetaliateDamageEffect } from '../../game/store/effects/effect-of-attack-effects';
import { Dragapultex } from '../10-scarlet-and-violet/set-twilight-masquerade/dragapult-ex';
import { MistEnergy } from '../10-scarlet-and-violet/set-temporal-forces/mist-energy';
import { ProfessorTurosScenario } from '../10-scarlet-and-violet/set-paradox-rift/professor-turos-scenario';
import { Switch } from '../10-scarlet-and-violet/set-scarlet-and-violet/switch';
import { Lucario } from '../10-scarlet-and-violet/set-scarlet-and-violet/lucario';
import { EthansPinsir } from '../10-scarlet-and-violet/set-destined-rivals/ethans-pinsir';
import { ExpShare } from '../10-scarlet-and-violet/set-scarlet-and-violet/exp-share';
import { Dusclops } from '../10-scarlet-and-violet/set-shrouded-fable/dusclops';
import { TeamRocketsArcher } from '../10-scarlet-and-violet/set-destined-rivals/team-rockets-archer';
import { Happy6AlcremieEx, Happy6AlolanMarowak, Happy6Elgyem, Happy6KoraidonEx,
  Happy6PaldeanClodsireEx, Happy6Skarmory } from '../10-scarlet-and-violet/set-happy-trainers/utility/cards';

class Target extends PokemonCard {
  public name = 'Lifecycle Target'; public fullName = 'Lifecycle Target TEST'; public set = 'TEST';
  public hp = 500; public cardType = [CardType.COLORLESS]; public retreat = [CardType.COLORLESS];
  constructor(hp = 500, type = CardType.COLORLESS, tags: CardTag[] = []) {
    super(); this.hp = hp; this.cardType = [type]; this._tags = tags;
  }
}
class TestEnergy extends EnergyCard {
  public name = 'Lifecycle Energy'; public fullName = 'Lifecycle Energy TEST'; public set = 'TEST';
  public energyType = EnergyType.BASIC;
  constructor(type = CardType.COLORLESS) { super(); this.provides = [type]; }
}
class ScriptedAttack extends Target {
  public attacks = [{ name: 'Lifecycle attack', cost: [], damage: 0, text: '' }];
  constructor(private run: (store: StoreLike, state: State, effect: AttackEffect) => void) { super(); }
  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.source.getPokemonCard() === this) this.run(store, state, effect);
    return state;
  }
}
function board(card: PokemonCard = new Target()) {
  const state = new State(); state.phase = GamePhase.PLAYER_TURN; state.turn = 5;
  state.players = [new Player(), new Player()]; state.players[0].id = 17; state.players[1].id = 29;
  for (const p of state.players) {
    p.active.cards = [new Target()]; p.bench = Array.from({ length: 5 }, () => new PokemonCardList());
    p.bench[0].cards = [new Target()];
    p.prizes = Array.from({ length: 6 }, () => { const pile = new CardList(); pile.cards = [new Target()]; return pile; });
    p.deck.cards = Array.from({ length: 30 }, () => new Target());
  }
  state.players[0].active.cards = [card];
  const store = new Store({ onStateChange() {} }, false); store.state = state;
  // Illegal Actions restore a cloned State. Always inspect the Store's current copy.
  return { store, get state() { return store.state; },
    get player() { return store.state.players[0]; }, get opponent() { return store.state.players[1]; } };
}
type Board = ReturnType<typeof board>;
const ownActive: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
const ownBench = (index = 0): CardTarget => ({ player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index });
const enemyBench = (index = 0): CardTarget => ({ player: PlayerType.TOP_PLAYER, slot: SlotType.BENCH, index });
function first<T extends Prompt<any>>(store: Store, ctor: new (...args: any[]) => T): T {
  const prompt = store.state.prompts.find(p => p instanceof ctor && p.result === undefined) as T;
  expect(prompt).toBeDefined(); return prompt;
}
function answer(store: Store, prompt: Prompt<any>, raw: unknown): void {
  const decoded = prompt.decode(raw, store.state);
  expect(prompt.validate(decoded, store.state)).toBe(true);
  store.dispatch(new ResolvePromptAction(prompt.id, decoded), prompt.playerId);
}
function settle(store: Store, onEnergy?: (prompt: AttachEnergyPrompt) => void): void {
  for (let i = 0; i < 30; i++) {
    const prompt = store.state.prompts.find(p => p.result === undefined);
    if (!prompt) return;
    if (prompt instanceof WaitPrompt) answer(store, prompt, null);
    else if (prompt instanceof ChoosePrizePrompt) answer(store, prompt, Array.from({ length: prompt.options.count }, (_, n) => n));
    else if (prompt instanceof ChoosePokemonPrompt) answer(store, prompt, [ownBench()]);
    else if (prompt instanceof AttachEnergyPrompt && onEnergy) onEnergy(prompt);
    else throw new Error('Unexpected prompt: ' + prompt.type);
  }
  throw new Error('Lifecycle prompt chain did not finish');
}
function attack(g: Board, index = 0): void {
  const owner = g.state.players[g.state.activePlayer];
  g.store.dispatch(new AttackAction(owner.id, owner.active.getPokemonCard()!.attacks[index].name), owner.id);
}
function pass(g: Board): void {
  const owner = g.state.players[g.state.activePlayer];
  g.store.dispatch(new PassTurnAction(owner.id), owner.id); settle(g.store);
}
function put(store: StoreLike, state: State, base: AttackEffect, target: PokemonCardList, damage: number, counters = false): void {
  const effect = counters ? new PutCountersEffect(base, damage) : new PutDamageEffect(base, damage);
  effect.target = target; store.reduceEffect(state, effect);
}
function attach(list: PokemonCardList, ...types: CardType[]): void { list.cards.push(...types.map(t => new TestEnergy(t))); }
function lockedClodsire(): Board {
  const g = board(new Happy6PaldeanClodsireEx());
  attach(g.player.active, CardType.DARK, CardType.DARK, CardType.WATER, CardType.FIRE);
  attack(g, 1); settle(g.store); pass(g);
  expect(g.player.active.cannotAttackNextTurn).toBe(true);
  return g;
}

describe('Happy6 state lifecycle: retreat actions are transactional', () => {
  for (const start of [false, true]) {
    it(`keeps Giga Impact locked and all payment untouched on ${start ? 'RetreatStartAction' : 'RetreatAction'} energy cancellation`, () => {
      const g = lockedClodsire(); const active = g.player.active; const cards = active.cards.slice();
      const retreated = g.player.retreatedTurn;
      if (start) {
        g.store.dispatch(new RetreatStartAction(17), 17);
        answer(g.store, first(g.store, ChoosePokemonPrompt), [ownBench()]);
      } else g.store.dispatch(new RetreatAction(17, 0), 17);
      expect(active.cannotAttackNextTurn).toBe(true);
      answer(g.store, first(g.store, ChooseEnergyPrompt), null);
      expect(g.player.active).toBe(active); expect(active.cards).toEqual(cards);
      expect(g.player.discard.cards.length).toBe(0); expect(g.player.retreatedTurn).toBe(retreated);
      expect(active.cannotAttackNextTurn).toBe(true); expect(() => attack(g, 1)).toThrow();
    });
    for (const invalid of ['insufficient', 'duplicate', 'foreign', 'missing']) {
      it(`rejects ${invalid} payment atomically on ${start ? 'RetreatStartAction' : 'RetreatAction'}`, () => {
        const g = lockedClodsire(); const active = g.player.active; const cards = active.cards.slice();
        const retreated = g.player.retreatedTurn;
        if (start) {
          g.store.dispatch(new RetreatStartAction(17), 17);
          answer(g.store, first(g.store, ChoosePokemonPrompt), [ownBench()]);
        } else g.store.dispatch(new RetreatAction(17, 0), 17);
        const prompt = first(g.store, ChooseEnergyPrompt);
        const decoded = prompt.decode(invalid === 'duplicate' ? [0, 0, 1] : invalid === 'missing' ? [0, 1, 99] : [0, 1, 2])!;
        if (invalid === 'insufficient') decoded.pop();
        if (invalid === 'foreign') decoded[2] = { card: new TestEnergy(CardType.WATER), provides: [CardType.WATER] };
        if (invalid === 'insufficient') expect(prompt.validate(decoded)).toBe(false);
        // Decode/validate alone cannot authenticate membership or reject duplicate cards.
        // Dispatch must still reject malicious results before moving ANY energy.
        expect(() => g.store.dispatch(new ResolvePromptAction(prompt.id, decoded), 17))
          .toThrow(new GameError(GameMessage.INVALID_PROMPT_RESULT));
        expect(g.player.active).toBe(active); expect(active.cards).toEqual(cards);
        expect(active.cannotAttackNextTurn).toBe(true); expect(g.player.discard.cards).toEqual([]);
        expect(g.player.retreatedTurn).toBe(retreated); expect(() => attack(g, 1)).toThrow();
      });
    }
    it(`clears the outgoing attack lock only on a committed ${start ? 'RetreatStartAction' : 'RetreatAction'}`, () => {
      const g = lockedClodsire(); const active = g.player.active;
      if (start) {
        g.store.dispatch(new RetreatStartAction(17), 17);
        answer(g.store, first(g.store, ChoosePokemonPrompt), [ownBench()]);
      } else g.store.dispatch(new RetreatAction(17, 0), 17);
      answer(g.store, first(g.store, ChooseEnergyPrompt), [0, 1, 2]);
      expect(g.player.active).not.toBe(active); expect(active.cannotAttackNextTurn).toBe(false);
      expect(g.player.discard.cards.length).toBe(3); expect(g.player.retreatedTurn).toBe(g.state.turn);
    });
  }
  it('bench cancellation with exactly sufficient energy does not discard or consume retreat', () => {
    const g = lockedClodsire(); const active = g.player.active;
    active.moveCardTo(active.cards[4], g.player.hand);
    const before = active.cards.slice(); const retreated = g.player.retreatedTurn;
    g.store.dispatch(new RetreatStartAction(17), 17);
    answer(g.store, first(g.store, ChoosePokemonPrompt), null);
    expect(active.cards).toEqual(before); expect(g.player.active).toBe(active);
    expect(active.cannotAttackNextTurn).toBe(true); expect(g.player.discard.cards.length).toBe(0);
    expect(g.player.retreatedTurn).toBe(retreated);
  });
  it('a cancelled retreat does not extend Giga Impact beyond its normal expiration', () => {
    const g = lockedClodsire(); g.store.dispatch(new RetreatAction(17, 0), 17);
    answer(g.store, first(g.store, ChooseEnergyPrompt), null); pass(g); pass(g);
    expect(g.player.active.cannotAttackNextTurn).toBe(false); expect(() => attack(g, 1)).not.toThrow(); settle(g.store);
  });
});

describe('Happy6 state lifecycle: self retreat targets the attacker', () => {
  for (const protection of ['Mist Energy', 'Elgyem']) it(`Roost is not stopped by the opponent's ${protection}`, () => {
    const g = board(new Happy6Skarmory()); attach(g.player.active, CardType.METAL); g.player.active.damage = 70;
    if (protection === 'Mist Energy') g.opponent.active.cards.push(new MistEnergy());
    else g.opponent.active.cards = [new Happy6Elgyem()];
    attack(g); settle(g.store);
    expect(g.player.active.damage).toBe(20); expect(g.player.active.cannotRetreatNextTurn).toBe(true);
    expect(g.opponent.active.cannotRetreatNextTurn).toBe(false);
    expect(['after Roost', g.state.activePlayer]).toEqual(['after Roost', 1]); pass(g);
    expect(['after opponent pass', g.state.activePlayer]).toEqual(['after opponent pass', 0]);
    expect(() => g.store.dispatch(new RetreatAction(17, 0), 17)).toThrow();
    pass(g); pass(g);
    expect(g.player.active.cannotRetreatNextTurn).toBe(false);
    expect(['after expiry passes', g.state.activePlayer]).toEqual(['after expiry passes', 0]);
    g.store.dispatch(new RetreatAction(17, 0), 17);
  });
  it('a real Switch clears Roost on the outgoing stack', () => {
    const g = board(new Happy6Skarmory()); attach(g.player.active, CardType.METAL); const active = g.player.active;
    attack(g); settle(g.store); pass(g); g.player.hand.cards = [new Switch()];
    g.store.dispatch(new PlayCardAction(17, 0, ownActive), 17);
    answer(g.store, first(g.store, ChoosePokemonPrompt), [ownBench()]);
    expect(g.player.active).not.toBe(active); expect(active.cannotRetreatNextTurn).toBe(false);
  });
});

describe('Happy6 state lifecycle: Alcremie usage belongs to the in-play instance', () => {
  function use(g: Board, target: CardTarget): void {
    g.store.dispatch(new UseAbilityAction(17, '甜点赠礼', target), 17);
    answer(g.store, first(g.store, WaitPrompt), null);
    answer(g.store, first(g.store, ChoosePokemonPrompt), [ownActive]);
  }
  it('two copies are independent, switching does not reset, and the next turn does', () => {
    const g = board(new Happy6AlcremieEx()); g.player.bench[0].cards = [new Happy6AlcremieEx()];
    g.player.active.damage = 120; use(g, ownActive); use(g, ownBench()); expect(g.player.active.damage).toBe(60);
    expect(() => use(g, ownActive)).toThrow(); g.player.hand.cards = [new Switch()];
    g.store.dispatch(new PlayCardAction(17, 0, ownActive), 17);
    answer(g.store, first(g.store, ChoosePokemonPrompt), [ownBench()]);
    expect(() => use(g, ownBench())).toThrow(); expect(() => use(g, ownActive)).toThrow();
    pass(g); pass(g); use(g, ownActive); use(g, ownBench());
  });
  it('Turo returns the used physical card; evolving another established Milcery can use it again this turn', () => {
    const g = board(); const alcremie = new Happy6AlcremieEx();
    const milcery1 = new Target(); milcery1.name = 'Milcery'; const milcery2 = new Target(); milcery2.name = 'Milcery';
    g.player.bench[0].cards = [milcery1, alcremie]; g.player.bench[1].cards = [milcery2];
    g.player.bench[1].pokemonPlayedTurn = 4; g.player.active.damage = 120;
    use(g, ownBench()); expect(g.player.active.damage).toBe(90);
    g.player.hand.cards = [new ProfessorTurosScenario()];
    g.store.dispatch(new PlayCardAction(17, 0, ownActive), 17);
    answer(g.store, first(g.store, ChoosePokemonPrompt), [ownBench()]);
    expect(g.player.hand.cards).toContain(alcremie); expect(g.player.bench[0].inPlayAbilityUses).toEqual([]);
    g.store.dispatch(new PlayCardAction(17, g.player.hand.cards.indexOf(alcremie), ownBench(1)), 17);
    expect(g.player.bench[1].getPokemonCard()).toBe(alcremie);
    use(g, ownBench(1)); expect(g.player.active.damage).toBe(60);
    expect(() => use(g, ownBench(1))).toThrow();
  });
});

describe('Happy6 state lifecycle: per-KO causality', () => {
  for (const directFirst of [false, true]) it(`keeps the first lethal cause on the same target (${directFirst})`, () => {
    const g = board(new ScriptedAttack((store, state, base) => {
      put(store, state, base, base.opponent.bench[0], 60, !directFirst);
      put(store, state, base, base.opponent.bench[0], 10, directFirst);
    }));
    g.opponent.bench[0].cards = [new Target(60)]; attack(g); settle(g.store);
    expect(g.opponent.knockoutEventsDuringOpponentsLastTurn.map(e => e.cause))
      .toEqual([directFirst ? 'attack-damage' : 'attack-effect']);
  });
  it('a real ability KO stays non-attack while Archer still tracks its Team Rocket victim', () => {
    const g = board(new Dusclops()); const archer = new TeamRocketsArcher();
    g.opponent.hand.cards = [archer]; g.opponent.bench[0].cards = [new Target(50, CardType.FIGHTING, [CardTag.TEAM_ROCKET])];
    g.store.dispatch(new UseAbilityAction(17, 'Cursed Blast', ownActive), 17);
    answer(g.store, first(g.store, WaitPrompt), null);
    answer(g.store, first(g.store, ChoosePokemonPrompt), [enemyBench()]); settle(g.store);
    expect(g.opponent.knockoutEventsDuringOpponentsLastTurn.map(e => e.cause)).toEqual(['other']);
    expect(WAS_POKEMON_KNOCKED_OUT_DURING_OPPONENTS_LAST_TURN(g.opponent, { byAttackDamage: true })).toBe(false);
    expect(g.opponent.marker.hasMarker(archer.ARCHER_MARKER, archer)).toBe(true);
  });
  it('Dragapult 200 does not turn Elgyem counter KO into attack damage', () => {
    const g = board(new Dragapultex()); attach(g.player.active, CardType.FIRE, CardType.PSYCHIC);
    g.opponent.active.cards = [new Happy6KoraidonEx()]; g.opponent.bench[0].cards = [new Happy6Elgyem()];
    attack(g, 1); answer(g.store, first(g.store, PutDamagePrompt), [{ target: enemyBench(), damage: 60 }]); settle(g.store);
    expect(g.opponent.active.damage).toBe(200); expect(g.opponent.pokemonKnockedOutDuringOpponentsLastTurn).toBe(true);
    expect(g.opponent.pokemonKnockedOutByAttackDuringOpponentsLastTurn).toBe(false);
    const events = g.opponent.knockoutEventsDuringOpponentsLastTurn;
    expect(events.length).toBe(1); expect(events[0].cause).toBe('attack-effect');
    expect(events[0].source!.name).toBe('Dragapult ex'); expect(events[0].turn).toBe(5);
    g.opponent.active.cards = [new Happy6AlolanMarowak()]; attach(g.opponent.active, CardType.PSYCHIC);
    attack(g); settle(g.store); expect(g.player.active.damage).toBe(30);
  });
  for (const fighting of [false, true]) it(`Lucario requires the KO'd Pokémon's effective Fighting type (${fighting})`, () => {
    const g = board(new ScriptedAttack((store, state, base) => put(store, state, base, base.opponent.bench[0], 60)));
    g.opponent.active.cards = [new Lucario()]; attach(g.opponent.active, CardType.FIGHTING);
    g.opponent.bench[0].cards = [new Target(60, fighting ? CardType.FIGHTING : CardType.FIRE)];
    attack(g); settle(g.store); attack(g); settle(g.store);
    expect(g.player.active.damage).toBe(fighting ? 150 : 30);
  });
  it('Lucario uses a type-changing effect at the KO, not the printed type', () => {
    const victim = new Target(60, CardType.FIRE);
    const change = spyOn(victim, 'reduceEffect').and.callFake((_store: StoreLike, state: State, effect: Effect) => {
      if (effect instanceof CheckPokemonTypeEffect && effect.target.getPokemonCard() === victim) effect.cardTypes = [CardType.FIGHTING];
      return state;
    });
    const g = board(new ScriptedAttack((store, state, base) => put(store, state, base, base.opponent.bench[0], 60)));
    g.opponent.active.cards = [new Lucario()]; attach(g.opponent.active, CardType.FIGHTING); g.opponent.bench[0].cards = [victim];
    attack(g); settle(g.store); expect(change).toHaveBeenCalled(); attack(g); settle(g.store); expect(g.player.active.damage).toBe(150);
  });
  for (const taggedDamage of [false, true]) it(`Pinsir matches tags and direct damage within ONE event (${taggedDamage})`, () => {
    const g = board(new ScriptedAttack((store, state, base) => {
      put(store, state, base, base.opponent.bench[0], 60);
      put(store, state, base, base.opponent.bench[1], 60, true);
    }));
    g.opponent.active.cards = [new EthansPinsir()]; attach(g.opponent.active, CardType.GRASS, CardType.GRASS, CardType.GRASS);
    g.opponent.bench[0].cards = [new Target(60, CardType.FIRE, taggedDamage ? [CardTag.ETHANS] : [])];
    g.opponent.bench[1].cards = [new Target(60, CardType.FIGHTING, taggedDamage ? [] : [CardTag.ETHANS])];
    attack(g); settle(g.store);
    expect(g.opponent.knockoutEventsDuringOpponentsLastTurn.map(e => e.cause)).toEqual(['attack-damage', 'attack-effect']);
    expect(WAS_POKEMON_KNOCKED_OUT_DURING_OPPONENTS_LAST_TURN(g.opponent)).toBe(true);
    expect(WAS_POKEMON_KNOCKED_OUT_DURING_OPPONENTS_LAST_TURN(g.opponent, { byAttackDamage: true })).toBe(true);
    expect(WAS_POKEMON_KNOCKED_OUT_DURING_OPPONENTS_LAST_TURN(g.opponent, { byAttackDamage: true, types: [CardType.FIGHTING] })).toBe(false);
    attack(g, 1); settle(g.store); expect(g.player.active.damage).toBe(taggedDamage ? 170 : 70);
  });
  it('records both legal direct PutDamage bench KOs, without losing the second event', () => {
    const g = board(new ScriptedAttack((store, state, base) => {
      put(store, state, base, base.opponent.bench[0], 60); put(store, state, base, base.opponent.bench[1], 60);
    }));
    g.opponent.bench[0].cards = [new Target(60)]; g.opponent.bench[1].cards = [new Target(60, CardType.FIGHTING, [CardTag.ETHANS])];
    attack(g); settle(g.store);
    expect(g.opponent.knockoutEventsDuringOpponentsLastTurn.map(e => e.cause)).toEqual(['attack-damage', 'attack-damage']);
    expect(WAS_POKEMON_KNOCKED_OUT_DURING_OPPONENTS_LAST_TURN(g.opponent, { byAttackDamage: true, tags: [CardTag.ETHANS], types: [CardType.FIGHTING] })).toBe(true);
    pass(g); expect(g.opponent.knockoutEventsDuringOpponentsLastTurn).toEqual([]);
  });
  for (const cause of ['counters', 'poison', 'retaliation', 'self-damage', 'heal-then-counters', 'survive-then-counters']) {
    it(`never infers an attack-damage KO from unrelated earlier damage: ${cause}`, () => {
      const g = board(new ScriptedAttack((store, state, base) => {
        put(store, state, base, base.opponent.active, 10);
        const victim = base.opponent.bench[0];
        if (cause === 'poison') {
          base.opponent.active.damage = 490; base.opponent.active.specialConditions = [SpecialCondition.POISONED];
        }
        else if (cause === 'retaliation') {
          const counter = new RetaliateDamageEffect(base, 60); counter.target = victim; store.reduceEffect(state, counter);
        } else if (cause === 'self-damage') {
          const self = new AttackEffect(base.opponent, base.player, base.attack); self.source = victim;
          put(store, state, self, victim, 60);
        } else {
          if (cause === 'heal-then-counters') {
            put(store, state, base, victim, 60); store.reduceEffect(state, new HealEffect(base.opponent, victim, 60));
          }
          if (cause === 'survive-then-counters') {
            victim.surviveOnTenHpNextTurn = {}; put(store, state, base, victim, 70);
            expect(victim.damage).toBe(50);
          }
          put(store, state, base, victim, cause === 'survive-then-counters' ? 10 : 60, true);
        }
      }));
      g.opponent.bench[0].cards = [new Target(60, CardType.FIGHTING, [CardTag.ETHANS])];
      attack(g); settle(g.store);
      expect(g.opponent.pokemonKnockedOutByAttackDuringOpponentsLastTurn).toBe(false);
      expect(WAS_POKEMON_KNOCKED_OUT_DURING_OPPONENTS_LAST_TURN(g.opponent, { byAttackDamage: true, tags: [CardTag.ETHANS] })).toBe(false);
      expect(g.opponent.discard.cards.some(c => c instanceof PokemonCard && c.hp === (cause === 'poison' ? 500 : 60))).toBe(true);
    });
  }
  for (const direct of [false, true]) it(`Exp. Share only offers transfer for an actual direct damage KO (${direct})`, () => {
    const g = board(new ScriptedAttack((store, state, base) => {
      put(store, state, base, base.opponent.bench[1], 10);
      put(store, state, base, base.opponent.active, 60, !direct);
    }));
    const energy = new TestEnergy(CardType.FIRE); g.opponent.active.cards = [new Target(60), energy];
    g.opponent.bench[1].cards = [new Target()]; g.opponent.bench[0].tools = [new ExpShare()];
    let offered = 0; attack(g); settle(g.store, prompt => {
      offered++; answer(g.store, prompt, [{ to: ownBench(), index: 1 }]);
    });
    expect(offered).toBe(direct ? 1 : 0);
    const recipient = [g.opponent.active, ...g.opponent.bench].find(p => p.tools.some(t => t instanceof ExpShare))!;
    expect(recipient.cards.includes(energy)).toBe(direct); expect(g.opponent.discard.cards.includes(energy)).toBe(!direct);
  });
});
