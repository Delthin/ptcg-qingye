import { Store } from '../../game/store/store';
import { State, GamePhase } from '../../game/store/state/state';
import { Player } from '../../game/store/state/player';
import { Card } from '../../game/store/card/card';
import { CardList } from '../../game/store/state/card-list';
import { PokemonCardList } from '../../game/store/state/pokemon-card-list';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { EnergyCard } from '../../game/store/card/energy-card';
import { TrainerCard } from '../../game/store/card/trainer-card';
import { CardTag, CardType, EnergyType, SpecialCondition } from '../../game/store/card/card-types';
import { AttackAction } from '../../game/store/actions/game-actions';
import { PlayCardAction, CardTarget, PlayerType, SlotType } from '../../game/store/actions/play-card-action';
import { ResolvePromptAction } from '../../game/store/actions/resolve-prompt-action';
import { PowerEffect } from '../../game/store/effects/game-effects';
import { EndTurnEffect } from '../../game/store/effects/game-phase-effects';
import { AddSpecialConditionsEffect } from '../../game/store/effects/attack-effects';
import { CoinFlipEffect } from '../../game/store/effects/play-card-effects';
import { Effect } from '../../game/store/effects/effect';
import { Prompt } from '../../game/store/prompts/prompt';
import { WaitPrompt } from '../../game/store/prompts/wait-prompt';
import { ChooseCardsPrompt } from '../../game/store/prompts/choose-cards-prompt';
import { ChoosePokemonPrompt } from '../../game/store/prompts/choose-pokemon-prompt';
import { ShuffleDeckPrompt } from '../../game/store/prompts/shuffle-prompt';
import { ShowCardsPrompt } from '../../game/store/prompts/show-cards-prompt';
import { AttachEnergyPrompt } from '../../game/store/prompts/attach-energy-prompt';
import { DiscardEnergyPrompt } from '../../game/store/prompts/discard-energy-prompt';
import { GameError } from '../../game/game-error';
import { GameMessage } from '../../game/game-message';
import { MistysStaryu } from '../10-scarlet-and-violet/set-destined-rivals/mistys-staryu';
import { EthansQuilava } from '../10-scarlet-and-violet/set-destined-rivals/ethans-quilava';
import { TeamRocketsRattata } from '../10-scarlet-and-violet/set-destined-rivals/team-rockets-rattata-dri';
import { TeamRocketsRaticate } from '../10-scarlet-and-violet/set-destined-rivals/team-rockets-raticate-dri';
import { TeamRocketsMurkrow } from '../10-scarlet-and-violet/set-destined-rivals/team-rockets-murkrow';
import { TeamRocketsMewtwoex } from '../10-scarlet-and-violet/set-destined-rivals/team-rockets-mewtwo-ex';
import { TeamRocketsEnergy } from '../10-scarlet-and-violet/set-destined-rivals/team-rockets-energy';
import { TeamRocketsArcher } from '../10-scarlet-and-violet/set-destined-rivals/team-rockets-archer';
import { TeamRocketsGreatBall } from '../10-scarlet-and-violet/set-destined-rivals/team-rockets-great-ball';
import { TeamRocketsGiovanni } from '../10-scarlet-and-violet/set-destined-rivals/team-rockets-giovanni';
import { EthansAdventure } from '../10-scarlet-and-violet/set-destined-rivals/ethans-adventure';
import { SacredAsh } from '../10-scarlet-and-violet/set-destined-rivals/sacred-ash';
import { EnergySticker } from '../10-scarlet-and-violet/set-pokemon-151/energy-sticker';
import { MistEnergy } from '../10-scarlet-and-violet/set-temporal-forces/mist-energy';

class Target extends PokemonCard {
  public name = 'Prebuilt Target'; public fullName = 'Prebuilt Target TEST'; public set = 'TEST';
  public hp = 1000; public weakness = []; public resistance = [];
}
class BasicEnergy extends EnergyCard {
  public name = 'Fire Energy'; public fullName = 'Fire Energy TEST'; public set = 'TEST';
  public energyType = EnergyType.BASIC;
  constructor(type = CardType.FIRE) { super(); this.provides = [type]; }
}
let nextId: number;
function id<T extends Card>(card: T): T { card.id = nextId++; return card; }
const active: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
const bench: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 };
function board(card: PokemonCard = new Target(), actingIndex = 0) {
  nextId = 1000;
  const state = new State(); state.phase = GamePhase.PLAYER_TURN; state.turn = 5; state.activePlayer = actingIndex;
  state.players = [new Player(), new Player()];
  for (const [index, player] of state.players.entries()) {
    player.id = index === 0 ? 17 : 29;
    player.active.cards = [id(new Target())];
    player.bench = Array.from({ length: 5 }, () => new PokemonCardList());
    player.bench[0].cards = [id(new Target())];
    player.deck.cards = Array.from({ length: 10 }, () => id(new Target()));
    player.prizes = Array.from({ length: 6 }, () => {
      const prize = new CardList(); prize.cards = [id(new Target())]; return prize;
    });
  }
  const player = state.players[actingIndex], opponent = state.players[1 - actingIndex];
  const cost = card.attacks[0]?.cost || [];
  player.active.cards = [id(card), ...cost.map(type => id(new BasicEnergy(type)))];
  const store = new Store({ onStateChange() {} }, false); store.state = state;
  return { state, store, player, opponent, card };
}
type Board = ReturnType<typeof board>;
function pending(g: Board): Prompt<unknown> {
  const prompt = g.state.prompts.find(p => p.result === undefined);
  if (!prompt) throw new Error('Missing pending prompt');
  return prompt;
}
function answer(g: Board, prompt: Prompt<unknown>, raw: unknown): void {
  const decoded = prompt.decode(raw, g.state);
  if (!prompt.validate(decoded, g.state)) throw new Error('Invalid test answer: ' + prompt.type);
  g.store.dispatch(new ResolvePromptAction(prompt.id, decoded), prompt.playerId);
}
function finish(g: Board, choose?: (prompt: Prompt<unknown>) => unknown): void {
  for (let steps = 0; g.store.hasPrompts() && steps < 50; steps++) {
    const prompt = pending(g);
    if (prompt instanceof WaitPrompt) answer(g, prompt, true);
    else if (prompt instanceof ShuffleDeckPrompt) {
      const owner = g.state.players.find(p => p.id === prompt.playerId)!;
      answer(g, prompt, owner.deck.cards.map((_, index) => index).reverse());
    } else if (prompt instanceof ShowCardsPrompt) answer(g, prompt, true);
    else if (choose) answer(g, prompt, choose(prompt));
    else throw new Error('Unexpected prompt: ' + prompt.type);
  }
  expect(g.store.hasPrompts()).toBe(false);
}
function play(g: Board, card: TrainerCard | EnergyCard, target = active): void {
  g.player.hand.cards.push(id(card));
  g.store.dispatch(new PlayCardAction(g.player.id, g.player.hand.cards.indexOf(card), target));
}
function attack(g: Board): void {
  g.store.dispatch(new AttackAction(g.player.id, g.card.attacks[0].name));
}
function indexes(prompt: Prompt<unknown>, cards: Card[]): number[] {
  if (!(prompt instanceof ChooseCardsPrompt)) throw new Error('Expected ChooseCardsPrompt');
  return cards.map(card => prompt.cards.cards.indexOf(card));
}
function coins(g: Board, results: boolean[]): () => number {
  const reduce = g.store.reduceEffect.bind(g.store); let count = 0;
  spyOn(g.store, 'reduceEffect').and.callFake((state: State, effect: Effect): State => {
    if (!(effect instanceof CoinFlipEffect)) return reduce(state, effect);
    if (count >= results.length) throw new Error('Unexpected coin flip');
    const result = results[count++]; effect.result = result;
    return g.store.prompt(state, new WaitPrompt(effect.player.id, 0, 'Scripted coin'), () => {
      if (effect.callback) effect.callback(result);
    });
  });
  return () => count;
}
function shuffles(g: Board): number {
  return g.state.prompts.filter(p => p instanceof ShuffleDeckPrompt).length;
}

describe('Happy6 reused prebuilt effects through Store actions and public prompts', () => {
  it('Rattata and Raticate count toward Mewtwo ex\'s real four-Rocket attack threshold', () => {
    const g = board(new TeamRocketsMewtwoex());
    g.player.bench[0].cards = [id(new TeamRocketsRattata())];
    g.player.bench[1].cards = [id(new TeamRocketsRaticate())];
    g.player.bench[2].cards = [id(new TeamRocketsMurkrow())];
    attack(g);
    finish(g, prompt => {
      if (!(prompt instanceof DiscardEnergyPrompt)) throw new Error('Expected optional discard');
      return [];
    });
    expect(g.opponent.active.damage).toBe(160);
  });
  it('a Rocket name without the tag is not a fourth Rocket', () => {
    const g = board(new TeamRocketsMewtwoex());
    g.player.bench[0].cards = [id(new TeamRocketsRattata())];
    g.player.bench[1].cards = [id(new TeamRocketsRaticate())];
    const fake = id(new Target()); fake.name = "Team Rocket's Impostor";
    g.player.bench[2].cards = [fake];
    expect(() => attack(g)).toThrow(new GameError(GameMessage.CANNOT_USE_ATTACK));
    expect(g.opponent.active.damage).toBe(0);
  });
  for (const make of [() => new TeamRocketsRattata(), () => new TeamRocketsRaticate()]) {
    it(`legally attaches Rocket Energy to ${make().name} without discarding it`, () => {
      const card = make(), g = board(card), energy = new TeamRocketsEnergy();
      expect(card.hasTag(CardTag.TEAM_ROCKET)).toBe(true);
      play(g, energy); finish(g);
      expect(g.player.active.cards).toContain(energy);
      expect(g.player.discard.cards).not.toContain(energy);
    });
  }

  for (const ownCount of [0, 7]) for (const opponentCount of [0, 5]) {
    it(`Archer waits for both shuffles before drawing from changed tops (${ownCount}/${opponentCount})`, () => {
      const g = board(), archer = new TeamRocketsArcher();
      g.player.deck.cards = Array.from({ length: ownCount }, () => id(new Target()));
      g.opponent.deck.cards = Array.from({ length: opponentCount }, () => id(new Target()));
      g.player.hand.cards = Array.from({ length: 6 }, () => id(new Target()));
      g.opponent.hand.cards = Array.from({ length: 6 }, () => id(new Target()));
      g.player.marker.addMarker(archer.ARCHER_MARKER, archer);
      expect(archer.canPlay(g.store, g.state, g.player)).toBe(true);
      play(g, archer);
      const oldOwn = g.player.deck.cards.slice(), oldOpponent = g.opponent.deck.cards.slice();
      expect(g.player.hand.cards.length).toBe(0); expect(g.opponent.hand.cards.length).toBe(0);
      let shuffleCount = 0;
      while (g.store.hasPrompts()) {
        const prompt = pending(g);
        // Even after the first shuffle's animation, neither player may draw.
        expect(g.player.hand.cards.length).toBe(0); expect(g.opponent.hand.cards.length).toBe(0);
        if (prompt instanceof ShuffleDeckPrompt) {
          shuffleCount++;
          const owner = g.state.players.find(p => p.id === prompt.playerId)!;
          answer(g, prompt, owner.deck.cards.map((_, index) => index).reverse());
        } else {
          expect(prompt instanceof WaitPrompt).toBe(true); answer(g, prompt, true);
        }
      }
      expect(shuffleCount).toBe(2);
      expect(g.player.hand.cards).toEqual(oldOwn.slice().reverse().slice(0, 5));
      expect(g.opponent.hand.cards).toEqual(oldOpponent.slice().reverse().slice(0, 3));
      expect(g.player.hand.cards[0]).not.toBe(oldOwn[0]);
      expect(g.opponent.hand.cards[0]).not.toBe(oldOpponent[0]);
      expect(g.player.discard.cards).toContain(archer);
    });
  }
  it('Archer preserves the prior-turn KO gate and rejects before moving any hand cards', () => {
    const g = board(), archer = new TeamRocketsArcher(), retained = id(new Target());
    g.player.hand.cards = [retained]; const deck = g.player.deck.cards.slice();
    expect(() => play(g, archer)).toThrow(new GameError(GameMessage.CANNOT_PLAY_THIS_CARD));
    expect(g.player.hand.cards).toEqual([retained, archer]); expect(g.player.deck.cards).toEqual(deck);
    expect(g.player.supporter.cards).not.toContain(archer);
  });
  it('Archer also completes when both decks and the remaining hands are empty', () => {
    const g = board(), archer = new TeamRocketsArcher();
    g.player.deck.cards = []; g.opponent.deck.cards = [];
    g.player.marker.addMarker(archer.ARCHER_MARKER, archer);
    play(g, archer); finish(g);
    expect(shuffles(g)).toBe(2);
    expect(g.player.hand.cards).toEqual([]); expect(g.opponent.hand.cards).toEqual([]);
  });

  for (const heads of [false, true]) for (const mode of ['hit', 'decline', 'absent']) {
    it(`Rocket Great Ball ${heads ? 'heads/evolution' : 'tails/basic'} ${mode}: reveal once and always shuffle`, () => {
      const g = board(), ball = new TeamRocketsGreatBall(); coins(g, [heads]);
      const basic = id(new TeamRocketsRattata()), evolution = id(new TeamRocketsRaticate());
      const other = id(new Target()), energy = id(new BasicEnergy());
      const target = heads ? evolution : basic, wrongStage = heads ? basic : evolution;
      g.player.deck.cards = mode === 'absent' ? [other, energy] : [basic, evolution, other, energy];
      play(g, ball); let searches = 0;
      finish(g, prompt => {
        if (!(prompt instanceof ChooseCardsPrompt)) throw new Error('Expected Great Ball search');
        searches++;
        expect(prompt.validate([])).toBe(true);
        expect(prompt.validate([other])).toBe(false); expect(prompt.validate([energy])).toBe(false);
        if (mode !== 'absent') {
          expect(prompt.validate([target])).toBe(true); expect(prompt.validate([wrongStage])).toBe(false);
        }
        return indexes(prompt, mode === 'hit' ? [target] : []);
      });
      expect(searches).toBe(1); expect(shuffles(g)).toBe(1);
      const shows = g.state.prompts.filter(p => p instanceof ShowCardsPrompt) as ShowCardsPrompt[];
      expect(shows.length).toBe(mode === 'hit' ? 1 : 0);
      if (mode === 'hit') { expect(shows[0].cards).toEqual([target]); expect(g.player.hand.cards).toEqual([target]); }
      else expect(g.player.hand.cards).toEqual([]);
      expect(g.player.discard.cards).toContain(ball);
    });
  }

  for (const mode of ['hit', 'decline', 'absent']) {
    it(`Quilava ${mode} consumes its ability, survives switching, and resets next turn`, () => {
      const card = new EthansQuilava(), g = board(card), adventure = id(new EthansAdventure());
      g.player.deck.cards = mode === 'absent' ? [id(new Target()), id(new Target())] : [adventure, id(new Target()), id(new Target())];
      const power = () => g.store.reduceEffect(g.state, new PowerEffect(g.player, card.powers[0], card));
      power(); finish(g, prompt => indexes(prompt, mode === 'hit' ? [adventure] : []));
      expect(g.player.marker.hasMarker(card.ADVENTURE_BOUND_MARKER, card)).toBe(true);
      expect(shuffles(g)).toBe(1);
      if (mode === 'hit') expect(g.player.hand.cards).toContain(adventure);
      const original = g.player.active;
      g.player.switchPokemon(g.player.bench[0], g.store, g.state);
      g.player.switchPokemon(original, g.store, g.state);
      expect(() => power()).toThrow(new GameError(GameMessage.BLOCKED_BY_EFFECT));
      g.store.reduceEffect(g.state, new EndTurnEffect(g.player));
      g.store.reduceEffect(g.state, new EndTurnEffect(g.opponent));
      expect(g.player.marker.hasMarker(card.ADVENTURE_BOUND_MARKER, card)).toBe(false);
      power(); finish(g, prompt => indexes(prompt, []));
      expect(g.player.marker.hasMarker(card.ADVENTURE_BOUND_MARKER, card)).toBe(true);
      expect(shuffles(g)).toBe(2);
    });
  }

  for (const benchCount of [1, 5]) for (const heads of [false, true]) {
    it(`Energy Sticker accepts ${benchCount} occupied bench slots and preserves the ${heads ? 'heads' : 'tails'} branch`, () => {
      const g = board(), sticker = new EnergySticker(); coins(g, [heads]);
      g.player.bench.forEach((slot, index) => { slot.cards = index < benchCount ? [id(new Target())] : []; });
      const basic = id(new BasicEnergy()), special = id(new MistEnergy());
      g.player.discard.cards = [special, basic];
      expect(sticker.canPlay(g.store, g.state, g.player)).toBe(true);
      play(g, sticker); let choices = 0;
      finish(g, prompt => {
        if (!(prompt instanceof AttachEnergyPrompt)) throw new Error('Expected bench attachment');
        choices++;
        expect(prompt.validate([{ card: special, to: bench }], g.state)).toBe(false);
        expect(prompt.validate([{ card: basic, to: active }], g.state)).toBe(false);
        expect(prompt.validate([{ card: basic, to: { ...bench, player: PlayerType.TOP_PLAYER } }], g.state)).toBe(false);
        return [{ index: prompt.cardList.cards.indexOf(basic), to: bench }];
      });
      expect(choices).toBe(heads ? 1 : 0);
      expect(g.player.bench[0].cards.includes(basic)).toBe(heads);
      expect(g.player.discard.cards).toContain(special);
      expect(g.player.discard.cards.includes(basic)).toBe(!heads);
      expect(g.player.discard.cards).toContain(sticker);
    });
  }
  for (const missing of ['bench', 'basic-energy']) {
    it(`Energy Sticker rejects a missing ${missing} in canPlay and PlayCardAction`, () => {
      const g = board(), sticker = new EnergySticker();
      if (missing === 'bench') g.player.bench.forEach(slot => { slot.cards = []; });
      g.player.discard.cards = [id(missing === 'bench' ? new BasicEnergy() : new MistEnergy())];
      expect(sticker.canPlay(g.store, g.state, g.player)).toBe(false);
      expect(() => play(g, sticker)).toThrow(new GameError(GameMessage.CANNOT_PLAY_THIS_CARD));
    });
  }

  for (const count of [0, 1, 4, 5, 6]) {
    it(`Sacred Ash handles ${count} publicly discarded Pokemon with an up-to-five cap`, () => {
      const g = board(), ash = new SacredAsh(), energy = id(new BasicEnergy());
      const pokemon = Array.from({ length: count }, () => id(new Target()));
      g.player.discard.cards = [...pokemon, energy];
      expect(ash.canPlay(g.store, g.state, g.player)).toBe(count > 0);
      if (!count) {
        expect(() => play(g, ash)).toThrow(new GameError(GameMessage.CANNOT_PLAY_THIS_CARD));
        return;
      }
      const selected = count === 6 ? pokemon.slice(0, 2) : pokemon;
      const oldDeckSize = g.player.deck.cards.length;
      play(g, ash);
      finish(g, prompt => {
        if (!(prompt instanceof ChooseCardsPrompt)) throw new Error('Expected discard recovery');
        expect(prompt.options.min).toBe(1); expect(prompt.options.max).toBe(Math.min(5, count));
        expect(prompt.validate([])).toBe(false); expect(prompt.validate(null)).toBe(false);
        expect(prompt.validate([energy])).toBe(false);
        if (count === 6) expect(prompt.validate(pokemon)).toBe(false);
        return indexes(prompt, selected);
      });
      expect(g.player.deck.cards.length).toBe(oldDeckSize + selected.length);
      for (const card of selected) expect(g.player.deck.cards).toContain(card);
      expect(g.player.discard.cards.filter(card => card instanceof PokemonCard).length).toBe(count - selected.length);
      expect(g.player.discard.cards).toContain(energy); expect(g.player.discard.cards).toContain(ash);
      expect(shuffles(g)).toBe(1);
    });
  }

  for (const search of ['Murkrow', 'Adventure']) for (const mode of ['hit', 'decline', 'absent']) {
    it(`${search} ${mode} shuffles without forcing hidden search success`, () => {
      const g = board(search === 'Murkrow' ? new TeamRocketsMurkrow() : new Target());
      const candidate = id(search === 'Murkrow' ? new EthansAdventure() : new EthansQuilava());
      const other = id(new Target());
      g.player.deck.cards = mode === 'absent' ? [other, id(new Target())] : [other, candidate, id(new Target())];
      if (search === 'Murkrow') attack(g); else play(g, new EthansAdventure());
      finish(g, prompt => {
        if (!(prompt instanceof ChooseCardsPrompt)) throw new Error('Expected search');
        expect(prompt.validate([])).toBe(true); expect(prompt.validate([other])).toBe(false);
        return indexes(prompt, mode === 'hit' ? [candidate] : []);
      });
      expect(shuffles(g)).toBe(1);
      expect(g.player.hand.cards.includes(candidate)).toBe(mode === 'hit');
      expect(g.state.prompts.filter(p => p instanceof ShowCardsPrompt).length).toBe(mode === 'hit' ? 1 : 0);
    });
  }
  it('Murkrow also finishes the shuffle path for an empty deck', () => {
    const g = board(new TeamRocketsMurkrow()); g.player.deck.cards = [];
    attack(g); finish(g); expect(shuffles(g)).toBe(1);
  });

  for (const kind of ['Staryu', 'Rattata']) for (const protectedTarget of [false, true]) for (const actingIndex of [0, 1]) {
    it(`${kind} attack status respects Mist Energy, normal damage remains (${protectedTarget}, player ${actingIndex})`, () => {
      const g = board(kind === 'Staryu' ? new MistysStaryu() : new TeamRocketsRattata(), actingIndex);
      if (protectedTarget) g.opponent.active.cards.push(id(new MistEnergy()));
      const source = g.player.active, defender = g.opponent.active;
      const reduce = g.store.reduceEffect.bind(g.store); let statusEffects = 0;
      // Capture the real attack subeffect; do not emulate prevention or damage.
      spyOn(g.store, 'reduceEffect').and.callFake((state: State, effect: Effect): State => {
        if (effect instanceof AddSpecialConditionsEffect) {
          statusEffects++; expect(effect.source).toBe(source); expect(effect.target).toBe(defender);
          expect(effect.attack).toBe(g.card.attacks[0]);
        }
        return reduce(state, effect);
      });
      // The real coin reducer is deterministic without replacing the reduceEffect spy.
      if (kind === 'Staryu') spyOn(Math, 'random').and.returnValue(0.25);
      attack(g); finish(g);
      expect(statusEffects).toBe(1);
      const condition = kind === 'Staryu' ? SpecialCondition.PARALYZED : SpecialCondition.POISONED;
      expect(defender.specialConditions.includes(condition)).toBe(!protectedTarget);
      expect(defender.damage).toBe(kind === 'Staryu' ? 20 : protectedTarget ? 10 : 20);
    });
  }
  it('Staryu tails deals its normal damage without adding paralysis', () => {
    const g = board(new MistysStaryu()), flips = coins(g, [false]);
    attack(g); finish(g); expect(flips()).toBe(1);
    expect(g.opponent.active.damage).toBe(20); expect(g.opponent.active.specialConditions).toEqual([]);
  });

  for (const opponentHasBench of [false, true]) for (const actingIndex of [0, 1]) {
    it(`Giovanni switches own Rockets first; caster chooses the opponent if present (${opponentHasBench}, player ${actingIndex})`, () => {
      const g = board(new TeamRocketsRattata(), actingIndex), giovanni = new TeamRocketsGiovanni();
      const rocket = id(new TeamRocketsRaticate());
      g.player.bench[0].cards = [rocket]; g.player.bench[1].cards = [id(new Target())];
      if (!opponentHasBench) g.opponent.bench.forEach(slot => { slot.cards = []; });
      else g.opponent.bench[1].cards = [id(new Target())];
      const ownOld = g.player.active, opponentOld = g.opponent.active, desired = g.opponent.bench[1];
      expect(giovanni.canPlay(g.store, g.state, g.player)).toBe(true);
      play(g, giovanni); let choices = 0;
      finish(g, prompt => {
        if (!(prompt instanceof ChoosePokemonPrompt)) throw new Error('Expected switch');
        expect(prompt.playerId).toBe(g.player.id); choices++;
        if (choices === 1) {
          expect(prompt.playerType).toBe(PlayerType.BOTTOM_PLAYER);
          expect(prompt.validate([g.player.bench[1]], g.state)).toBe(false);
          return [bench];
        }
        expect(g.player.active.getPokemonCard()).toBe(rocket);
        expect(prompt.playerType).toBe(PlayerType.TOP_PLAYER);
        return [{ player: PlayerType.TOP_PLAYER, slot: SlotType.BENCH, index: 1 }];
      });
      expect(choices).toBe(opponentHasBench ? 2 : 1);
      expect(g.player.active.getPokemonCard()).toBe(rocket); expect(g.player.bench).toContain(ownOld);
      expect(g.opponent.active).toBe(opponentHasBench ? desired : opponentOld);
      expect(g.player.discard.cards).toContain(giovanni);
    });
  }
  for (const missing of ['active', 'bench']) {
    it(`Giovanni still requires a Rocket ${missing}, rejecting before moving the supporter`, () => {
      const g = board(missing === 'active' ? new Target() : new TeamRocketsRattata());
      if (missing === 'active') g.player.bench[0].cards = [id(new TeamRocketsRaticate())];
      const card = new TeamRocketsGiovanni();
      expect(card.canPlay(g.store, g.state, g.player)).toBe(false);
      expect(() => play(g, card)).toThrow(new GameError(GameMessage.CANNOT_PLAY_THIS_CARD));
      expect(g.player.hand.cards).toContain(card); expect(g.player.supporter.cards).not.toContain(card);
    });
  }
});
