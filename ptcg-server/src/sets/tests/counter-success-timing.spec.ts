import { Store } from '../../game/store/store';
import { State, GamePhase } from '../../game/store/state/state';
import { Player } from '../../game/store/state/player';
import { CardList } from '../../game/store/state/card-list';
import { PokemonCardList } from '../../game/store/state/pokemon-card-list';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { EnergyCard } from '../../game/store/card/energy-card';
import { CardType, Stage } from '../../game/store/card/card-types';
import { Effect } from '../../game/store/effects/effect';
import { EvolveEffect, PowerEffect, UseStadiumEffect, AttackEffect } from '../../game/store/effects/game-effects';
import { AttachEnergyEffect, PlayPokemonEffect, PlayPokemonFromDeckEffect, PlayPokemonFromDiscardEffect } from '../../game/store/effects/play-card-effects';
import { Prompt } from '../../game/store/prompts/prompt';
import { AttachEnergyPrompt } from '../../game/store/prompts/attach-energy-prompt';
import { ChooseCardsPrompt } from '../../game/store/prompts/choose-cards-prompt';
import { ChoosePokemonPrompt } from '../../game/store/prompts/choose-pokemon-prompt';
import { ConfirmPrompt } from '../../game/store/prompts/confirm-prompt';
import { ChoosePrizePrompt } from '../../game/store/prompts/choose-prize-prompt';
import { ResolvePromptAction } from '../../game/store/actions/resolve-prompt-action';
import { PlayerType, SlotType } from '../../game/store/actions/play-card-action';
import { Metagross } from '../03-ex-ruby-and-sapphire/set-ex-deoxys/metagross';
import { Blastoiseex } from '../03-ex-ruby-and-sapphire/set-ex-firered-leafgreen/blastoise-ex';
import { Gardevoir } from '../03-ex-ruby-and-sapphire/set-ex-ruby-and-sapphire/gardevoir';
import { TeamAquasLanturn } from '../03-ex-ruby-and-sapphire/set-ex-team-magma-vs-team-aqua/team-aquas-lanturn';
import { TeamMagmasCamerupt } from '../03-ex-ruby-and-sapphire/set-ex-team-magma-vs-team-aqua/team-magmas-camerupt';
import { Typhlosion } from '../05-heartgold-and-soulsilver/set-heartgold-and-soulsilver/typhlosion';
import { Chandelure } from '../06-black-and-white/set-plasma-freeze/chandelure';
import { MagmaBasin } from '../09-sword-and-shield/set-brilliant-stars/magma-basin';
import { Toxtricity } from '../11-mega-evolution/set-phantasmal-flames/toxtricity';
import { TeamMagmaHideout } from '../03-ex-ruby-and-sapphire/set-ex-team-magma-vs-team-aqua/team-magma-hideout';
import { TeamMagmasSecretBase } from '../07-x-and-y/set-double-crisis/team-magmas-secret-base';
import { GapejawBog } from '../09-sword-and-shield/set-astral-radiance/gapejaw-bog';
import { DangerousRuins as RiskyRuins } from '../11-mega-evolution/set-mega-evolution/risky-ruins';
import { GalacticHQ } from '../04-diamond-pearl-platinum/set-platinum/galactic-hq';
import { PoTown } from '../08-sun-and-moon/set-burning-shadows/po-town';
import { JolteonStar } from '../03-ex-ruby-and-sapphire/set-ex-power-keepers/jolteon-star';
import { Dusclops } from '../10-scarlet-and-violet/set-shrouded-fable/dusclops';
import { Dusknoir } from '../10-scarlet-and-violet/set-shrouded-fable/dusknoir';
import { StealthyHood } from '../08-sun-and-moon/set-unbroken-bonds/stealthy-hood';
import { EndTurnEffect, AfterAttackEffect } from '../../game/store/effects/game-phase-effects';
import { Cofagrigus2 } from '../06-black-and-white/set-noble-victories/cofagrigus-2';
import { Shedinja } from '../08-sun-and-moon/set-lost-thunder/shedinja';
import { Pichu } from '../03-ex-ruby-and-sapphire/set-ex-sandstorm/pichu';
import { MistEnergy } from '../10-scarlet-and-violet/set-temporal-forces/mist-energy';
import { GameMessage } from '../../game/game-message';
class Target extends PokemonCard {
  public set = 'TEST'; public name = 'Timing Target'; public fullName = 'Timing Target TEST'; public hp = 300; public stage = Stage.BASIC;
  public cardType = [CardType.PSYCHIC, CardType.FIRE, CardType.DARK, CardType.WATER];
}
class Energy extends EnergyCard {
  public set = 'TEST'; public name = 'Psychic Energy'; public fullName = 'Timing Energy TEST'; public provides = [CardType.PSYCHIC];
}
class Witness extends Target {
  public attachments = 0; public stopAttachment = false; public stopPlacement = false;
  public reduceEffect(_store: Store, state: State, effect: Effect): State {
    if (effect instanceof AttachEnergyEffect) { this.attachments++; if (this.stopAttachment) effect.preventDefault = true; }
    if (this.stopPlacement && (effect instanceof PlayPokemonEffect || effect instanceof EvolveEffect || effect instanceof PlayPokemonFromDeckEffect || effect instanceof PlayPokemonFromDiscardEffect)) effect.preventDefault = true;
    return state;
  }
}
function board() {
  const state = new State(); state.turn = 5; state.phase = GamePhase.PLAYER_TURN; state.players = [new Player(), new Player()];
  let id = 500;
  for (const [i, p] of state.players.entries()) {
    p.id = i === 0 ? 17 : 29; p.active.cards = [new Target()]; p.active.cards[0].id = id++;
    p.bench = Array.from({ length: 5 }, () => new PokemonCardList()); p.bench[0].cards = [new Target()]; p.bench[0].cards[0].id = id++;
    p.deck.cards = [new Target()]; p.prizes = Array.from({ length: 6 }, () => { const list = new CardList(); list.cards = [new Target()]; return list; });
  }
  const store = new Store({ onStateChange() {} }, false); store.state = state;
  return { store, state, player: state.players[0], opponent: state.players[1] };
}
function reply(g: ReturnType<typeof board>, prompt: Prompt<unknown>, raw: unknown) {
  const decoded = prompt.decode(raw, g.state); expect(prompt.validate(decoded, g.state)).toBe(true);
  g.store.dispatch(new ResolvePromptAction(prompt.id, decoded), prompt.playerId);
}
describe('remaining attack counter contracts', () => {
  for (const create of [() => new Cofagrigus2(), () => new Shedinja()]) for (const protectedTarget of [false, true]) it(`${create().fullName} attack-counter respects Mist Energy: ${protectedTarget}`, () => {
    const g = board(), card = create(); g.player.active.cards = [card];
    if (protectedTarget) g.opponent.active.cards.push(new MistEnergy());
    g.store.reduceEffect(g.state, new AttackEffect(g.player, g.opponent, card.attacks[0]));
    expect(g.opponent.active.damage).toBe(protectedTarget ? 0 : card instanceof Cofagrigus2 ? 40 : 30);
  });
  function pichu(blocked: boolean) {
    const g = board(), card = new Pichu(), witness = new Witness(), first = new Energy(), second = new Energy();
    card.id = 900; first.id = 901; second.id = 902; witness.id = 903; witness.stopAttachment = blocked;
    g.player.active.cards = [card]; g.opponent.bench[2].cards = [witness]; g.player.discard.cards = [first, second];
    g.store.reduceEffect(g.state, new AfterAttackEffect(g.player, g.opponent, card.attacks[0]));
    const prompt = g.state.prompts.find(p => p instanceof AttachEnergyPrompt && p.result === undefined) as AttachEnergyPrompt;
    expect(prompt).toBeDefined(); return { ...g, card, witness, first, second, prompt };
  }
  for (const blocked of [false, true]) it(`Pichu attack links two counters to two successful real attachments: ${blocked}`, () => {
    const g = pichu(blocked), to = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
    reply(g, g.prompt, [{ index: 0, to }, { index: 1, to }]);
    expect(g.witness.attachments).toBe(2); expect(g.player.active.damage).toBe(blocked ? 0 : 20);
    expect(g.player.active.cards.includes(g.first)).toBe(!blocked); expect(g.player.active.cards.includes(g.second)).toBe(!blocked);
    expect(g.player.discard.cards.includes(g.first)).toBe(blocked); expect(g.player.energyPlayedTurn).toBe(0);
  });
  it('Pichu attack cannot split the two energies across Pokemon', () => {
    const g = pichu(false);
    const result = g.prompt.decode([{ index: 0, to: { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 } }, { index: 1, to: { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 } }], g.state);
    expect(g.prompt.validate(result, g.state)).toBe(false);
    expect(() => g.store.dispatch(new ResolvePromptAction(g.prompt.id, result), g.player.id)).toThrow();
    expect(g.player.discard.cards.length).toBe(2); expect(g.player.active.damage).toBe(0); expect(g.player.bench[0].damage).toBe(0);
  });
  it('Pichu attack may attach zero energy without placing counters', () => {
    const g = pichu(false); reply(g, g.prompt, []); expect(g.player.discard.cards.length).toBe(2); expect(g.player.active.damage).toBe(0); expect(g.witness.attachments).toBe(0);
  });
});

describe('counter effects depend on successful prerequisite actions', () => {
  const cases = [
    { create: () => new Metagross(), source: 'discard', name: 'Psychic Energy', damage: 10 },
    { create: () => new Blastoiseex(), source: 'hand', name: 'Water Energy', damage: 10 },
    { create: () => new Gardevoir(), source: 'deck', name: 'Psychic Energy', damage: 20 },
    { create: () => new TeamAquasLanturn(), source: 'hand', name: 'Water Energy', damage: 20 },
    { create: () => new TeamMagmasCamerupt(), source: 'discard', name: 'Fire Energy', damage: 20 },
    { create: () => new Typhlosion(), source: 'discard', name: 'Fire Energy', damage: 10 },
    { create: () => new Chandelure(), source: 'deck', name: 'Fire Energy', damage: 10 },
    { create: () => new MagmaBasin(), source: 'discard', name: 'Fire Energy', damage: 20 },
    { create: () => new Toxtricity(), source: 'deck', name: 'Darkness Energy', damage: 20 },
  ];
  for (const c of cases) for (const blocked of [false, true]) it(`${c.create().fullName} attachment-linked counter: ${blocked}`, () => {
    const g = board(), card = c.create(), witness = new Witness(); witness.stopAttachment = blocked; g.opponent.bench[2].cards = [witness];
    card.id = 900; witness.id = 902;
    const energy = new Energy(); energy.id = 901; energy.name = c.name; energy.provides = [c.name === 'Water Energy' ? CardType.WATER : c.name === 'Fire Energy' ? CardType.FIRE : c.name === 'Darkness Energy' ? CardType.DARK : CardType.PSYCHIC];
    const source = g.player[c.source as 'hand' | 'deck' | 'discard']; source.cards.push(energy);
    const target = card instanceof MagmaBasin ? g.player.bench[0] : g.player.active;
    const to = { player: PlayerType.BOTTOM_PLAYER, slot: card instanceof MagmaBasin ? SlotType.BENCH : SlotType.ACTIVE, index: 0 };
    if (card instanceof MagmaBasin) { g.player.stadium.cards = [card]; g.store.reduceEffect(g.state, new UseStadiumEffect(g.player, card)); }
    else { g.player.active.cards = [card]; g.store.reduceEffect(g.state, new PowerEffect(g.player, card.powers[0], card)); }
    for (let step = 0; witness.attachments === 0 && step < 10; step++) {
      const p = g.state.prompts.find(item => item.result === undefined); expect(p).toBeDefined(); if (!p) break;
      if (p instanceof AttachEnergyPrompt) reply(g, p, [{ index: source.cards.indexOf(energy), to }]);
      else if (p instanceof ChooseCardsPrompt) reply(g, p, [p.cards.cards.indexOf(energy)]);
      else if (p instanceof ChoosePokemonPrompt) reply(g, p, [to]);
      else reply(g, p, true);
    }
    expect(witness.attachments).toBe(1); expect(target.damage).toBe(blocked ? 0 : c.damage);
    expect(target.cards.includes(energy)).toBe(!blocked); expect(source.cards.includes(energy)).toBe(blocked); expect(g.player.energyPlayedTurn).toBe(0);
  });
  for (const create of [() => new TeamMagmaHideout(), () => new TeamMagmasSecretBase(), () => new GapejawBog(), () => new RiskyRuins()]) {
    for (const blocked of [false, true]) it(`${create().fullName} only damages a successfully played Basic: ${blocked}`, () => {
      const g = board(), stadium = create(), mon = new Target(), witness = new Witness(); mon.cardType = [CardType.PSYCHIC];
      witness.stopPlacement = blocked; g.opponent.bench[2].cards = [witness]; g.player.stadium.cards = [stadium]; g.player.hand.cards = [mon];
      g.store.reduceEffect(g.state, new PlayPokemonEffect(g.player, mon, g.player.bench[2]));
      expect(g.player.bench[2].damage).toBe(blocked ? 0 : stadium instanceof TeamMagmaHideout ? 10 : 20);
      expect(g.player.bench[2].cards.includes(mon)).toBe(!blocked);
    });
  }
  for (const where of ['deck', 'discard'] as const) it(`Risky Ruins observes the actual Dark type after ${where} placement`, () => {
    const g = board(); g.player.stadium.cards = [new RiskyRuins()]; const dark = new Target(); dark.cardType = [CardType.DARK]; g.player[where].cards = [dark];
    const effect = where === 'deck' ? new PlayPokemonFromDeckEffect(g.player, dark, g.player.bench[2]) : new PlayPokemonFromDiscardEffect(g.player, dark, g.player.bench[2]);
    g.store.reduceEffect(g.state, effect); expect(g.player.bench[2].cards).toContain(dark); expect(g.player.bench[2].damage).toBe(0);
  });
  for (const create of [() => new GalacticHQ(), () => new PoTown()]) for (const blocked of [false, true]) it(`${create().fullName} only follows a successful hand evolution: ${blocked}`, () => {
    const g = board(), stadium = create(), evolution = new Target(), witness = new Witness(); evolution.stage = Stage.STAGE_1; evolution.evolvesFrom = 'Timing Target';
    witness.stopPlacement = blocked; g.opponent.bench[2].cards = [witness]; g.player.stadium.cards = [stadium]; g.player.hand.cards = [evolution];
    g.store.reduceEffect(g.state, new EvolveEffect(g.player, g.player.active, evolution));
    expect(g.player.active.damage).toBe(blocked ? 0 : stadium instanceof GalacticHQ ? 20 : 30); expect(g.player.active.getPokemonCard() === evolution).toBe(!blocked);
  });
  for (const blocked of [false, true]) it(`Jolteon Star only triggers after successful bench play, legacy counters ignore Hood: ${blocked}`, () => {
    const g = board(), card = new JolteonStar(), witness = new Witness(); witness.stopPlacement = blocked;
    g.opponent.bench[2].cards = [witness]; g.player.hand.cards = [card]; g.opponent.active.tools = [new StealthyHood()];
    g.store.reduceEffect(g.state, new PlayPokemonEffect(g.player, card, g.player.bench[2]));
    const p = g.state.prompts.find(item => item instanceof ConfirmPrompt && item.result === undefined);
    if (blocked) { expect(p).toBeUndefined(); expect(g.opponent.active.damage).toBe(0); }
    else { expect(p).toBeDefined(); reply(g, p!, true); expect(g.opponent.active.damage).toBe(10); expect(g.player.active.damage).toBe(10); }
  });
  for (const create of [() => new Dusclops(), () => new Dusknoir()]) for (const protectedTarget of [false, true]) it(`${create().fullName} self-knockout requires actually placed counters: ${protectedTarget}`, () => {
    const g = board(), card = create(); card.id = 909; g.player.bench[1].cards = [card];
    if (protectedTarget) g.opponent.active.tools = [new StealthyHood()];
    g.store.reduceEffect(g.state, new PowerEffect(g.player, card.powers[0], card));
    const p = g.state.prompts.find(item => item instanceof ChoosePokemonPrompt && item.result === undefined); expect(p).toBeDefined();
    reply(g, p!, [{ player: PlayerType.TOP_PLAYER, slot: SlotType.ACTIVE, index: 0 }]);
    if (protectedTarget) {
      expect(g.player.bench[1].getPokemonCard()).toBe(card); expect(g.player.bench[1].damage).toBe(0); expect(g.opponent.active.damage).toBe(0);
      let denied = false; try { g.store.reduceEffect(g.state, new PowerEffect(g.player, card.powers[0], card)); } catch (e) { expect((e as { message: string }).message).toBe(GameMessage.POWER_ALREADY_USED); denied = true; } expect(denied).toBe(true);
      g.store.reduceEffect(g.state, new EndTurnEffect(g.player));
      expect(() => g.store.reduceEffect(g.state, new PowerEffect(g.player, card.powers[0], card))).not.toThrow();
    } else {
      expect(g.opponent.active.damage).toBe(card instanceof Dusclops ? 50 : 130); expect(g.player.discard.cards).toContain(card);
      const prize = g.state.prompts.find(item => item instanceof ChoosePrizePrompt && item.result === undefined); expect(prize).toBeDefined(); reply(g, prize!, [0]);
      expect(g.opponent.prizes.filter(list => list.cards.length > 0).length).toBe(5);
    }
  });
});
