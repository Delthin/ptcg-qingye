import { Store } from '../../game/store/store';
import { State, GamePhase } from '../../game/store/state/state';
import { Player } from '../../game/store/state/player';
import { PokemonCardList } from '../../game/store/state/pokemon-card-list';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { EnergyCard } from '../../game/store/card/energy-card';
import { CardType, Stage } from '../../game/store/card/card-types';
import { PowerType } from '../../game/store/card/pokemon-types';
import { AttackEffect, EvolveEffect } from '../../game/store/effects/game-effects';
import { PutDamageEffect } from '../../game/store/effects/attack-effects';
import { AttachEnergyEffect } from '../../game/store/effects/play-card-effects';
import { BetweenTurnsEffect } from '../../game/store/effects/game-phase-effects';
import { SpecialCondition } from '../../game/store/card/card-types';
import { Effect } from '../../game/store/effects/effect';
import { StealthyHood } from '../08-sun-and-moon/set-unbroken-bonds/stealthy-hood';
import { IronJugulis } from '../10-scarlet-and-violet/set-temporal-forces/iron-jugulis';
import { Orthwormex } from '../10-scarlet-and-violet/set-stellar-crown/orthworm-ex';
import { Maractus } from '../10-scarlet-and-violet/set-journey-together/maractus';
import { Mismagius } from '../09-sword-and-shield/set-silver-tempest/mismagius';
import { Ampharos } from '../06-black-and-white/set-dragons-exalted/ampharos';
import { Gengar } from '../08-sun-and-moon/set-crimson-invasion/gengar';
import { GalarianCursolaV } from '../09-sword-and-shield/set-champions-path/galarian-cursola-v';
import { Arctozolt } from '../09-sword-and-shield/set-darkness-ablaze/arctozolt';
import { Minun } from '../10-scarlet-and-violet/set-paradox-rift/minun';
import { Gengarex } from '../10-scarlet-and-violet/set-temporal-forces/gengar-ex';
import { Jolteon } from '../set-hidden-fates/jolteon';
import { Parasect } from '../08-sun-and-moon/set-team-up/parasect';
import { TeamRocketsAmpharos } from '../10-scarlet-and-violet/set-destined-rivals/team-rockets-ampharos';
import { DarkAmpharos } from '../03-ex-ruby-and-sapphire/set-ex-team-rocket-returns/dark-ampharos';

class Target extends PokemonCard {
  public set = 'TEST'; public fullName = 'Placement Target TEST'; public name = 'Placement Target';
  public hp = 300; public cardType = [CardType.COLORLESS];
  public powers = [{ name: 'Test Power', powerType: PowerType.ABILITY, text: '' }];
  public attacks = [{ name: 'Test Attack', cost: [], damage: 0, text: '' }];
}
class Evolved extends Target { public stage = Stage.STAGE_1; public name = 'Evolved Target'; public fullName = 'Evolved Target TEST'; public evolvesFrom = 'Placement Target'; }
class TestEnergy extends EnergyCard { public set = 'TEST'; public fullName = 'Placement Energy TEST'; public name = 'Placement Energy'; public provides = [CardType.METAL]; }
class DoubleMetal extends TestEnergy { public provides = [CardType.METAL, CardType.METAL]; }
class BlockAttachment extends Target {
  public reduceEffect(_store: Store, state: State, effect: Effect): State {
    if (effect instanceof AttachEnergyEffect) effect.preventDefault = true;
    return state;
  }
}
function board() {
  const state = new State(); state.phase = GamePhase.PLAYER_TURN; state.turn = 5;
  state.players = [new Player(), new Player()]; state.players[0].id = 17; state.players[1].id = 29;
  for (const p of state.players) { p.active.cards = [new Target()]; p.bench = Array.from({ length: 5 }, () => new PokemonCardList()); p.bench[0].cards = [new Target()]; }
  const store = new Store({ onStateChange() {} }, false); store.state = state;
  const [player, opponent] = state.players;
  const hit = (target: PokemonCardList, damage: number) => {
    state.phase = GamePhase.ATTACK;
    const attack = new AttackEffect(player, opponent, player.active.getPokemonCard()!.attacks[0]);
    const effect = new PutDamageEffect(attack, damage); effect.target = target;
    store.reduceEffect(state, effect);
  };
  return { state, store, player, opponent, hit };
}

describe('real cards through the counter placement pipeline', () => {
  for (const [name, create] of [['Iron Jugulis', () => new IronJugulis()], ['Orthworm ex', () => new Orthwormex()]] as const) {
    it(`${name} never reflects a zero damage attack`, () => {
      const g = board(); g.opponent.active.cards = [create()]; g.hit(g.opponent.active, 0);
      expect(g.player.active.damage).toBe(0);
    });
  }
  it('Iron Jugulis reflects 30 exactly once after actual damage, including on the bench', () => {
    const g = board(); g.opponent.bench[0].cards = [new IronJugulis()]; g.hit(g.opponent.bench[0], 60);
    expect(g.opponent.bench[0].damage).toBe(60); expect(g.player.active.damage).toBe(30);
  });
  it('Stealthy Hood protects the attacker from an opposing reflective Ability', () => {
    const g = board(); g.opponent.active.cards = [new IronJugulis()]; const hood = new StealthyHood();
    g.player.active.tools.push(hood); g.hit(g.opponent.active, 60);
    expect(g.opponent.active.damage).toBe(60); expect(g.player.active.damage).toBe(0);
  });
  it('Orthworm counts only its own supplied Metal units and places 20 per unit', () => {
    const g = board(); g.opponent.bench[0].cards = [new Orthwormex()]; const own = new DoubleMetal();
    g.opponent.bench[0].cards.push(own); g.opponent.bench[0].energies.cards.push(own);
    const other = new DoubleMetal(); g.opponent.active.cards.push(other); g.opponent.active.energies.cards.push(other);
    g.hit(g.opponent.bench[0], 20); expect(g.player.active.damage).toBe(40);
  });
  it('an unrelated active Orthworm cannot retaliate for a different damaged Pokémon', () => {
    const g = board(); g.opponent.active.cards = [new Orthwormex()]; g.hit(g.opponent.bench[0], 20);
    expect(g.player.active.damage).toBe(0);
  });
  it('Maractus retaliates only for an actual active KO', () => {
    const g = board(); g.opponent.active.cards = [new Maractus()]; g.hit(g.opponent.active, 100);
    expect(g.player.active.damage).toBe(0); g.hit(g.opponent.active, 10); expect(g.player.active.damage).toBe(60);
  });
  it('a benched Maractus KO does not activate its Active Spot Ability', () => {
    const g = board(); g.opponent.bench[0].cards = [new Maractus()]; g.hit(g.opponent.bench[0], 110);
    expect(g.player.active.damage).toBe(0);
  });
  for (const initial of [0, 10]) it(`Mismagius requires full HP immediately before damage (${initial})`, () => {
    const g = board(); g.opponent.active.cards = [new Mismagius()]; g.opponent.active.damage = initial;
    g.hit(g.opponent.active, 90); expect(g.player.active.damage).toBe(initial === 0 ? 80 : 0);
  });

  const sensors: [string, () => PokemonCard, number, boolean][] = [
    ['Ampharos', () => new Ampharos(), 30, true], ['Gengar', () => new Gengar(), 20, false],
    ['Galarian Cursola V', () => new GalarianCursolaV(), 30, true], ['Arctozolt', () => new Arctozolt(), 20, false],
    ['Minun', () => new Minun(), 20, false], ['Gengar ex', () => new Gengarex(), 20, false], ['Jolteon', () => new Jolteon(), 20, true]
  ];
  for (const [name, create, damage, activeOnly] of sensors) {
    for (const mode of ['hand', 'deck', 'blocked', 'own', 'bench'] as const) it(`${name} attachment counters: ${mode}`, () => {
      const g = board(); const sensor = create(); g.player.active.cards = mode === 'bench' ? [new Target()] : [sensor];
      if (mode === 'bench') g.player.bench[0].cards = [sensor];
      if (name === 'Minun') { const plusle = new Target(); plusle.name = 'Plusle'; g.player.bench[1].cards = [plusle]; }
      if (mode === 'blocked') g.player.bench[3].cards = [new BlockAttachment()];
      const recipient = mode === 'own' ? g.player : g.opponent, energy = new TestEnergy();
      const source = mode === 'deck' ? recipient.deck : recipient.hand; source.cards.push(energy);
      const effect = new AttachEnergyEffect(recipient, energy, recipient.active, source);
      g.store.reduceEffect(g.state, effect);
      const expected = mode === 'hand' || (mode === 'bench' && !activeOnly) ? damage : 0;
      expect(recipient.active.damage).toBe(expected);
      expect(recipient.active.energies.cards.includes(energy)).toBe(mode !== 'blocked');
    });
  }
  it('two Minun do not stack Buddy Pulse', () => {
    const g = board(); g.player.active.cards = [new Minun()]; g.player.bench[0].cards = [new Minun()];
    const plusle = new Target(); plusle.name = 'Plusle'; g.player.bench[1].cards = [plusle];
    const energy = new TestEnergy(); g.opponent.hand.cards = [energy];
    g.store.reduceEffect(g.state, new AttachEnergyEffect(g.opponent, energy, g.opponent.active));
    expect(g.opponent.active.damage).toBe(20);
  });
  it('Parasect applies once across both BetweenTurnsEffect passes', () => {
    const g = board(); g.player.bench[0].cards = [new Parasect()]; g.opponent.active.specialConditions = [SpecialCondition.CONFUSED];
    g.store.reduceEffect(g.state, new BetweenTurnsEffect(g.player)); g.store.reduceEffect(g.state, new BetweenTurnsEffect(g.opponent));
    expect(g.opponent.active.damage).toBe(20); expect(g.player.active.damage).toBe(0);
  });
  for (const [name, create, damage] of [['Dark Ampharos', () => new DarkAmpharos(), 20], ['Team Rockets Ampharos', () => new TeamRocketsAmpharos(), 40]] as const) {
    it(`${name} damages the evolved physical stack only after it enters play`, () => {
      const g = board(); g.state.activePlayer = 1; g.player.active.cards = [create()]; const evolved = new Evolved();
      g.opponent.hand.cards = [evolved]; const effect = new EvolveEffect(g.opponent, g.opponent.active, evolved);
      g.store.reduceEffect(g.state, effect); expect(g.opponent.active.getPokemonCard()).toBe(evolved);
      expect(g.opponent.active.damage).toBe(damage); expect(g.opponent.hand.cards).toEqual([]);
    });
  }
});
