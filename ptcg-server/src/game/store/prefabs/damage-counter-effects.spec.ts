import { Store } from '../store';
import { State, GamePhase } from '../state/state';
import { Player } from '../state/player';
import { PokemonCardList } from '../state/pokemon-card-list';
import { PokemonCard } from '../card/pokemon-card';
import { CardTag } from '../card/card-types';
import { PowerType } from '../card/pokemon-types';
import { AttackEffect, PowerEffect } from '../effects/game-effects';
import { PutDamageEffect } from '../effects/attack-effects';
import { GameError } from '../../game-error';
import { GameMessage } from '../../game-message';
import { Effect } from '../effects/effect';
import { moveDamageCounters, putAbilityDamageCounters } from './damage-counter-effects';
import { BattleColosseum } from '../../../sets/11-mega-evolution/set-phantasmal-flames/battle-colosseum';
import { Patrat } from '../../../sets/11-mega-evolution/set-chaos-rising/patrat';
import { StealthyHood } from '../../../sets/08-sun-and-moon/set-unbroken-bonds/stealthy-hood';
import { FusionStrikeEnergy } from '../../../sets/09-sword-and-shield/set-fusion-strike/fusion-strike-energy';
import { Baltoy } from '../../../sets/07-x-and-y/set-ancient-origins/baltoy';
import { MistEnergy } from '../../../sets/10-scarlet-and-violet/set-temporal-forces/mist-energy';

class CounterTarget extends PokemonCard {
  public set = 'TEST'; public fullName = 'Counter Target TEST'; public name = 'Counter Target';
  public hp = 200; protected _tags = [CardTag.FUSION_STRIKE];
  public powers = [{ name: 'Counter Power', powerType: PowerType.ABILITY, text: '' }];
  public attacks = [{ name: 'Counter Attack', cost: [], damage: 0, text: '' }];
}
class SuppressPatrat extends CounterTarget {
  public reduceEffect(_store: Store, state: State, effect: Effect): State {
    if (effect instanceof PowerEffect && effect.card instanceof Patrat) throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
    return state;
  }
}
function board(cage = false) {
  const state = new State(); state.phase = GamePhase.PLAYER_TURN; state.turn = 3;
  state.players = [new Player(), new Player()]; state.players[0].id = 17; state.players[1].id = 29;
  for (const player of state.players) {
    player.active.cards = [new CounterTarget()];
    player.bench = Array.from({ length: 5 }, () => new PokemonCardList());
    player.bench[0].cards = [new CounterTarget()];
    player.bench[0].damage = 20;
  }
  const player = state.players[0], opponent = state.players[1]; player.active.damage = 40;
  if (cage) player.stadium.cards = [new BattleColosseum()];
  const card = player.active.getPokemonCard()!;
  const power = new PowerEffect(player, card.powers[0], card);
  const attack = new AttackEffect(player, opponent, card.attacks[0]);
  const store = new Store({ onStateChange() {} }, false); store.state = state;
  const hood = (target: PokemonCardList) => { const h = new StealthyHood(); target.tools.push(h); };
  const fusion = (target: PokemonCardList) => { const e = new FusionStrikeEnergy(); target.cards.push(e); target.energies.cards.push(e); };
  const patrat = () => { player.bench[4].cards = [new Patrat()]; };
  return { state, store, player, opponent, power, attack, hood, fusion, patrat };
}

describe('source-aware damage counters and real prevention cards', () => {
  it('places an Ability counter amount once', () => {
    const g = board(); putAbilityDamageCounters(g.store, g.state, g.power, g.opponent.active, 40);
    expect(g.opponent.active.damage).toBe(40);
  });
  it('Battle Cage stops opposing Ability counters on the bench but not the active', () => {
    const g = board(true);
    putAbilityDamageCounters(g.store, g.state, g.power, g.opponent.bench[0], 40);
    putAbilityDamageCounters(g.store, g.state, g.power, g.opponent.active, 40);
    expect(g.opponent.bench[0].damage).toBe(20); expect(g.opponent.active.damage).toBe(40);
  });
  it('Battle Cage does not stop own Ability counters', () => {
    const g = board(true); putAbilityDamageCounters(g.store, g.state, g.power, g.player.bench[0], 10);
    expect(g.player.bench[0].damage).toBe(30);
  });
  it('Battle Cage does not stop actual attack damage to the bench', () => {
    const g = board(true); const damage = new PutDamageEffect(g.attack, 60); damage.target = g.opponent.bench[0];
    g.store.reduceEffect(g.state, damage); expect(g.opponent.bench[0].damage).toBe(80);
  });
  it('Battle Cage removes moved Ability counters without placing them on the opposing bench', () => {
    const g = board(true); moveDamageCounters(g.store, g.state, g.player, g.player.active, g.opponent.bench[0], 30, g.power);
    expect(g.player.active.damage).toBe(10); expect(g.opponent.bench[0].damage).toBe(20);
  });
  it('Battle Cage removes moved attack counters without placing them on the opposing bench', () => {
    const g = board(true); moveDamageCounters(g.store, g.state, g.player, g.player.active, g.opponent.bench[0], 30, g.attack);
    expect(g.player.active.damage).toBe(10); expect(g.opponent.bench[0].damage).toBe(20);
  });
  it('keeps the original attack controller when the opponent answers the allocation', () => {
    const g = board(true); g.opponent.active.damage = 40;
    moveDamageCounters(g.store, g.state, g.opponent, g.opponent.active, g.opponent.bench[0], 30, g.attack);
    expect(g.opponent.active.damage).toBe(10); expect(g.opponent.bench[0].damage).toBe(20);
  });
  it('Battle Cage permits Trainer transfers', () => {
    const g = board(true); moveDamageCounters(g.store, g.state, g.player, g.player.active, g.opponent.bench[0], 20);
    expect(g.player.active.damage).toBe(20); expect(g.opponent.bench[0].damage).toBe(40);
  });
  for (const origin of ['ability', 'attack', 'trainer'] as const) {
    it(`Patrat prevents the entire ${origin} move`, () => {
      const g = board(); g.patrat();
      moveDamageCounters(g.store, g.state, g.player, g.player.active, g.opponent.bench[0], 20,
        origin === 'ability' ? g.power : origin === 'attack' ? g.attack : undefined);
      expect(g.player.active.damage).toBe(40); expect(g.opponent.bench[0].damage).toBe(20);
    });
  }
  it('a suppressed Patrat does not prevent a transfer', () => {
    const g = board(); g.patrat(); g.opponent.bench[2].cards = [new SuppressPatrat()];
    moveDamageCounters(g.store, g.state, g.player, g.player.active, g.opponent.bench[0], 20, g.power);
    expect(g.player.active.damage).toBe(20); expect(g.opponent.bench[0].damage).toBe(40);
  });
  for (const protection of ['hood', 'fusion', 'baltoy'] as const) {
    it(`${protection} prevents opposing Ability placement but permits a Trainer`, () => {
      const g = board();
      if (protection === 'baltoy') g.opponent.bench[0].cards = [new Baltoy()];
      else g[protection](g.opponent.bench[0]);
      putAbilityDamageCounters(g.store, g.state, g.power, g.opponent.bench[0], 20);
      expect(g.opponent.bench[0].damage).toBe(20);
      moveDamageCounters(g.store, g.state, g.player, g.player.active, g.opponent.bench[0], 10);
      expect(g.player.active.damage).toBe(30); expect(g.opponent.bench[0].damage).toBe(30);
    });
  }
  it('Stealthy Hood does not block own Ability counters', () => {
    const g = board(); g.hood(g.player.active); putAbilityDamageCounters(g.store, g.state, g.power, g.player.active, 10);
    expect(g.player.active.damage).toBe(50);
  });
  it('Fusion Strike Energy does not block own Ability counters', () => {
    const g = board(); g.fusion(g.player.active); putAbilityDamageCounters(g.store, g.state, g.power, g.player.active, 10);
    expect(g.player.active.damage).toBe(50);
  });
  it('protection on the counter source prevents removal', () => {
    const g = board(); g.hood(g.opponent.active); g.opponent.active.damage = 40;
    moveDamageCounters(g.store, g.state, g.player, g.opponent.active, g.opponent.bench[0], 20, g.power);
    expect(g.opponent.active.damage).toBe(40); expect(g.opponent.bench[0].damage).toBe(20);
  });
  it('protection only on the counter recipient still allows removal', () => {
    const g = board(); g.hood(g.opponent.bench[0]);
    moveDamageCounters(g.store, g.state, g.player, g.player.active, g.opponent.bench[0], 20, g.power);
    expect(g.player.active.damage).toBe(20); expect(g.opponent.bench[0].damage).toBe(20);
  });
  it('Mist Energy protects a source from attack-sourced removal', () => {
    const g = board(); const mist = new MistEnergy(); g.opponent.active.cards.push(mist); g.opponent.active.energies.cards.push(mist);
    g.opponent.active.damage = 40;
    moveDamageCounters(g.store, g.state, g.player, g.opponent.active, g.opponent.bench[0], 20, g.attack);
    expect(g.opponent.active.damage).toBe(40); expect(g.opponent.bench[0].damage).toBe(20);
  });
  it('invalid fractional counter amounts never mutate the board', () => {
    const g = board();
    expect(() => moveDamageCounters(g.store, g.state, g.player, g.player.active, g.opponent.active, 5, g.power)).toThrow();
    expect(() => putAbilityDamageCounters(g.store, g.state, g.power, g.opponent.active, NaN)).toThrow();
    expect(g.player.active.damage).toBe(40); expect(g.opponent.active.damage).toBe(0);
  });
});
