import { Store } from '../../game/store/store';
import { State, GamePhase } from '../../game/store/state/state';
import { Player } from '../../game/store/state/player';
import { CardList } from '../../game/store/state/card-list';
import { PokemonCardList } from '../../game/store/state/pokemon-card-list';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { EnergyCard } from '../../game/store/card/energy-card';
import { CardTag, CardType, Stage } from '../../game/store/card/card-types';
import { Effect } from '../../game/store/effects/effect';
import { AttackEffect, EvolveEffect, KnockOutEffect, PowerEffect } from '../../game/store/effects/game-effects';
import { AttachEnergyPrompt } from '../../game/store/prompts/attach-energy-prompt';
import { Houndoom } from '../09-sword-and-shield/set-battle-styles/houndoom';
import { Gardevoirex } from '../10-scarlet-and-violet/set-scarlet-and-violet/gardevoir-ex';
import { SingleStrikeEnergy } from '../09-sword-and-shield/set-battle-styles/single-strike-energy';
import { PutDamageEffect } from '../../game/store/effects/attack-effects';
import { AttachEnergyEffect } from '../../game/store/effects/play-card-effects';
import { BetweenTurnsEffect } from '../../game/store/effects/game-phase-effects';
import { PlayerType, SlotType } from '../../game/store/actions/play-card-action';
import { ResolvePromptAction } from '../../game/store/actions/resolve-prompt-action';
import { PutDamagePrompt } from '../../game/store/prompts/put-damage-prompt';
import { FadedTown } from '../07-x-and-y/set-ancient-origins/faded-town';
import { FrozenCity } from '../06-black-and-white/set-plasma-freeze/frozen-city';
import { CalamitousSnowyMountain } from '../10-scarlet-and-violet/set-paldea-evolved/calamitous-snowy-mountain';
import { BoxOfDisaster } from '../09-sword-and-shield/set-lost-origin/box-of-disaster';
import { VengefulPunch } from '../10-scarlet-and-violet/set-obsidian-flames/vengeful-punch';
import { SpellTag } from '../08-sun-and-moon/set-lost-thunder/spell-tag';
import { DeluxeBomb } from '../10-scarlet-and-violet/set-stellar-crown/deluxe-bomb';
import { Magby } from '../10-scarlet-and-violet/set-paradox-rift/magby';
import { AntiqueSkullFossil } from '../11-mega-evolution/set-pitch-black/antique-skull-fossil';
import { StealthyHood } from '../08-sun-and-moon/set-unbroken-bonds/stealthy-hood';
import { Kingdra } from '../05-heartgold-and-soulsilver/set-unleashed/kingdra';
import { Jolteonex } from '../03-ex-ruby-and-sapphire/set-ex-delta-species/jolteon-ex';
import { Kecleon } from '../09-sword-and-shield/set-chilling-reign/kecleon';
import { ChoosePokemonPrompt } from '../../game/store/prompts/choose-pokemon-prompt';
import { ConfirmPrompt } from '../../game/store/prompts/confirm-prompt';

class Target extends PokemonCard {
  public set = 'TEST'; public fullName = 'Peripheral Target TEST'; public name = 'Peripheral Target';
  public hp = 200; public stage = Stage.BASIC; public cardType = [CardType.PSYCHIC];
  public constructor(tags: CardTag[] = []) { super(); this._tags = tags; }
}
class Energy extends EnergyCard {
  public set = 'TEST'; public fullName = 'Peripheral Energy TEST'; public name = 'Peripheral Energy'; public provides = [CardType.PSYCHIC];
}
class StopAttachment extends Target {
  public reduceEffect(_store: Store, state: State, effect: Effect): State { if (effect instanceof AttachEnergyEffect) effect.preventDefault = true; return state; }
}
class StopDamage extends Target {
  public reduceEffect(_store: Store, state: State, effect: Effect): State { if (effect instanceof PutDamageEffect) effect.preventDefault = true; return state; }
}
class StopEvolution extends Target {
  public reduceEffect(_store: Store, state: State, effect: Effect): State { if (effect instanceof EvolveEffect) effect.preventDefault = true; return state; }
}
class StopKO extends Target {
  public reduceEffect(_store: Store, state: State, effect: Effect): State { if (effect instanceof KnockOutEffect) effect.preventDefault = true; return state; }
}
function board() {
  const state = new State(); state.phase = GamePhase.ATTACK; state.turn = 5;
  state.players = [new Player(), new Player()]; state.players[0].id = 17; state.players[1].id = 29;
  let id = 100;
  for (const p of state.players) {
    p.active.cards = [new Target()]; p.bench = Array.from({ length: 5 }, () => new PokemonCardList()); p.bench[0].cards = [new Target()];
    p.prizes = Array.from({ length: 6 }, () => { const prize = new CardList(); prize.cards = [new Target()]; return prize; }); p.deck.cards = [new Target()];
    p.forEachPokemon(PlayerType.BOTTOM_PLAYER, list => list.cards.forEach(card => card.id = id++));
  }
  const [player, opponent] = state.players;
  const store = new Store({ onStateChange() {} }, false); store.state = state;
  const hit = (damage: number) => {
    const base = new AttackEffect(player, opponent, { name: 'Peripheral hit', cost: [], damage, text: '' });
    const effect = new PutDamageEffect(base, damage); effect.target = opponent.active; store.reduceEffect(state, effect);
  };
  const ko = () => store.reduceEffect(state, new KnockOutEffect(opponent, opponent.active));
  return { state, store, player, opponent, hit, ko };
}

describe('remaining counter stadium, tool and attack effects', () => {
  it('Faded Town places two complete counters on each affected Mega once', () => {
    const g = board(); const stadium = new FadedTown(); g.player.stadium.cards = [stadium];
    (g.player.active.getPokemonCard() as Target).stage = Stage.MEGA; (g.opponent.active.getPokemonCard() as Target).stage = Stage.MEGA;
    g.store.reduceEffect(g.state, new BetweenTurnsEffect(g.player)); g.store.reduceEffect(g.state, new BetweenTurnsEffect(g.opponent));
    expect(g.player.active.damage).toBe(20); expect(g.opponent.active.damage).toBe(20);
  });
  for (const create of [() => new FrozenCity(), () => new CalamitousSnowyMountain()]) {
    for (const sourceName of ['hand', 'deck', 'discard']) it(`${create().fullName} only counts a successful hand attachment, not ${sourceName} acceleration`, () => {
      const g = board(); g.player.stadium.cards = [create()]; const energy = new Energy(); const source = g.player[sourceName as 'hand' | 'deck' | 'discard']; source.cards.push(energy);
      g.store.reduceEffect(g.state, new AttachEnergyEffect(g.player, energy, g.player.active, source));
      expect(g.player.active.damage).toBe(sourceName === 'hand' ? 20 : 0); expect(g.player.active.cards).toContain(energy);
    });
    it(`${create().fullName} places nothing after prevented attachment`, () => {
      const g = board(); g.player.stadium.cards = [create()]; g.opponent.bench[2].cards = [new StopAttachment()]; const energy = new Energy(); g.player.hand.cards.push(energy);
      g.store.reduceEffect(g.state, new AttachEnergyEffect(g.player, energy, g.player.active));
      expect(g.player.active.damage).toBe(0); expect(g.player.hand.cards).toContain(energy);
    });
  }
  it('Snowy Mountain checks Kecleon type after the Water Energy actually attaches', () => {
    const g = board(); g.player.active.cards = [new Kecleon()]; g.player.stadium.cards = [new CalamitousSnowyMountain()];
    const water = new Energy(); water.name = 'Water Energy'; water.provides = [CardType.WATER]; g.player.hand.cards.push(water);
    g.store.reduceEffect(g.state, new AttachEnergyEffect(g.player, water, g.player.active));
    expect(g.player.active.cards).toContain(water); expect(g.player.active.damage).toBe(0);
  });
  it('Frozen City exempts actual Team Plasma recipients', () => {
    const g = board(); g.player.stadium.cards = [new FrozenCity()]; g.player.active.cards = [new Target([CardTag.TEAM_PLASMA])]; const energy = new Energy(); g.player.hand.cards.push(energy);
    g.store.reduceEffect(g.state, new AttachEnergyEffect(g.player, energy, g.player.active)); expect(g.player.active.damage).toBe(0);
  });
  it('Box of Disaster reacts only after the real full-HP V knockout', () => {
    const g = board(); const victim = new Target([CardTag.POKEMON_V]); victim.id = 401; g.opponent.active.cards = [victim]; g.opponent.active.tools = [new BoxOfDisaster()];
    g.hit(200); expect(g.player.active.damage).toBe(0); g.ko(); expect(g.player.active.damage).toBe(80); expect(g.opponent.discard.cards).toContain(victim);
  });
  it('Box of Disaster does not predict a knockout before damage prevention', () => {
    const g = board(); g.opponent.active.cards = [new Target([CardTag.POKEMON_V])]; g.opponent.active.tools = [new BoxOfDisaster()]; g.opponent.bench[2].cards = [new StopDamage()];
    g.hit(200); expect(g.opponent.active.damage).toBe(0); expect(g.player.active.damage).toBe(0);
  });
  it('Box of Disaster does not react to a cancelled knockout', () => {
    const g = board(); g.opponent.active.cards = [new Target([CardTag.POKEMON_V])]; g.opponent.active.tools = [new BoxOfDisaster()]; g.opponent.bench[2].cards = [new StopKO()];
    g.hit(200); g.ko(); expect(g.player.active.damage).toBe(0); expect(g.opponent.active.getPokemonCard()).toBeDefined();
  });
  it('Vengeful Punch is not armed by nonlethal damage for a later counter knockout', () => {
    const g = board(); g.opponent.active.tools = [new VengefulPunch()]; g.hit(10); g.opponent.active.damage = 200; g.ko(); expect(g.player.active.damage).toBe(0);
  });
  it('Vengeful Punch places four counters after actual attack damage causes knockout', () => {
    const g = board(); g.opponent.active.tools = [new VengefulPunch()]; g.hit(200); expect(g.player.active.damage).toBe(0); g.ko(); expect(g.player.active.damage).toBe(40);
  });
  it('Spell Tag requires a Psychic holder', () => {
    const g = board(); (g.opponent.active.getPokemonCard() as Target).cardType = [CardType.FIRE]; g.opponent.active.tools = [new SpellTag()]; g.hit(200); g.ko();
    expect(g.state.prompts.some(p => p instanceof PutDamagePrompt)).toBe(false);
  });
  it('Spell Tag does not use stale damage for a subsequent counter knockout', () => {
    const g = board(); g.opponent.active.tools = [new SpellTag()]; g.hit(10); g.opponent.active.damage = 200; g.ko();
    expect(g.state.prompts.some(p => p instanceof PutDamagePrompt)).toBe(false);
  });
  it('Spell Tag resolves its distribution after successful knockout and discarding the holder', () => {
    const g = board(); const victim = g.opponent.active.getPokemonCard()!; g.opponent.active.tools = [new SpellTag()]; g.hit(200); g.ko();
    expect(g.opponent.discard.cards).toContain(victim);
    const prompt = g.state.prompts.find(p => p instanceof PutDamagePrompt) as PutDamagePrompt; expect(prompt).toBeDefined();
    const result = prompt.decode([{ target: { player: PlayerType.TOP_PLAYER, slot: SlotType.ACTIVE, index: 0 }, damage: 40 }], g.state);
    expect(prompt.validate(result, g.state)).toBe(true); g.store.dispatch(new ResolvePromptAction(prompt.id, result), 29); expect(g.player.active.damage).toBe(40);
  });
  it('Deluxe Bomb discards from the real tools collection after placing twelve counters', () => {
    const g = board(); const tool = new DeluxeBomb(); g.opponent.active.tools = [tool]; g.hit(10);
    expect(g.player.active.damage).toBe(120); expect(g.opponent.active.tools).not.toContain(tool); expect(g.opponent.discard.cards).toContain(tool);
  });
  for (const create of [() => new Houndoom(), () => new Gardevoirex()]) {
    for (const blocked of [false, true]) it(`${create().fullName} only puts its attachment counters on success: ${blocked}`, () => {
      const g = board(); g.state.phase = GamePhase.PLAYER_TURN;
      const card = create(); g.player.active.cards = [card];
      const energy = card instanceof Houndoom ? new SingleStrikeEnergy() : new Energy(); energy.name = card instanceof Houndoom ? 'Single Strike Energy' : 'Psychic Energy';
      const source = card instanceof Houndoom ? g.player.deck : g.player.discard;
      source.cards.push(energy); g.player.bench[0].cards = [new Target([CardTag.SINGLE_STRIKE])]; g.player.stadium.cards = [new FrozenCity()];
      if (blocked) g.opponent.bench[2].cards = [new StopAttachment()];
      g.store.reduceEffect(g.state, new PowerEffect(g.player, card.powers[0], card));
      const prompt = g.state.prompts.find(p => p instanceof AttachEnergyPrompt) as AttachEnergyPrompt; expect(prompt).toBeDefined();
      const result = prompt.decode([{ index: source.cards.indexOf(energy), to: { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 } }], g.state);
      expect(prompt.validate(result, g.state)).toBe(true); g.store.dispatch(new ResolvePromptAction(prompt.id, result), 17);
      expect(g.player.bench[0].damage).toBe(blocked ? 0 : 20);
      expect(g.player.bench[0].cards.includes(energy)).toBe(!blocked); expect(source.cards.includes(energy)).toBe(blocked);
      expect(g.player.energyPlayedTurn).toBe(0);
    });
  }
  for (const hood of [false, true]) it(`Antique Skull Fossil uses its actual passive power without activating discard: ${hood}`, () => {
    const g = board(); const fossil = new AntiqueSkullFossil(); g.opponent.active.cards = [fossil];
    if (hood) g.player.active.tools = [new StealthyHood()];
    g.hit(10);
    expect(g.opponent.active.getPokemonCard() as unknown).toBe(fossil); expect(g.opponent.discard.cards).not.toContain(fossil);
    expect(g.player.active.damage).toBe(hood ? 0 : 30);
  });
  for (const hood of [false, true]) it(`Kingdra legacy Poke-Power is not a modern Ability for Hood: ${hood}`, () => {
    const g = board(); g.state.phase = GamePhase.PLAYER_TURN; const card = new Kingdra(); g.player.active.cards = [card];
    if (hood) g.opponent.active.tools = [new StealthyHood()];
    g.store.reduceEffect(g.state, new PowerEffect(g.player, card.powers[0], card));
    const prompt = g.state.prompts.find(p => p instanceof ChoosePokemonPrompt) as ChoosePokemonPrompt;
    const result = prompt.decode([{ player: PlayerType.TOP_PLAYER, slot: SlotType.ACTIVE, index: 0 }], g.state);
    expect(prompt.validate(result, g.state)).toBe(true); g.store.dispatch(new ResolvePromptAction(prompt.id, result), 17);
    expect(g.opponent.active.damage).toBe(10);
  });
  for (const blocked of [false, true]) it(`Jolteon legacy evolution counters only follow successful evolution: ${blocked}`, () => {
    const g = board(); g.state.phase = GamePhase.PLAYER_TURN; const eevee = new Target(); eevee.name = 'Eevee'; g.player.active.cards = [eevee];
    const card = new Jolteonex(); g.player.hand.cards = [card]; g.opponent.active.tools = [new StealthyHood()];
    if (blocked) g.opponent.bench[2].cards = [new StopEvolution()];
    g.store.reduceEffect(g.state, new EvolveEffect(g.player, g.player.active, card));
    const confirm = g.state.prompts.find(p => p instanceof ConfirmPrompt);
    if (blocked) {
      expect(confirm).toBeUndefined(); expect(g.player.hand.cards).toContain(card); expect(g.opponent.active.damage).toBe(0);
    } else {
      expect(confirm).toBeDefined(); expect(g.player.active.getPokemonCard()).toBe(card);
      g.store.dispatch(new ResolvePromptAction(confirm!.id, true), 17);
      expect(g.opponent.active.damage).toBe(10); expect(g.opponent.bench[0].damage).toBe(10);
    }
  });
  for (const damage of [0, 10]) it(`Magby reflects only positive applied attack damage: ${damage}`, () => {
    const g = board(); const magby = new Magby(); g.opponent.active.cards = [magby];
    g.store.reduceEffect(g.state, new AttackEffect(g.opponent, g.player, magby.attacks[0])); g.state.activePlayer = 0;
    g.hit(damage); expect(g.player.active.damage).toBe(damage > 0 ? 60 : 0);
  });
});
