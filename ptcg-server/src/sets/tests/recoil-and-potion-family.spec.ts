import { Store } from '../../game/store/store';
import { State, GamePhase } from '../../game/store/state/state';
import { Player } from '../../game/store/state/player';
import { CardList } from '../../game/store/state/card-list';
import { PokemonCardList } from '../../game/store/state/pokemon-card-list';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { EnergyCard } from '../../game/store/card/energy-card';
import { TrainerCard } from '../../game/store/card/trainer-card';
import { CardType, SpecialCondition } from '../../game/store/card/card-types';
import { AttackAction } from '../../game/store/actions/game-actions';
import { PlayCardAction, PlayerType, SlotType } from '../../game/store/actions/play-card-action';
import { ResolvePromptAction } from '../../game/store/actions/resolve-prompt-action';
import { Prompt } from '../../game/store/prompts/prompt';
import { WaitPrompt } from '../../game/store/prompts/wait-prompt';
import { CoinFlipPrompt } from '../../game/store/prompts/coin-flip-prompt';
import { ChoosePokemonPrompt } from '../../game/store/prompts/choose-pokemon-prompt';
import { ChoosePrizePrompt } from '../../game/store/prompts/choose-prize-prompt';
import { PutDamageEffect } from '../../game/store/effects/attack-effects';
import { AttackEffect } from '../../game/store/effects/game-effects';
import { THIS_ATTACK_DOES_X_DAMAGE_TO_EACH_OF_YOUR_OPPONENTS_POKEMON, THIS_ATTACK_DOES_X_DAMAGE_TO_X_OF_YOUR_OPPONENTS_POKEMON } from '../../game/store/prefabs/prefabs';
import { Mankey } from '../10-scarlet-and-violet/set-scarlet-and-violet/mankey';
import { Cetoddle } from '../10-scarlet-and-violet/set-paldea-evolved/cetoddle';
import { Wobbuffet } from '../03-ex-ruby-and-sapphire/set-ex-sandstorm/wobbuffet';
import { Magnemite } from '../set-base-set/magnemite';
import { Magneton as MagnetonBS } from '../set-base-set/magneton';
import { Magneton as MagnetonFO } from '../set-fossil/magneton';
import { Nidoqueen2 } from '../07-x-and-y/set-primal-clash/nidoqueen-2';
import { Steelix } from '../08-sun-and-moon/set-lost-thunder/steelix';
import { Lapras } from '../10-scarlet-and-violet/set-obsidian-flames/lapras-obf';
import { DoubleTurboEnergy } from '../09-sword-and-shield/set-brilliant-stars/double-turbo-energy';
import { CoatingMetalEnergy } from '../09-sword-and-shield/set-vivid-voltage/coating-metal-energy';
import { TempleofSinnoh } from '../09-sword-and-shield/set-astral-radiance/temple-of-sinnoh';
import { Potion as PotionBS } from '../set-base-set/potion';
import { Potion as PotionBCR } from '../06-black-and-white/set-boundaries-crossed/potion';
import { Potion as PotionSVI } from '../10-scarlet-and-violet/set-scarlet-and-violet/potion';
import { PotionBLW } from '../06-black-and-white/set-black-and-white/other-prints';
import { PotionBKP } from '../07-x-and-y/set-breakpoint/other-prints';
import { PotionEVO } from '../07-x-and-y/set-evolutions/other-prints';
import { PotionSUM } from '../08-sun-and-moon/set-sun-and-moon/other-prints';
import { PotionSSH } from '../09-sword-and-shield/set-sword-and-shield/other-prints';
import { PotionCPA } from '../09-sword-and-shield/set-champions-path/other-prints';
import { PotionCRZ } from '../09-sword-and-shield/set-crown-zenith/other-prints';
import { PotionMC } from '../11-mega-evolution/set-ascended-heroes/other-prints';
import { PotionPOR } from '../11-mega-evolution/set-perfect-order/other-prints';
import { PotionCG } from '../03-ex-ruby-and-sapphire/set-ex-crystal-guardians/other-prints';
import { PotionDP } from '../04-diamond-pearl-platinum/set-diamond-and-pearl/other-prints';
import { PotionSW } from '../04-diamond-pearl-platinum/set-secret-wonders/other-prints';
import { PotionSF } from '../04-diamond-pearl-platinum/set-stormfront/other-prints';

class FamilyTarget extends PokemonCard {
  public set = 'TEST'; public name = 'Family Target'; public fullName = 'Family Target TEST'; public hp = 1000;
  public cardType = [CardType.COLORLESS];
  public weakness: PokemonCard['weakness'] = [];
  public resistance: PokemonCard['resistance'] = [];
}
class FamilyEnergy extends EnergyCard {
  public set = 'TEST'; public name = 'Test Energy'; public fullName = 'Family Energy TEST'; public provides = [CardType.ANY];
}
function fixture(card: PokemonCard, attackingIndex = 0) {
  const state = new State(); state.phase = GamePhase.PLAYER_TURN; state.turn = 5; state.activePlayer = attackingIndex;
  state.players = [new Player(), new Player()]; let id = 1000;
  const identify = <T extends PokemonCard | EnergyCard | TrainerCard>(value: T): T => { value.id = id++; return value; };
  for (const [i, player] of state.players.entries()) {
    player.id = i === 0 ? 17 : 29; player.active.cards = [identify(new FamilyTarget())];
    player.bench = Array.from({ length: 5 }, () => new PokemonCardList());
    for (const index of [0, 1]) player.bench[index].cards = [identify(new FamilyTarget())];
    player.deck.cards = Array.from({ length: 10 }, () => identify(new FamilyTarget()));
    player.prizes = Array.from({ length: 6 }, () => { const list = new CardList(); list.cards = [identify(new FamilyTarget())]; return list; });
  }
  const player = state.players[attackingIndex], opponent = state.players[1 - attackingIndex];
  player.active.cards = [identify(card), ...Array.from({ length: 8 }, () => identify(new FamilyEnergy()))];
  const store = new Store({ onStateChange() {} }, false); store.state = state;
  return { store, state, player, opponent, card, identify };
}
function finish(g: ReturnType<typeof fixture>, healing = false) {
  for (let step = 0; g.store.hasPrompts() && step < 20; step++) {
    const prompt = g.state.prompts.find(p => p.result === undefined);
    if (!prompt) throw new Error('Pending prompt not found');
    let raw: unknown;
    if (prompt instanceof WaitPrompt) raw = true;
    else if (prompt instanceof CoinFlipPrompt) raw = false;
    else if (prompt instanceof ChoosePrizePrompt) raw = [0];
    else if (prompt instanceof ChoosePokemonPrompt) raw = [{ player: PlayerType.BOTTOM_PLAYER, slot: healing ? SlotType.ACTIVE : SlotType.BENCH, index: 0 }];
    else throw new Error('Unexpected prompt: ' + prompt.type);
    const responsePrompt: Prompt<unknown> = prompt;
    const decoded = responsePrompt.decode(raw, g.state);
    expect(responsePrompt.validate(decoded, g.state)).toBe(true);
    g.store.dispatch(new ResolvePromptAction(prompt.id, decoded), prompt.playerId);
  }
  expect(g.store.hasPrompts()).toBe(false);
}
function attack(g: ReturnType<typeof fixture>, index: number) {
  g.store.dispatch(new AttackAction(g.player.id, g.card.attacks[index].name)); finish(g);
}

describe('recoil damage stages and related support effects', () => {
  for (const attackingIndex of [0, 1]) it(`Wobbuffet Flip Over keeps self-only weak/resistance exception local for player ${attackingIndex}`, () => {
    const g = fixture(new Wobbuffet(), attackingIndex);
    g.opponent.active.getPokemonCard()!.weakness = [{ type: CardType.PSYCHIC }];
    attack(g, 0);
    expect(g.player.active.damage).toBe(10);
    expect(g.opponent.active.damage).toBe(100);
  });
  it('Cetoddle Rest heals sixty, sleeps, and does not damage the opponent bench', () => {
    const g = fixture(new Cetoddle()); g.player.active.damage = 80;
    attack(g, 0);
    expect(g.player.active.damage).toBe(20);
    expect(g.player.active.specialConditions.includes(SpecialCondition.ASLEEP)).toBe(true);
    expect(g.opponent.active.damage).toBe(0);
    expect(g.opponent.bench[0].damage).toBe(0);
    expect(g.opponent.bench[1].damage).toBe(0);
  });
  it('Cetoddle Double-Edge deals fifty to the opponent and ten to itself', () => {
    const g = fixture(new Cetoddle()); attack(g, 1);
    expect(g.player.active.damage).toBe(10);
    expect(g.opponent.active.damage).toBe(50);
  });
  it('Double Turbo reduces only opponent damage, not Mankey recoil', () => {
    const g = fixture(new Mankey()); g.player.active.cards.push(g.identify(new DoubleTurboEnergy()));
    attack(g, 0);
    expect(g.player.active.damage).toBe(10);
    expect(g.opponent.active.damage).toBe(10);
  });
  for (const bench of [false, true]) it(`Double Turbo also applies once to direct PutDamageEffect (${bench ? 'bench' : 'active'})`, () => {
    const g = fixture(new Mankey()); g.player.active.cards.push(g.identify(new DoubleTurboEnergy()));
    const target = bench ? g.opponent.bench[0] : g.opponent.active;
    target.getPokemonCard()!.weakness = [{ type: CardType.FIGHTING }];
    const root = new AttackEffect(g.player, g.opponent, g.card.attacks[0]);
    const damage = new PutDamageEffect(root, 50); damage.target = target;
    g.store.reduceEffect(g.state, damage);
    expect(target.damage).toBe(bench ? 30 : 60);
  });
  for (const resistance of [false, true]) it(`direct self PutDamage uses active ${resistance ? 'resistance' : 'weakness'} too`, () => {
    const g = fixture(new Mankey());
    if (resistance) g.card.resistance = [{ type: CardType.FIGHTING, value: -30 }];
    else g.card.weakness = [{ type: CardType.FIGHTING }];
    const root = new AttackEffect(g.player, g.opponent, g.card.attacks[0]);
    const damage = new PutDamageEffect(root, 10); damage.target = g.player.active;
    g.store.reduceEffect(g.state, damage);
    expect(g.player.active.damage).toBe(resistance ? 0 : 20);
    expect(g.opponent.active.damage).toBe(0);
  });
  it('Coating Metal protects only its holder and cannot remove the opponent weakness', () => {
    const g = fixture(new Steelix()); g.player.active.cards.push(g.identify(new CoatingMetalEnergy()));
    g.opponent.active.getPokemonCard()!.weakness = [{ type: CardType.METAL }];
    attack(g, 1);
    expect(g.player.active.damage).toBe(50);
    expect(g.opponent.active.damage).toBe(340);
  });
  it('Magnemite Selfdestruct ignores weakness and resistance for both benches but still deals main damage', () => {
    const g = fixture(new Magnemite());
    for (const player of g.state.players) for (const index of [2, 3, 4]) player.bench[index].cards = [g.identify(new FamilyTarget())];
    const ownBench = g.player.bench[0].getPokemonCard()!;
    ownBench.resistance = [{ type: CardType.LIGHTNING, value: -30 }];
    g.opponent.bench[0].getPokemonCard()!.weakness = [{ type: CardType.LIGHTNING }];
    attack(g, 1);
    const ownList = [g.player.active, ...g.player.bench].find(list => list.cards.includes(ownBench));
    expect(ownList!.damage).toBe(10);
    expect(g.opponent.bench[0].damage).toBe(10);
    expect(g.opponent.active.damage).toBe(40);
    expect(g.player.discard.cards.includes(g.card)).toBe(true);
  });
  for (const create of [() => new Magnemite(), () => new MagnetonBS(), () => new MagnetonFO()]) it(`${create().fullName} Selfdestruct tolerates empty bench slots and keeps main damage`, () => {
    const g = fixture(create()); attack(g, 1);
    expect(g.opponent.active.damage).toBe(g.card.attacks[1].damage);
    expect(g.opponent.bench[0].damage).toBe(g.card instanceof Magnemite ? 10 : 20);
    expect(g.player.discard.cards.includes(g.card)).toBe(true);
  });
  for (const resistance of [false, true]) it(`Nidoqueen self-only no-weakness exception preserves main weakness and ${resistance ? 'self resistance' : 'self amount'}`, () => {
    const g = fixture(new Nidoqueen2()); g.opponent.active.getPokemonCard()!.weakness = [{ type: CardType.PSYCHIC }];
    if (resistance) g.card.resistance = [{ type: CardType.PSYCHIC, value: -10 }];
    attack(g, 1);
    expect(g.player.active.damage).toBe(resistance ? 10 : 20);
    expect(g.opponent.active.damage).toBe(140);
  });
  it('two Double Turbo cards each reduce main damage once and never recoil', () => {
    const g = fixture(new Mankey()); g.player.active.cards.push(g.identify(new DoubleTurboEnergy()), g.identify(new DoubleTurboEnergy()));
    attack(g, 0); expect(g.player.active.damage).toBe(10); expect(g.opponent.active.damage).toBe(0);
  });
  it('active self-damage still uses weakness under official B-09', () => {
    const g = fixture(new Mankey()); g.card.weakness = [{ type: CardType.FIGHTING }]; attack(g, 0);
    expect(g.player.active.damage).toBe(20); expect(g.opponent.active.damage).toBe(30);
  });
  it('active self-damage still uses resistance under official B-09', () => {
    const g = fixture(new Mankey()); g.card.resistance = [{ type: CardType.FIGHTING, value: -30 }]; attack(g, 0);
    expect(g.player.active.damage).toBe(0); expect(g.opponent.active.damage).toBe(30);
  });
  it('Lapras Hail applies weakness only to the active target', () => {
    const g = fixture(new Lapras());
    g.opponent.active.getPokemonCard()!.weakness = [{ type: CardType.WATER }];
    g.opponent.bench[0].getPokemonCard()!.weakness = [{ type: CardType.WATER }]; attack(g, 0);
    expect(g.opponent.active.damage).toBe(20); expect(g.opponent.bench[0].damage).toBe(10);
  });
  it('Lapras Hail with Double Turbo is reduced for active and bench targets', () => {
    const g = fixture(new Lapras()); g.player.active.cards.push(g.identify(new DoubleTurboEnergy())); attack(g, 0);
    expect(g.opponent.active.damage).toBe(0); expect(g.opponent.bench[0].damage).toBe(0);
  });
  it('selected-target helper applies attacker reduction and active weakness exactly once', () => {
    const g = fixture(new Mankey()), root = new AttackEffect(g.player, g.opponent, g.card.attacks[0]);
    g.player.active.cards.push(g.identify(new DoubleTurboEnergy()));
    g.opponent.active.getPokemonCard()!.weakness = [{ type: CardType.FIGHTING }];
    THIS_ATTACK_DOES_X_DAMAGE_TO_X_OF_YOUR_OPPONENTS_POKEMON(50, root, g.store, g.state, 1, 1, true, [SlotType.ACTIVE, SlotType.BENCH]);
    const prompt = g.state.prompts.find(p => p.result === undefined);
    if (!(prompt instanceof ChoosePokemonPrompt)) throw new Error('Expected actual target-selection prompt');
    const decoded = prompt.decode([{ player: PlayerType.TOP_PLAYER, slot: SlotType.ACTIVE, index: 0 }], g.state);
    expect(prompt.validate(decoded, g.state)).toBe(true);
    g.store.dispatch(new ResolvePromptAction(prompt.id, decoded), prompt.playerId);
    expect(g.opponent.active.damage).toBe(60);
    expect(g.opponent.bench[0].damage).toBe(0);
    expect(g.store.hasPrompts()).toBe(false);
  });
  it('bench-only group-damage helper never also hits the active Pokemon', () => {
    const g = fixture(new Lapras()), root = new AttackEffect(g.player, g.opponent, g.card.attacks[0]);
    THIS_ATTACK_DOES_X_DAMAGE_TO_EACH_OF_YOUR_OPPONENTS_POKEMON(10, root, g.store, g.state, true);
    expect(g.opponent.active.damage).toBe(0); expect(g.opponent.bench[0].damage).toBe(10);
  });
});

describe('special energy target scopes', () => {
  it('suppressed Double Turbo does not reduce damage', () => {
    const g = fixture(new Mankey()); g.player.active.cards.push(g.identify(new DoubleTurboEnergy()));
    g.player.stadium.cards = [g.identify(new TempleofSinnoh())]; attack(g, 0);
    expect(g.player.active.damage).toBe(10); expect(g.opponent.active.damage).toBe(30);
  });
  for (const blocked of [false, true]) it(`Coating Metal still protects its actual holder unless suppressed (${blocked})`, () => {
    const source = new FamilyTarget(); source.cardType = [CardType.FIRE];
    source.attacks = [{ name: 'Fire Test', cost: [], damage: 50, text: '' }];
    const g = fixture(source); g.opponent.active.cards = [g.identify(new Steelix()), g.identify(new CoatingMetalEnergy())];
    if (blocked) g.player.stadium.cards = [g.identify(new TempleofSinnoh())];
    attack(g, 0);
    expect(g.opponent.active.damage).toBe(blocked ? 100 : 50);
    expect(g.player.active.damage).toBe(0);
  });
});

describe('Potion printed-version healing amounts through real trainer play', () => {
  const modern: Array<() => TrainerCard> = [() => new PotionBLW(), () => new PotionBCR(), () => new PotionBKP(), () => new PotionEVO(), () => new PotionSUM(), () => new PotionSSH(), () => new PotionCPA(), () => new PotionCRZ(), () => new PotionSVI(), () => new PotionMC(), () => new PotionPOR()];
  const legacy: Array<() => TrainerCard> = [() => new PotionBS(), () => new PotionCG(), () => new PotionDP(), () => new PotionSW(), () => new PotionSF()];
  for (const [creators, amount] of [[modern, 30], [legacy, 20]] as const) for (const create of creators) it(`${create().fullName} heals printed ${amount} from damage eighty`, () => {
    const g = fixture(new FamilyTarget()), potion = g.identify(create()); g.player.active.damage = 80;
    g.player.hand.cards.push(potion);
    g.store.dispatch(new PlayCardAction(g.player.id, 0, { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 }));
    finish(g, true);
    expect(g.player.active.damage).toBe(80 - amount);
    expect(g.player.discard.cards.includes(potion)).toBe(true);
    expect(g.player.hand.cards.includes(potion)).toBe(false);
    expect(g.player.supporter.cards.includes(potion)).toBe(false);
  });
});
