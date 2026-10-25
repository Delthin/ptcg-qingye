import { Store } from '../../game/store/store';
import { State, GamePhase } from '../../game/store/state/state';
import { Player } from '../../game/store/state/player';
import { Card } from '../../game/store/card/card';
import { CardList } from '../../game/store/state/card-list';
import { PokemonCardList } from '../../game/store/state/pokemon-card-list';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { EnergyCard } from '../../game/store/card/energy-card';
import { CardType, EnergyType, Stage, SuperType } from '../../game/store/card/card-types';
import { AttackAction, PassTurnAction } from '../../game/store/actions/game-actions';
import { ResolvePromptAction } from '../../game/store/actions/resolve-prompt-action';
import { PlayerType, SlotType } from '../../game/store/actions/play-card-action';
import { Prompt } from '../../game/store/prompts/prompt';
import { WaitPrompt } from '../../game/store/prompts/wait-prompt';
import { ChooseCardsPrompt } from '../../game/store/prompts/choose-cards-prompt';
import { ChoosePokemonPrompt } from '../../game/store/prompts/choose-pokemon-prompt';
import { ShuffleDeckPrompt } from '../../game/store/prompts/shuffle-prompt';
import { GameError } from '../../game/game-error';
import { CoinFlipEffect } from '../../game/store/effects/play-card-effects';
import { Effect } from '../../game/store/effects/effect';
import { GameMessage } from '../../game/game-message';
import { HappyTrainersElements } from '../10-scarlet-and-violet/set-happy-trainers/elements';
import { PinecoHappy6 } from '../10-scarlet-and-violet/set-happy-trainers/elements/pineco';
import { BreloomHappy6 } from '../10-scarlet-and-violet/set-happy-trainers/elements/breloom';
import { VirizionHappy6 } from '../10-scarlet-and-violet/set-happy-trainers/elements/virizion';
import { LurantisHappy6 } from '../10-scarlet-and-violet/set-happy-trainers/elements/lurantis';
import { SimisearHappy6 } from '../10-scarlet-and-violet/set-happy-trainers/elements/simisear';
import { DarumakaHappy6 } from '../10-scarlet-and-violet/set-happy-trainers/elements/darumaka';
import { DarmanitanHappy6 } from '../10-scarlet-and-violet/set-happy-trainers/elements/darmanitan';
import { TurtonatorHappy6 } from '../10-scarlet-and-violet/set-happy-trainers/elements/turtonator';
import { JynxHappy6 } from '../10-scarlet-and-violet/set-happy-trainers/elements/jynx';
import { FloatzelHappy6 } from '../10-scarlet-and-violet/set-happy-trainers/elements/floatzel';
import { ArrokudaHappy6 } from '../10-scarlet-and-violet/set-happy-trainers/elements/arrokuda';
import { BarraskewdaHappy6 } from '../10-scarlet-and-violet/set-happy-trainers/elements/barraskewda';
import { TogedemaruHappy6 } from '../10-scarlet-and-violet/set-happy-trainers/elements/togedemaru';

class Happy6Target extends PokemonCard {
  public name = 'Happy6 Target'; public fullName = 'Happy6 Target TEST'; public set = 'TEST';
  public hp = 1000; public weakness = []; public resistance = [];
}
class Happy6Energy extends EnergyCard {
  public name = 'Test Energy'; public fullName = 'Test Energy TEST'; public set = 'TEST';
  constructor(type = CardType.GRASS, special = false) {
    super(); this.provides = [type]; this.energyType = special ? EnergyType.SPECIAL : EnergyType.BASIC;
  }
}
let nextId: number;
function identified<T extends Card>(card: T): T { card.id = nextId++; return card; }
function board<T extends PokemonCard>(card: T, attackingIndex = 0) {
  nextId = 1000;
  const state = new State(); state.phase = GamePhase.PLAYER_TURN; state.turn = 5; state.activePlayer = attackingIndex;
  state.players = [new Player(), new Player()];
  for (const [i, player] of state.players.entries()) {
    player.id = i === 0 ? 17 : 29; player.active.cards = [identified(new Happy6Target())];
    player.bench = Array.from({ length: 5 }, () => new PokemonCardList());
    player.bench[0].cards = [identified(new Happy6Target())];
    player.deck.cards = Array.from({ length: 10 }, () => identified(new Happy6Target()));
    player.prizes = Array.from({ length: 6 }, () => {
      const prize = new CardList(); prize.cards = [identified(new Happy6Target())]; return prize;
    });
  }
  const player = state.players[attackingIndex], opponent = state.players[1 - attackingIndex];
  const largestCost = card.attacks.reduce((cost, attack) => attack.cost.length >= cost.length ? attack.cost : cost, card.attacks[0].cost);
  player.active.cards = [identified(card), ...largestCost.map(type => identified(new Happy6Energy(type)))];
  const store = new Store({ onStateChange() {} }, false); store.state = state;
  return { store, state, player, opponent, card };
}
type Board = ReturnType<typeof board>;
function finish(g: Board, answer?: (prompt: Prompt<unknown>) => unknown): void {
  for (let steps = 0; g.store.hasPrompts() && steps < 30; steps++) {
    const prompt = g.state.prompts.find(p => p.result === undefined);
    if (!prompt) throw new Error('No pending prompt');
    let raw: unknown;
    if (prompt instanceof WaitPrompt) raw = true;
    else if (prompt instanceof ShuffleDeckPrompt) {
      const owner = g.state.players.find(p => p.id === prompt.playerId);
      if (!owner) throw new Error('Shuffle owner missing');
      raw = owner.deck.cards.map((_, index) => index);
    } else if (answer) raw = answer(prompt);
    else throw new Error('Unexpected prompt: ' + prompt.type);
    const response: Prompt<unknown> = prompt;
    const decoded = response.decode(raw, g.state);
    expect(response.validate(decoded, g.state)).toBe(true);
    g.store.dispatch(new ResolvePromptAction(prompt.id, decoded), prompt.playerId);
  }
  expect(g.store.hasPrompts()).toBe(false);
}
function attack(g: Board, index: number, answer?: (prompt: Prompt<unknown>) => unknown): void {
  g.store.dispatch(new AttackAction(g.player.id, g.card.attacks[index].name));
  finish(g, answer);
}
function indexes(prompt: Prompt<unknown>, cards: Card[]): number[] {
  if (!(prompt instanceof ChooseCardsPrompt)) throw new Error('Expected card selection: ' + prompt.type);
  return cards.map(card => prompt.cards.cards.indexOf(card));
}
function scriptedCoins(g: Board, results: boolean[]): () => number {
  const reduce = g.store.reduceEffect.bind(g.store);
  let count = 0;
  spyOn(g.store, 'reduceEffect').and.callFake((state: State, effect: Effect): State => {
    if (!(effect instanceof CoinFlipEffect)) return reduce(state, effect);
    if (count >= results.length) throw new Error('Unexpected extra coin flip');
    const result = results[count++]; effect.result = result;
    return g.store.prompt(state, new WaitPrompt(effect.player.id, 0, 'Scripted coin flip'), () => {
      if (effect.callback) effect.callback(result);
    });
  });
  return () => count;
}
function firstEnergy(prompt: Prompt<unknown>): number[] {
  if (!(prompt instanceof ChooseCardsPrompt)) throw new Error('Expected energy selection: ' + prompt.type);
  return [prompt.cards.cards.findIndex(card => card.superType === SuperType.ENERGY)];
}

describe('Happy6 elements (CSVH6eC 001–019, excluding existing 008/018)', () => {
  it('exports exactly the 17 listed cards, with the source HP, retreat and evolution chains', () => {
    const expected = [
      ['001', 'Pineco', 70, 2, ''], ['002', 'Shroomish', 60, 1, ''],
      ['003', 'Breloom', 120, 2, 'Shroomish'], ['004', 'Virizion', 120, 1, ''],
      ['005', 'Fomantis', 60, 1, ''], ['006', 'Lurantis', 120, 1, 'Fomantis'],
      ['007', 'Nymble', 50, 1, ''], ['009', 'Simisear', 90, 1, 'Pansear'],
      ['010', 'Darumaka', 80, 2, ''], ['011', 'Darmanitan', 140, 3, 'Darumaka'],
      ['012', 'Turtonator', 120, 2, ''], ['013', 'Jynx', 90, 1, ''],
      ['014', 'Buizel', 70, 1, ''], ['015', 'Floatzel', 120, 1, 'Buizel'],
      ['016', 'Arrokuda', 70, 1, ''], ['017', 'Barraskewda', 130, 1, 'Arrokuda'],
      ['019', 'Togedemaru', 80, 1, '']
    ];
    expect(HappyTrainersElements.length).toBe(17);
    expect(HappyTrainersElements.map(card => {
      if (!(card instanceof PokemonCard)) throw new Error('Expected PokemonCard');
      expect(card.set).toBe('CSVH6eC'); expect(card.fullName).toBe(card.name + ' CSVH6eC');
      expect(card.resistance).toEqual([]);
      expect(card.stage).toBe(card.evolvesFrom ? Stage.STAGE_1 : Stage.BASIC);
      return [card.setNumber, card.name, card.hp, card.retreat.length, card.evolvesFrom];
    })).toEqual(expected);
  });

  it('Lurantis discards exactly two basic Grass from hand, rejecting other and special energy', () => {
    const g = board(new LurantisHappy6());
    const grass = [identified(new Happy6Energy()), identified(new Happy6Energy())];
    const water = identified(new Happy6Energy(CardType.WATER));
    const special = identified(new Happy6Energy(CardType.GRASS, true));
    g.player.hand.cards = [grass[0], water, grass[1], special];
    attack(g, 1, prompt => {
      if (!(prompt instanceof ChooseCardsPrompt)) throw new Error('Expected discard prompt');
      expect(prompt.validate([grass[0]])).toBe(false);
      expect(prompt.validate([grass[0], water])).toBe(false);
      expect(prompt.validate([grass[0], special])).toBe(false);
      expect(prompt.options.allowCancel).toBe(false);
      return indexes(prompt, grass);
    });
    expect(g.opponent.active.damage).toBe(130);
    expect(g.player.discard.cards).toEqual(grass);
    expect(g.player.hand.cards).toEqual([water, special]);
    expect(g.player.active.cards.filter(card => card.superType === SuperType.ENERGY).length).toBe(1);
  });
  for (const count of [0, 1]) it(`Lurantis fails with only ${count} basic Grass in hand`, () => {
    const g = board(new LurantisHappy6());
    const hand = [...Array.from({ length: count }, () => identified(new Happy6Energy())),
      identified(new Happy6Energy(CardType.GRASS, true)), identified(new Happy6Energy(CardType.WATER))];
    g.player.hand.cards = hand.slice(); attack(g, 1);
    expect(g.opponent.active.damage).toBe(0); expect(g.player.hand.cards).toEqual(hand);
    expect(g.player.discard.cards.length).toBe(0);
  });
  it('Lurantis cannot pay twice with the same physical card', () => {
    const g = board(new LurantisHappy6());
    const grass = [identified(new Happy6Energy()), identified(new Happy6Energy())];
    g.player.hand.cards = grass.slice();
    expect(() => attack(g, 1, prompt => indexes(prompt, [grass[0], grass[0]])))
      .toThrow(new GameError(GameMessage.INVALID_PROMPT_RESULT));
    expect(g.opponent.active.damage).toBe(0); expect(g.player.hand.cards).toEqual(grass);
    expect(g.player.discard.cards.length).toBe(0);
  });

  for (const attackingIndex of [0, 1]) it(`Jynx benches a Basic and transfers only to that new instance, player ${attackingIndex}`, () => {
    const g = board(new JynxHappy6(), attackingIndex);
    const previous = identified(new PinecoHappy6()), summoned = identified(new PinecoHappy6());
    const evolution = identified(new BreloomHappy6());
    g.player.bench[0].cards = [previous]; g.player.deck.cards = [evolution, summoned];
    const energy = g.player.active.cards[1]; let choices = 0;
    attack(g, 0, prompt => {
      choices++;
      if (choices === 1) {
        if (!(prompt instanceof ChooseCardsPrompt)) throw new Error('Expected deck search');
        expect(prompt.validate([evolution])).toBe(false);
        return indexes(prompt, [summoned]);
      }
      return indexes(prompt, [energy]);
    });
    expect(choices).toBe(2);
    expect(g.player.bench[1].getPokemonCard()).toBe(summoned);
    expect(g.player.bench[1].pokemonPlayedTurn).toBe(5);
    expect(g.player.bench[1].cards.includes(energy)).toBe(true);
    expect(g.player.bench[0].cards).toEqual([previous]);
    expect(g.player.active.cards.includes(energy)).toBe(false);
    expect(g.player.deck.cards).toEqual([evolution]);
  });
  it('Jynx permits hidden-deck search failure, shuffles, and leaves its energy attached', () => {
    const g = board(new JynxHappy6()); const attached = g.player.active.cards.slice();
    let choices = 0;
    attack(g, 0, prompt => { choices++; return indexes(prompt, []); });
    expect(choices).toBe(1); expect(g.player.active.cards).toEqual(attached);
    expect(g.player.bench[1].cards.length).toBe(0);
    expect(g.state.prompts.some(prompt => prompt instanceof ShuffleDeckPrompt)).toBe(true);
  });
  it('Jynx with a full Bench neither searches nor transfers energy', () => {
    const g = board(new JynxHappy6()); const attached = g.player.active.cards.slice();
    g.player.bench.forEach(slot => { slot.cards = [identified(new PinecoHappy6())]; });
    attack(g, 0); expect(g.player.active.cards).toEqual(attached);
    expect(g.state.prompts.some(prompt => prompt instanceof ChooseCardsPrompt)).toBe(false);
  });

  it('Floatzel discards the selected opponent Energy and retains its own energy', () => {
    const g = board(new FloatzelHappy6());
    const energy = identified(new Happy6Energy(CardType.WATER, true));
    const retained = identified(new Happy6Energy(CardType.FIRE));
    g.opponent.active.cards.push(energy, retained); const own = g.player.active.cards.slice();
    attack(g, 0, prompt => indexes(prompt, [energy]));
    expect(g.opponent.active.damage).toBe(30);
    expect(g.opponent.discard.cards).toEqual([energy]);
    expect(g.opponent.active.cards.includes(retained)).toBe(true); expect(g.player.active.cards).toEqual(own);
  });
  it('Floatzel still deals damage when the opponent has no attached energy', () => {
    const g = board(new FloatzelHappy6()); attack(g, 0); expect(g.opponent.active.damage).toBe(30);
  });
  it('Floatzel locks both its attacks next own turn, not the opponent, then expires', () => {
    const g = board(new FloatzelHappy6()); attack(g, 1);
    expect(g.opponent.active.damage).toBe(140); expect(g.player.active.cannotAttackNextTurn).toBe(true);
    expect(g.opponent.active.cannotAttackNextTurn).toBe(false);
    g.store.dispatch(new PassTurnAction(g.opponent.id)); finish(g);
    for (const move of g.card.attacks) {
      expect(() => g.store.dispatch(new AttackAction(g.player.id, move.name)))
        .toThrow(new GameError(GameMessage.BLOCKED_BY_EFFECT));
    }
    // Store rolls back rejected actions to a cloned state; keep board references current.
    const playerId = g.player.id;
    g.state = g.store.state;
    g.player = g.state.players.find(player => player.id === playerId)!;
    g.opponent = g.state.players.find(player => player.id !== playerId)!;
    g.store.dispatch(new PassTurnAction(g.player.id)); finish(g);
    g.store.dispatch(new PassTurnAction(g.opponent.id)); finish(g);
    expect(g.player.active.cannotAttackNextTurn).toBe(false);
    attack(g, 0); expect(g.opponent.active.damage).toBe(170);
  });

  for (const create of [() => new BarraskewdaHappy6(), () => new TogedemaruHappy6()]) {
    for (const heads of [true, false]) it(`${create().name} ${heads ? 'heads blocks' : 'tails permits'} next-turn damage AND energy discard, then expires`, () => {
      const g = board(create()); scriptedCoins(g, [heads]);
      const rival = identified(new FloatzelHappy6());
      g.opponent.active.cards = [rival, identified(new Happy6Energy(CardType.WATER)),
        identified(new Happy6Energy()), identified(new Happy6Energy())];
      attack(g, g.card instanceof BarraskewdaHappy6 ? 1 : 0);
      // Floatzel is Lightning-weak, so Togedemaru's printed 40 becomes 80.
      expect(g.opponent.active.damage).toBe(g.card instanceof BarraskewdaHappy6 ? 60 : 80);
      const attachedCount = g.player.active.cards.length;
      g.store.dispatch(new AttackAction(g.opponent.id, rival.attacks[0].name)); finish(g, firstEnergy);
      expect(g.player.active.damage).toBe(heads ? 0 : 30);
      expect(g.player.active.cards.length).toBe(attachedCount - (heads ? 0 : 1));
      expect(g.player.discard.cards.length).toBe(heads ? 0 : 1);
      if (heads) {
        g.store.dispatch(new PassTurnAction(g.player.id)); finish(g);
        g.store.dispatch(new AttackAction(g.opponent.id, rival.attacks[0].name)); finish(g, firstEnergy);
        expect(g.player.active.damage).toBe(30);
        expect(g.player.active.cards.length).toBe(attachedCount - 1);
      }
    });
  }

  for (const test of [
    { card: new DarumakaHappy6(), index: 1, damage: 50, recoil: 20 },
    { card: new DarmanitanHappy6(), index: 1, damage: 210, recoil: 70 },
    { card: new ArrokudaHappy6(), index: 0, damage: 30, recoil: 10 }
  ]) it(`${test.card.name} deals its printed damage and recoil`, () => {
    const g = board(test.card);
    attack(g, test.index); expect(g.opponent.active.damage).toBe(test.damage);
    expect(g.player.active.damage).toBe(test.recoil);
  });
  for (const test of [
    { heads: [false], damage: 30 }, { heads: [true, true, false], damage: 130 }
  ]) it(`Breloom stops at tails and deals ${test.damage}`, () => {
    const g = board(new BreloomHappy6());
    const flips = scriptedCoins(g, test.heads);
    attack(g, 0); expect(g.opponent.active.damage).toBe(test.damage);
    expect(flips()).toBe(test.heads.length);
  });
  for (const test of [
    { heads: [false, false], damage: 0 }, { heads: [true, false], damage: 70 }, { heads: [true, true], damage: 140 }
  ]) it(`Simisear counts both coins for ${test.damage} damage`, () => {
    const g = board(new SimisearHappy6());
    const flips = scriptedCoins(g, test.heads);
    attack(g, 0); expect(g.opponent.active.damage).toBe(test.damage); expect(flips()).toBe(2);
  });
  for (const create of [() => new BreloomHappy6(), () => new VirizionHappy6()]) {
    for (const damage of [20, 50]) it(`${create().name} heals up to 30 damage from itself (${damage} damage)`, () => {
      const g = board(create()); g.player.active.damage = damage;
      attack(g, g.card instanceof BreloomHappy6 ? 1 : 0);
      expect(g.player.active.damage).toBe(Math.max(0, damage - 30));
      expect(g.opponent.active.damage).toBe(g.card instanceof BreloomHappy6 ? 90 : 30);
    });
  }
  for (const attackingIndex of [0, 1]) it(`Turtonator deals 40 only to the selected Bench without weakness/resistance, player ${attackingIndex}`, () => {
    const g = board(new TurtonatorHappy6(), attackingIndex);
    const target = g.opponent.bench[0].getPokemonCard();
    if (!target) throw new Error('Missing Bench target');
    target.weakness = [{ type: CardType.FIRE }]; target.resistance = [{ type: CardType.FIRE, value: -30 }];
    g.opponent.bench[1].cards = [identified(new Happy6Target())];
    attack(g, 0, prompt => {
      if (!(prompt instanceof ChoosePokemonPrompt)) throw new Error('Expected Bench damage selection');
      expect(prompt.slots).toEqual([SlotType.BENCH]);
      return [{ player: PlayerType.TOP_PLAYER, slot: SlotType.BENCH, index: 0 }];
    });
    expect(g.opponent.active.damage).toBe(0); expect(g.opponent.bench[0].damage).toBe(40);
    expect(g.opponent.bench[1].damage).toBe(0);
  });
  it('Turtonator with no opposing Bench ends without a dead-end selection', () => {
    const g = board(new TurtonatorHappy6()); g.opponent.bench[0].cards = [];
    attack(g, 0); expect(g.opponent.active.damage).toBe(0);
  });
});
