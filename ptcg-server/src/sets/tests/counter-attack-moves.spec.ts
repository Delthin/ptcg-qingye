import { Store } from '../../game/store/store';
import { State, GamePhase } from '../../game/store/state/state';
import { Player } from '../../game/store/state/player';
import { CardList } from '../../game/store/state/card-list';
import { PokemonCardList } from '../../game/store/state/pokemon-card-list';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { CardType, CardTag } from '../../game/store/card/card-types';
import { PowerEffect, AttackEffect } from '../../game/store/effects/game-effects';
import { PlayerType, SlotType, CardTarget } from '../../game/store/actions/play-card-action';
import { ResolvePromptAction } from '../../game/store/actions/resolve-prompt-action';
import { Prompt } from '../../game/store/prompts/prompt';
import { MoveDamagePrompt } from '../../game/store/prompts/move-damage-prompt';
import { PutDamagePrompt } from '../../game/store/prompts/put-damage-prompt';
import { ChoosePokemonPrompt } from '../../game/store/prompts/choose-pokemon-prompt';
import { Mothim } from '../07-x-and-y/set-fates-collide/mothim';
import { Dusknoir } from '../07-x-and-y/set-flashfire/dusknoir';
import { Cofagrigus } from '../06-black-and-white/set-noble-victories/cofagrigus';
import { Drifloon } from '../07-x-and-y/set-steam-siege/drifloon';
import { XerneasGX } from '../08-sun-and-moon/set-forbidden-light/xerneas-gx';
import { AlolanNinetalesGX } from '../08-sun-and-moon/set-guardians-rising/alolan-ninetales-gx';
import { TeamRocketsWobbuffet } from '../10-scarlet-and-violet/set-destined-rivals/team-rockets-wobbuffet';
import { FlutterMane } from '../10-scarlet-and-violet/set-surging-sparks/flutter-mane-ssp';
import { Duskull } from '../04-diamond-pearl-platinum/set-stormfront/duskull';
import { Patrat } from '../11-mega-evolution/set-chaos-rising/patrat';
import { MistEnergy } from '../10-scarlet-and-violet/set-temporal-forces/mist-energy';

class Target extends PokemonCard {
  public set = 'TEST'; public fullName = 'Counter Movement Target TEST'; public name = 'Counter Movement Target';
  public hp = 300; public cardType = [CardType.COLORLESS];
}
function board(card: PokemonCard) {
  const state = new State(); state.phase = GamePhase.PLAYER_TURN; state.turn = 5;
  state.players = [new Player(), new Player()]; state.players[0].id = 17; state.players[1].id = 29;
  for (const p of state.players) {
    p.active.cards = [new Target()]; p.bench = Array.from({ length: 5 }, () => new PokemonCardList());
    p.bench[0].cards = [new Target()];
    p.prizes = Array.from({ length: 6 }, () => { const prize = new CardList(); prize.cards = [new Target()]; return prize; });
    p.deck.cards = [new Target()];
  }
  const [player, opponent] = state.players; player.active.cards = [card];
  const store = new Store({ onStateChange() {} }, false); store.state = state;
  const attack = (index: number) => store.reduceEffect(state, new AttackEffect(player, opponent, card.attacks[index]));
  const power = () => store.reduceEffect(state, new PowerEffect(player, card.powers[0], card));
  return { state, store, player, opponent, attack, power };
}
const ownActive: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
const ownBench: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 };
const opposingActive: CardTarget = { player: PlayerType.TOP_PLAYER, slot: SlotType.ACTIVE, index: 0 };
const opposingBench: CardTarget = { player: PlayerType.TOP_PLAYER, slot: SlotType.BENCH, index: 0 };
function answer(store: Store, prompt: Prompt<any>, raw: unknown, playerId = 17): void {
  const decoded = prompt.decode(raw, store.state);
  expect(prompt.validate(decoded, store.state)).toBe(true);
  store.dispatch(new ResolvePromptAction(prompt.id, decoded), playerId);
}
function first<T extends Prompt<any>>(store: Store, ctor: new (...args: any[]) => T): T {
  const prompt = store.state.prompts.find(p => p instanceof ctor) as T | undefined;
  expect(prompt).toBeDefined();
  return prompt!;
}

describe('remaining physical counter movement cards', () => {
  it('Mothim moves exactly one counter from Wormadam to an own recipient', () => {
    const g = board(new Mothim()); g.player.bench[0].getPokemonCard()!.name = 'Wormadam'; g.player.bench[0].damage = 20;
    g.power(); const prompt = first(g.store, MoveDamagePrompt);
    expect(prompt.validate([{ from: ownBench, to: opposingActive }], g.state)).toBe(false);
    answer(g.store, prompt, [{ from: ownBench, to: ownActive }]);
    expect(g.player.bench[0].damage).toBe(10); expect(g.player.active.damage).toBe(10); expect(g.opponent.active.damage).toBe(0);
  });
  it('Mothim rejects a damaged source which is not Wormadam', () => {
    const g = board(new Mothim()); g.player.bench[0].getPokemonCard()!.name = 'Wormadam'; g.player.bench[0].damage = 20;
    g.player.bench[1].cards = [new Target()]; g.player.bench[1].damage = 20;
    g.power(); const prompt = first(g.store, MoveDamagePrompt);
    expect(prompt.validate([{ from: { ...ownBench, index: 1 }, to: ownActive }], g.state)).toBe(false);
  });
  it('Dusknoir Shadow Void has the physical user as its only recipient', () => {
    const g = board(new Dusknoir()); g.player.bench[0].damage = 20; g.player.bench[1].cards = [new Target()];
    g.power(); const prompt = first(g.store, MoveDamagePrompt);
    expect(prompt.validate([{ from: ownBench, to: { ...ownBench, index: 1 } }], g.state)).toBe(false);
    answer(g.store, prompt, [{ from: ownBench, to: ownActive }]);
    expect(g.player.active.damage).toBe(10); expect(g.player.bench[0].damage).toBe(10);
  });
  for (const create of [() => new Mothim(), () => new Dusknoir()]) {
    it(`${create().name} cannot bypass Watchful Eye`, () => {
      const g = board(create()); g.player.bench[0].getPokemonCard()!.name = 'Wormadam'; g.player.bench[0].damage = 20;
      g.opponent.bench[1].cards = [new Patrat()]; g.power(); const prompt = first(g.store, MoveDamagePrompt);
      answer(g.store, prompt, [{ from: ownBench, to: ownActive }]);
      expect(g.player.bench[0].damage).toBe(20); expect(g.player.active.damage).toBe(0);
    });
  }
  for (const count of [0, 1, 2, 3]) it(`Cofagrigus lets the attacker choose ${count} counters rather than forcing three`, () => {
    const g = board(new Cofagrigus()); g.player.active.damage = 40;
    g.attack(0); const prompt = first(g.store, MoveDamagePrompt);
    answer(g.store, prompt, Array.from({ length: count }, () => ({ from: ownActive, to: opposingBench })));
    expect(g.player.active.damage).toBe(40 - count * 10); expect(g.opponent.bench[0].damage).toBe(count * 10);
  });
  it('Cofagrigus requires a single source and recipient', () => {
    const g = board(new Cofagrigus()); g.player.active.damage = 40; g.player.bench[0].damage = 20; g.attack(0);
    const prompt = first(g.store, MoveDamagePrompt);
    expect(prompt.validate([{ from: ownActive, to: opposingBench }, { from: ownBench, to: opposingBench }], g.state)).toBe(false);
    expect(prompt.validate([{ from: ownActive, to: opposingBench }, { from: ownActive, to: opposingActive }], g.state)).toBe(false);
  });
  it('Drifloon moves one counter and rejects two', () => {
    const g = board(new Drifloon()); g.player.bench[0].damage = 20; g.attack(0); const prompt = first(g.store, MoveDamagePrompt);
    const transfer = { from: ownBench, to: opposingBench };
    expect(prompt.validate([transfer, transfer], g.state)).toBe(false); answer(g.store, prompt, [transfer]);
    expect(g.player.bench[0].damage).toBe(10); expect(g.opponent.bench[0].damage).toBe(10);
  });
  it('Sanctuary-GX is attack index two and works before either player has taken prizes', () => {
    const g = board(new XerneasGX()); g.player.active.damage = 20; g.player.bench[0].damage = 30; g.opponent.active.damage = 10;
    g.attack(2); expect(g.player.usedGX).toBe(true); expect(g.player.active.damage).toBe(0);
    expect(g.player.bench[0].damage).toBe(0); expect(g.opponent.active.damage).toBe(60);
  });
  it('Aurora Horns is not Sanctuary-GX and does not consume the GX power', () => {
    const g = board(new XerneasGX()); g.player.active.damage = 20; g.player.bench[0].damage = 30;
    g.attack(1); expect(g.player.usedGX).toBe(false); expect(g.player.active.damage).toBe(20);
    expect(g.player.bench[0].damage).toBe(30); expect(g.opponent.active.damage).toBe(0);
  });
  it('Patrat blocks all removals during Sanctuary-GX', () => {
    const g = board(new XerneasGX()); g.player.active.damage = 20; g.player.bench[0].damage = 30;
    g.opponent.bench[1].cards = [new Patrat()]; g.attack(2);
    expect(g.player.usedGX).toBe(true); expect(g.player.active.damage).toBe(20);
    expect(g.player.bench[0].damage).toBe(30); expect(g.opponent.active.damage).toBe(0);
  });
  for (const blocked of [false, true]) it(`Ice Path-GX respects movement prohibition: ${blocked}`, () => {
    const g = board(new AlolanNinetalesGX()); g.player.active.damage = 40;
    if (blocked) g.opponent.bench[1].cards = [new Patrat()]; g.attack(2);
    expect(g.player.usedGX).toBe(true); expect(g.player.active.damage).toBe(blocked ? 40 : 0);
    expect(g.opponent.active.damage).toBe(blocked ? 0 : 40);
  });
  it('Rocket Mirror moves counters only from the selected Team Rocket bench stack', () => {
    const g = board(new TeamRocketsWobbuffet()); g.player.bench[0].getPokemonCard()!.tags = [CardTag.TEAM_ROCKET];
    g.player.bench[0].damage = 30; g.attack(0); answer(g.store, first(g.store, ChoosePokemonPrompt), [ownBench]);
    expect(g.player.bench[0].damage).toBe(0); expect(g.opponent.active.damage).toBe(30);
  });
  it('Rocket Mirror may choose an undamaged eligible Rocket rather than a different damaged one', () => {
    const g = board(new TeamRocketsWobbuffet()); g.player.bench[0].getPokemonCard()!.tags = [CardTag.TEAM_ROCKET];
    g.player.bench[0].damage = 30; const zero = new Target(); zero.tags = [CardTag.TEAM_ROCKET]; g.player.bench[1].cards = [zero];
    g.attack(0); answer(g.store, first(g.store, ChoosePokemonPrompt), [{ ...ownBench, index: 1 }]);
    expect(g.player.bench[0].damage).toBe(30); expect(g.opponent.active.damage).toBe(0);
  });
  for (const protection of ['none', 'Patrat', 'Mist Energy']) it(`Perplexing Transfer respects ${protection}`, () => {
    const g = board(new FlutterMane()); g.player.bench[0].getPokemonCard()!.tags = [CardTag.ANCIENT]; g.player.bench[0].damage = 30;
    if (protection === 'Patrat') g.opponent.bench[1].cards = [new Patrat()];
    if (protection === 'Mist Energy') { const energy = new MistEnergy(); g.opponent.active.cards.push(energy); g.opponent.active.energies.cards.push(energy); }
    g.attack(0); answer(g.store, first(g.store, ChoosePokemonPrompt), [ownBench]);
    expect(g.player.bench[0].damage).toBe(protection === 'Patrat' ? 30 : 0);
    expect(g.opponent.active.damage).toBe(protection === 'none' ? 30 : 0);
  });
  for (const count of [0, 1, 2, 3]) it(`Counting Song places the chosen ${count} on each side`, () => {
    const g = board(new Duskull()); g.attack(0); const prompt = first(g.store, PutDamagePrompt);
    answer(g.store, prompt, count === 0 ? [] : [{ target: ownActive, damage: count * 10 }]);
    expect(g.player.active.damage).toBe(count * 10); expect(g.opponent.active.damage).toBe(count * 10);
  });
});
