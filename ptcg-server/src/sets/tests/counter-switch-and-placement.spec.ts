import { Store } from '../../game/store/store';
import { State, GamePhase } from '../../game/store/state/state';
import { Player } from '../../game/store/state/player';
import { CardList } from '../../game/store/state/card-list';
import { PokemonCardList } from '../../game/store/state/pokemon-card-list';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { EnergyCard } from '../../game/store/card/energy-card';
import { CardType } from '../../game/store/card/card-types';
import { PowerEffect, AttackEffect, EvolveEffect } from '../../game/store/effects/game-effects';
import { DiscardCardsEffect } from '../../game/store/effects/attack-effects';
import { PlayPokemonFromDiscardEffect } from '../../game/store/effects/play-card-effects';
import { Effect } from '../../game/store/effects/effect';
import { PlayerType, SlotType, CardTarget } from '../../game/store/actions/play-card-action';
import { ResolvePromptAction } from '../../game/store/actions/resolve-prompt-action';
import { Prompt } from '../../game/store/prompts/prompt';
import { MoveDamagePrompt } from '../../game/store/prompts/move-damage-prompt';
import { ChoosePokemonPrompt } from '../../game/store/prompts/choose-pokemon-prompt';
import { ChooseCardsPrompt } from '../../game/store/prompts/choose-cards-prompt';
import { ChooseEnergyPrompt } from '../../game/store/prompts/choose-energy-prompt';
import { Whimsicott } from '../07-x-and-y/set-ancient-origins/whimsicott';
import { Altaria } from '../09-sword-and-shield/set-silver-tempest/altaria';
import { Liepard } from '../10-scarlet-and-violet/set-paradox-rift/liepard-par';
import { Ninetales } from '../11-mega-evolution/set-chaos-rising/ninetales';
import { Yamask } from '../06-black-and-white/set-plasma-freeze/yamask';
import { Rotom } from '../07-x-and-y/set-fates-collide/rotom';
import { Cresselia as CresseliaLOR } from '../09-sword-and-shield/set-lost-origin/cresselia';
import { Cresselia as CresseliaUPR } from '../08-sun-and-moon/set-ultra-prism/cresselia';
import { MewtwoEx2 } from '../07-x-and-y/set-breakthrough/mewtwo-ex-2';
import { WobbuffetV } from '../09-sword-and-shield/set-sword-and-shield/wobbuffet-v';
import { ArceusGrass } from '../04-diamond-pearl-platinum/set-arceus/arceus-grass';
import { Grumpig } from '../07-x-and-y/set-fates-collide/grumpig';
import { Revive } from '../set-base-set/revive';
import { Starmie as StarmieMEW } from '../10-scarlet-and-violet/set-pokemon-151/starmie';
import { Starmie as StarmiePAF } from '../10-scarlet-and-violet/set-paldean-fates/starmie';
import { Primeape } from '../10-scarlet-and-violet/set-scarlet-and-violet/primeape';
import { Annihilapeex } from '../10-scarlet-and-violet/set-scarlet-and-violet-promos/annihilape-ex';
import { AspertiaCityGym } from '../06-black-and-white/set-boundaries-crossed/aspertia-city-gym';
import { BattleColosseum } from '../11-mega-evolution/set-phantasmal-flames/battle-colosseum';
import { Patrat } from '../11-mega-evolution/set-chaos-rising/patrat';
import { MistEnergy } from '../10-scarlet-and-violet/set-temporal-forces/mist-energy';
import { StealthyHood } from '../08-sun-and-moon/set-unbroken-bonds/stealthy-hood';
import { playTrainerCard } from './card-test-helpers';

class Target extends PokemonCard {
  public set = 'TEST'; public fullName = 'Counter Switch Target TEST'; public name = 'Counter Switch Target';
  public hp = 300; public cardType = [CardType.COLORLESS];
}
class TestEnergy extends EnergyCard {
  public set = 'TEST'; public fullName = 'Counter Switch Energy TEST'; public name = 'Counter Switch Energy'; public provides = [CardType.PSYCHIC];
}
class BlockDiscard extends Target {
  public reduceEffect(_store: Store, state: State, effect: Effect): State {
    if (effect instanceof DiscardCardsEffect) effect.preventDefault = true;
    return state;
  }
}
class BlockSummon extends Target {
  public reduceEffect(_store: Store, state: State, effect: Effect): State {
    if (effect instanceof PlayPokemonFromDiscardEffect) effect.preventDefault = true;
    return state;
  }
}
function board(card: PokemonCard) {
  const state = new State(); state.phase = GamePhase.PLAYER_TURN; state.turn = 5;
  state.players = [new Player(), new Player()]; state.players[0].id = 17; state.players[1].id = 29;
  for (const p of state.players) {
    p.active.cards = [new Target()]; p.bench = Array.from({ length: 5 }, () => new PokemonCardList()); p.bench[0].cards = [new Target()];
    p.prizes = Array.from({ length: 6 }, () => { const prize = new CardList(); prize.cards = [new Target()]; return prize; }); p.deck.cards = [new Target()];
  }
  const [player, opponent] = state.players; player.active.cards = [card];
  const store = new Store({ onStateChange() {} }, false); store.state = state;
  const attack = (index: number) => store.reduceEffect(state, new AttackEffect(player, opponent, card.attacks[index]));
  return { state, store, player, opponent, attack };
}
const ownBench: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 };
const opposingActive: CardTarget = { player: PlayerType.TOP_PLAYER, slot: SlotType.ACTIVE, index: 0 };
const opposingBench: CardTarget = { player: PlayerType.TOP_PLAYER, slot: SlotType.BENCH, index: 0 };
function first<T extends Prompt<any>>(store: Store, ctor: new (...args: any[]) => T): T {
  const prompt = store.state.prompts.find(p => p instanceof ctor) as T | undefined; expect(prompt).toBeDefined(); return prompt!;
}
function answer(store: Store, prompt: Prompt<any>, raw: unknown): void {
  const decoded = prompt.decode(raw, store.state); expect(prompt.validate(decoded, store.state)).toBe(true);
  store.dispatch(new ResolvePromptAction(prompt.id, decoded), 17);
}
function protect(g: ReturnType<typeof board>, mode: string): void {
  if (mode === 'Patrat') g.opponent.bench[3].cards = [new Patrat()];
  if (mode === 'Mist') { const energy = new MistEnergy(); g.opponent.active.cards.push(energy); g.opponent.active.energies.cards.push(energy); }
}

describe('counter move-all switch and placement contracts', () => {
  const benchTransfers = [() => new Whimsicott(), () => new Altaria(), () => new Liepard(), () => new Ninetales()];
  for (const create of benchTransfers) {
    for (const protection of ['none', 'Patrat', 'Mist']) it(`${create().fullName} transfer obeys ${protection}`, () => {
      const g = board(create()); g.player.bench[0].damage = 30; protect(g, protection);
      g.attack(0); answer(g.store, first(g.store, ChoosePokemonPrompt), [ownBench]);
      expect(g.player.bench[0].damage).toBe(protection === 'Patrat' ? 30 : 0);
      expect(g.opponent.active.damage).toBe(protection === 'none' ? 30 : 0);
    });
    it(`${create().fullName} allows a legal undamaged bench choice`, () => {
      const g = board(create()); g.player.bench[0].damage = 30; g.player.bench[1].cards = [new Target()];
      g.attack(0); answer(g.store, first(g.store, ChoosePokemonPrompt), [{ ...ownBench, index: 1 }]);
      expect(g.player.bench[0].damage).toBe(30); expect(g.opponent.active.damage).toBe(0);
    });
  }
  for (const blocked of [false, true]) it(`Yamask Transfer Pain obeys movement prohibition: ${blocked}`, () => {
    const g = board(new Yamask()); g.player.bench[0].damage = 20; if (blocked) protect(g, 'Patrat');
    g.attack(0); answer(g.store, first(g.store, MoveDamagePrompt), [{ from: ownBench, to: opposingActive }]);
    expect(g.player.bench[0].damage).toBe(blocked ? 20 : 10); expect(g.opponent.active.damage).toBe(blocked ? 0 : 10);
  });
  for (const blocked of [false, true]) it(`Rotom moves two from each source only when permitted: ${blocked}`, () => {
    const g = board(new Rotom()); g.player.active.damage = 30; g.player.bench[0].damage = 10; if (blocked) protect(g, 'Patrat');
    g.attack(1); expect(g.player.active.damage).toBe(blocked ? 30 : 10); expect(g.player.bench[0].damage).toBe(blocked ? 10 : 0);
    expect(g.opponent.active.damage).toBe(blocked ? 0 : 30);
  });
  for (const mode of ['none', 'Patrat', 'Battle Cage']) it(`Moonglow Reverse settles sources after choosing a target: ${mode}`, () => {
    const g = board(new CresseliaLOR()); g.player.active.damage = 30; g.player.bench[0].damage = 10;
    if (mode === 'Patrat') protect(g, mode); if (mode === 'Battle Cage') g.player.stadium.cards = [new BattleColosseum()];
    g.attack(0); expect(g.player.active.damage).toBe(30); expect(g.player.bench[0].damage).toBe(10);
    answer(g.store, first(g.store, ChoosePokemonPrompt), [opposingBench]);
    expect(g.player.active.damage).toBe(mode === 'Patrat' ? 30 : 10); expect(g.player.bench[0].damage).toBe(mode === 'Patrat' ? 10 : 0);
    expect(g.opponent.bench[0].damage).toBe(mode === 'none' ? 30 : 0);
  });
  for (const [create, index] of [[() => new MewtwoEx2(), 1], [() => new WobbuffetV(), 0]] as const) {
    for (const mode of ['none', 'Patrat', 'Mist']) it(`${create().fullName} counter switch respects ${mode}`, () => {
      const g = board(create()); g.player.active.damage = 20; g.opponent.active.damage = 50; protect(g, mode); g.attack(index);
      expect(g.player.active.damage).toBe(mode === 'none' ? 50 : mode === 'Patrat' ? 20 : 0);
      expect(g.opponent.active.damage).toBe(mode === 'none' ? 20 : 50);
    });
  }
  for (const mode of ['none', 'Patrat', 'Mist', 'blocked discard']) it(`Lunar Payback waits for an actual discarded Energy: ${mode}`, () => {
    const g = board(new CresseliaUPR()); g.player.active.damage = 20; g.opponent.active.damage = 50; protect(g, mode);
    if (mode === 'blocked discard') g.player.bench[2].cards = [new BlockDiscard()];
    const energy = new TestEnergy(); g.player.active.cards.push(energy); g.player.active.energies.cards.push(energy);
    g.attack(0); expect(g.player.active.damage).toBe(20); expect(g.opponent.active.damage).toBe(50);
    answer(g.store, first(g.store, ChooseEnergyPrompt), [0]);
    expect(g.player.active.cards.includes(energy)).toBe(mode === 'blocked discard');
    expect(g.player.active.damage).toBe(mode === 'none' ? 50 : mode === 'Mist' ? 0 : 20);
    expect(g.opponent.active.damage).toBe(mode === 'none' ? 20 : 50);
  });
  it('Lunar Payback with no Energy does not switch damage counters', () => {
    const g = board(new CresseliaUPR()); g.player.active.damage = 20; g.opponent.active.damage = 50; g.attack(0);
    expect(g.player.active.damage).toBe(20); expect(g.opponent.active.damage).toBe(50); expect(g.state.prompts.length).toBe(0);
  });
  it('Grass Arceus removes up to thirty without creating negative damage', () => {
    const g = board(new ArceusGrass()); g.player.active.damage = 20; g.player.bench[0].damage = 10;
    g.player.bench[1].cards = [new Target()]; g.player.bench[1].damage = 40; g.attack(0);
    expect(g.player.active.damage).toBe(20); expect(g.player.bench[0].damage).toBe(0); expect(g.player.bench[1].damage).toBe(10);
  });
  for (const mode of ['none', 'Battle Cage', 'blocked summon']) it(`Head Walking places counters only after its summon and obeys ${mode}`, () => {
    const g = board(new Grumpig()), target = new Target(); g.opponent.discard.cards = [target];
    if (mode === 'Battle Cage') g.player.stadium.cards = [new BattleColosseum()];
    if (mode === 'blocked summon') g.player.bench[2].cards = [new BlockSummon()];
    g.attack(0); answer(g.store, first(g.store, ChooseCardsPrompt), [0]);
    expect(g.opponent.bench[1].cards.includes(target)).toBe(mode !== 'blocked summon');
    expect(g.opponent.bench[1].damage).toBe(mode === 'none' ? 30 : 0);
  });
  for (const extraHP of [false, true]) it(`Revive uses current maximum HP and a real discard summon: ${extraHP}`, () => {
    const g = board(new Target()), revive = new Revive(), target = new Target(); target.hp = 70;
    if (extraHP) g.player.stadium.cards = [new AspertiaCityGym()];
    g.player.hand.cards = [revive]; g.player.discard.cards = [target]; playTrainerCard(g.store, g.state, 0, revive.fullName);
    answer(g.store, first(g.store, ChooseCardsPrompt), [0]);
    expect(g.player.bench[1].cards.includes(target)).toBe(true); expect(g.player.bench[1].damage).toBe(extraHP ? 40 : 30);
    expect(g.player.discard.cards).toContain(revive); expect(g.player.supporter.cards).not.toContain(revive);
  });
  for (const create of [() => new StarmieMEW(), () => new StarmiePAF()]) {
    for (const blocked of [false, true]) it(`${create().fullName} discards itself only after counters were placed: ${blocked}`, () => {
      const card = create(), g = board(card); g.player.bench[0].cards = [card]; g.player.active.cards = [new Target()];
      if (blocked) { const hood = new StealthyHood(); g.opponent.active.tools.push(hood); }
      g.store.reduceEffect(g.state, new PowerEffect(g.player, card.powers[0], card));
      answer(g.store, first(g.store, ChoosePokemonPrompt), [opposingActive]);
      expect(g.opponent.active.damage).toBe(blocked ? 0 : 20); expect(g.player.discard.cards.includes(card)).toBe(!blocked);
      expect(g.player.bench[0].cards.includes(card)).toBe(blocked); expect(g.opponent.getPrizeLeft()).toBe(6);
    });
  }
  it('Annihilape ex evolves from the actual Primeape card', () => {
    const g = board(new Primeape()), evolved = new Annihilapeex(); g.player.hand.cards = [evolved];
    g.store.reduceEffect(g.state, new EvolveEffect(g.player, g.player.active, evolved));
    expect(g.player.active.getPokemonCard()).toBe(evolved); expect(g.player.hand.cards).not.toContain(evolved);
  });
});
