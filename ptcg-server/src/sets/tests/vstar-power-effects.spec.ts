import { StoreLike } from '../../game/store/store-like';
import { Effect } from '../../game/store/effects/effect';
import { AttachEnergyEffect } from '../../game/store/effects/play-card-effects';
import { AttachEnergyPrompt } from '../../game/store/prompts/attach-energy-prompt';
import { SerperiorVSTAR } from '../09-sword-and-shield/set-silver-tempest/serperior-vstar';
import { AlolanVulpixVSTAR } from '../09-sword-and-shield/set-silver-tempest/alolan-vulpix-vstar';
import { UnownVSTAR } from '../09-sword-and-shield/set-silver-tempest/unown-vstar';
import { LucarioVSTAR } from '../09-sword-and-shield/set-sword-and-shield-promos/lucario-vstar';
import { MewtwoVSTAR } from '../09-sword-and-shield/set-pokemon-go/mewtwo-vstar-pgo';
import { ArceusVSTAR as ArceusVSTAR30C } from '../11-mega-evolution/set-30th-celebration/arceus-vstar-30c';
import { OriginFormePalkiaVSTAR } from '../09-sword-and-shield/set-astral-radiance/origin-forme-palkia-vstar';
import { ZamazentaVstar } from '../09-sword-and-shield/set-crown-zenith/zamazenta-vstar';
import { SkySealStone } from '../09-sword-and-shield/set-crown-zenith/sky-seal-stone';
import { DoubleColorlessEnergy } from '../set-base-set/double-colorless-energy';
import { WaterEnergy } from '../set-base-set-energy/water-energy';
import { Froslass } from '../10-scarlet-and-violet/set-twilight-masquerade/froslass';
import { GameError } from '../../game/game-error';
import { GameMessage } from '../../game/game-message';
import { CardTag, CardType, SpecialCondition } from '../../game/store/card/card-types';
import { PowerType } from '../../game/store/card/pokemon-types';
import { BetweenTurnsEffect, EndTurnEffect, AfterAttackEffect } from '../../game/store/effects/game-phase-effects';
import { CheckPokemonAttacksEffect, CheckPokemonStatsEffect, CheckPokemonPowersEffect } from '../../game/store/effects/check-effects';
import { PutDamagePrompt } from '../../game/store/prompts/put-damage-prompt';
import { CoinFlipPrompt } from '../../game/store/prompts/coin-flip-prompt';
import { DrapionVSTAR } from '../09-sword-and-shield/set-lost-origin/drapion-vstar';
import { ZeraoraVSTAR } from '../09-sword-and-shield/set-crown-zenith/zeraora-vstar';
import { EarthenSealStone } from '../09-sword-and-shield/set-silver-tempest/earthen-seal-stone';
import { AerodactylVstar } from '../09-sword-and-shield/set-lost-origin/aerodactyl-vstar';
import { OriginFormeDialgaVSTAR } from '../09-sword-and-shield/set-astral-radiance/origin-forme-dialga-vstar';
import { StealthyHood } from '../08-sun-and-moon/set-unbroken-bonds/stealthy-hood';
import { MistEnergy } from '../10-scarlet-and-violet/set-temporal-forces/mist-energy';
import { Manaphy } from '../09-sword-and-shield/set-brilliant-stars/manaphy';
import { BattleColosseum } from '../11-mega-evolution/set-phantasmal-flames/battle-colosseum';
import { AspertiaCityGym } from '../06-black-and-white/set-boundaries-crossed/aspertia-city-gym';
import { JammingTower } from '../10-scarlet-and-violet/set-twilight-masquerade/jamming-tower';
import { WelaVolcanoPark } from '../set-dragons-majesty/wela-volcano-park';
import { Centiskorch } from '../09-sword-and-shield/set-battle-styles/centiskorch';
import { Store } from '../../game/store/store';
import { State, GamePhase, GameWinner } from '../../game/store/state/state';
import { Player } from '../../game/store/state/player';
import { Card } from '../../game/store/card/card';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { PokemonCardList } from '../../game/store/state/pokemon-card-list';
import { CardList } from '../../game/store/state/card-list';
import { CardTarget, PlayerType, SlotType } from '../../game/store/actions/play-card-action';
import { UseAbilityAction } from '../../game/store/actions/game-actions';
import { ResolvePromptAction } from '../../game/store/actions/resolve-prompt-action';
import { ChoosePokemonPrompt } from '../../game/store/prompts/choose-pokemon-prompt';
import { ChoosePrizePrompt } from '../../game/store/prompts/choose-prize-prompt';
import { WaitPrompt } from '../../game/store/prompts/wait-prompt';
import { AttackEffect, EffectOfAbilityEffect, PowerEffect, PutDamageCountersEffect } from '../../game/store/effects/game-effects';
import { AfterDamageEffect, PutDamageEffect, DealDamageEffect } from '../../game/store/effects/attack-effects';
import { WAS_POWER_USED } from '../../game/store/prefabs/prefabs';
import { HisuianSamurottVSTAR } from '../09-sword-and-shield/set-astral-radiance/hisuian-samurott-vstar';
import { EnamorusV } from '../09-sword-and-shield/set-lost-origin/enamorus-v';
import { PsychicEnergy } from '../set-base-set-energy/psychic-energy';
import { Mausholdex } from '../10-scarlet-and-violet/set-paradox-rift/maushold-ex';
import { Tandemaus } from '../10-scarlet-and-violet/set-paldea-evolved/tandemaus';

class DamageTarget extends PokemonCard {
  public set = 'TEST';
  public name = 'Damage Target';
  public fullName = 'Damage Target TEST';
  public hp = 180;
}

function fixture(ownerIndex = 0, sourceOnBench = false) {
  const state = new State();
  state.phase = GamePhase.PLAYER_TURN;
  state.turn = 4;
  state.activePlayer = ownerIndex;
  state.players = [new Player(), new Player()];
  state.players[0].id = 17;
  state.players[1].id = 29;
  const register = <T extends Card>(card: T): T => {
    card.id = state.cardNames.length;
    state.cardNames.push(card.fullName);
    return card;
  };
  for (const p of state.players) {
    p.active.cards = [register(new DamageTarget())];
    p.bench = Array.from({ length: 5 }, () => new PokemonCardList());
    p.deck.cards = [register(new DamageTarget())];
    p.prizes = Array.from({ length: 6 }, () => {
      const prize = new CardList();
      prize.isSecret = true;
      prize.cards = [register(new DamageTarget())];
      return prize;
    });
  }
  const player = state.players[ownerIndex];
  const opponent = state.players[1 - ownerIndex];
  const samurott = register(new HisuianSamurottVSTAR());
  const source = sourceOnBench ? player.bench[1] : player.active;
  source.cards = [samurott];
  opponent.bench[2].cards = [register(new DamageTarget())];
  const store = new Store({ onStateChange() {} }, false);
  store.state = state;
  const pending = () => state.prompts.filter(p => p.result === undefined);
  const activatePower = (card: PokemonCard, target: CardTarget) => {
    store.dispatch(new UseAbilityAction(player.id, card.powers[0].name, target));
    const animation = pending()[0];
    if (!(animation instanceof WaitPrompt) || animation.message !== 'Ability animation') {
      throw new Error('Expected actual ability animation gate');
    }
    store.dispatch(new ResolvePromptAction(animation.id, true));
  };
  const activate = () => activatePower(samurott, {
    player: PlayerType.BOTTOM_PLAYER,
    slot: sourceOnBench ? SlotType.BENCH : SlotType.ACTIVE,
    index: sourceOnBench ? 1 : 0,
  });
  const resolveTarget = (target: CardTarget) => {
    const prompt = pending()[0];
    if (!(prompt instanceof ChoosePokemonPrompt)) throw new Error('Expected Moon Cleave Star target prompt');
    const result = prompt.decode([target], state);
    expect(prompt.validate(result, state)).toBe(true);
    store.dispatch(new ResolvePromptAction(prompt.id, result));
  };
  return { state, store, player, opponent, samurott, source, register, pending, activate, activatePower, resolveTarget };
}

const opposingActive: CardTarget = { player: PlayerType.TOP_PLAYER, slot: SlotType.ACTIVE, index: 0 };
const opposingBench: CardTarget = { player: PlayerType.TOP_PLAYER, slot: SlotType.BENCH, index: 2 };

describe('VSTAR ability activation versus damage-counter sub-effects', () => {
  it('recognizes the real power activation but not its inherited damage-counter sub-effect', () => {
    const game = fixture();
    const activation = new PowerEffect(game.player, game.samurott.powers[0], game.samurott, game.opponent.active);
    expect(WAS_POWER_USED(activation, 0, game.samurott)).toBe(true);
    expect(WAS_POWER_USED(new PutDamageCountersEffect(activation, 40), 0, game.samurott)).toBe(false);
  });

  it('places exactly four counters through actual UseAbilityAction and a later target dispatch', () => {
    const game = fixture();
    game.activate();
    expect(game.pending().length).toBe(1);
    expect(game.player.usedVSTAR).toBe(true);
    expect(game.opponent.active.damage).toBe(0);
    game.resolveTarget(opposingActive);
    expect(game.opponent.active.damage).toBe(40);
    expect(game.opponent.bench[2].damage).toBe(0);
    expect(game.source.damage).toBe(0);
    expect(game.pending().length).toBe(0);
  });

  it('can activate on the bench and add 40 to the selected opponent bench rather than reset its damage', () => {
    const game = fixture(0, true);
    game.opponent.bench[2].damage = 20;
    game.activate();
    game.resolveTarget(opposingBench);
    expect(game.opponent.bench[2].damage).toBe(60);
    expect(game.opponent.active.damage).toBe(0);
    expect(game.source.damage).toBe(0);
  });

  it('uses the correct player perspective when player two activates', () => {
    const game = fixture(1);
    game.activate();
    expect(game.pending()[0].playerId).toBe(29);
    game.resolveTarget(opposingBench);
    expect(game.opponent.bench[2].damage).toBe(40);
    expect(game.player.active.damage).toBe(0);
    expect(game.player.usedVSTAR).toBe(true);
    expect(game.opponent.usedVSTAR).not.toBe(true);
  });

  it('still refuses any second Moon Cleave Star from another physical copy', () => {
    const game = fixture();
    const second = game.register(new HisuianSamurottVSTAR());
    game.player.bench[0].cards = [second];
    game.activate();
    game.resolveTarget(opposingActive);
    expect(() => game.activatePower(second, {
      player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0,
    })).toThrow();
    expect(game.opponent.active.damage).toBe(40);
    expect(game.pending().length).toBe(0);
  });

  it('does not consume another target prompt when the VSTAR power was already used', () => {
    const game = fixture();
    game.player.usedVSTAR = true;
    expect(game.activate).toThrow();
    expect(game.pending().length).toBe(0);
    expect(game.opponent.active.damage).toBe(0);
  });

  it('honors an ability-effect prevention flag while spending the successfully activated VSTAR power', () => {
    const game = fixture();
    const target = game.opponent.active;
    target.getPokemonCard()!.reduceEffect = (_store, state, effect) => {
      if (effect instanceof EffectOfAbilityEffect && effect.target === target) effect.preventDefault = true;
      return state;
    };
    game.activate();
    game.resolveTarget(opposingActive);
    expect(target.damage).toBe(0);
    expect(game.player.usedVSTAR).toBe(true);
    expect(game.pending().length).toBe(0);
  });

  it('keeps real Guardian of Love protection when Enamorus clears the effect target', () => {
    const game = fixture();
    game.opponent.bench[0].cards = [game.register(new EnamorusV())];
    const energy = game.register(new PsychicEnergy());
    game.opponent.active.cards.push(energy);
    game.opponent.active.energies.cards.push(energy);
    game.activate();
    game.resolveTarget(opposingActive);
    expect(game.opponent.active.damage).toBe(0);
    expect(game.opponent.active.cards).toContain(energy);
    expect(game.player.usedVSTAR).toBe(true);
    expect(game.pending().length).toBe(0);
  });

  it('completes the real bench KO and single-prize continuation after the four counters', () => {
    const game = fixture();
    const knockedOut = game.opponent.bench[2].getPokemonCard()!;
    knockedOut.hp = 40;
    const prize = game.player.prizes[0].cards[0];
    game.activate();
    game.resolveTarget(opposingBench);
    expect(game.opponent.bench[2].cards.length).toBe(0);
    expect(game.opponent.discard.cards).toContain(knockedOut);
    const prompt = game.pending()[0];
    if (!(prompt instanceof ChoosePrizePrompt)) throw new Error('Expected one KO prize prompt');
    const result = prompt.decode([0], game.state);
    expect(prompt.validate(result, game.state)).toBe(true);
    game.store.dispatch(new ResolvePromptAction(prompt.id, result));
    expect(game.player.hand.cards).toContain(prize);
    expect(game.player.prizesTaken).toBe(1);
    expect(game.player.usedVSTAR).toBe(true);
    expect(game.state.phase).toBe(GamePhase.PLAYER_TURN);
    expect(game.state.winner).toBe(GameWinner.NONE);
    expect(game.pending().length).toBe(0);
  });

  it('retains non-VSTAR Maushold counterattack through the same damage-counter reducer', () => {
    const game = fixture();
    const maushold = game.register(new Mausholdex());
    game.player.active.cards = [maushold];
    game.player.bench[0].cards = [game.register(new Tandemaus())];
    game.state.phase = GamePhase.ATTACK;
    const attack = new AttackEffect(game.opponent, game.player, {
      name: 'Fixture Attack', cost: [], damage: 10, text: '',
    });
    attack.target = game.player.active;
    game.store.reduceEffect(game.state, new AfterDamageEffect(attack, 10));
    expect(game.opponent.active.damage).toBe(60);
    expect(game.player.usedVSTAR).not.toBe(true);
  });
});
class NativeVTarget extends DamageTarget {
  protected _tags = [CardTag.POKEMON_V];
  public hp = 500;
  public cardType = [CardType.COLORLESS];
  public powers = [{ name: 'Native Ability', powerType: PowerType.ABILITY, useWhenInPlay: true, text: 'Fixture native Ability.' }];
}
class NativeVMAXTarget extends NativeVTarget { protected _tags = [CardTag.POKEMON_VMAX]; }
class NativeNonVTarget extends NativeVTarget { protected _tags: CardTag[] = []; }

function resolveFamilyPrompt(game: ReturnType<typeof fixture>, raw: unknown): void {
  const prompt = game.pending()[0];
  if (!prompt) throw new Error('Expected pending family prompt');
  const decoded = prompt.decode(raw, game.state);
  expect(prompt.validate(decoded, game.state)).toBe(true);
  game.store.dispatch(new ResolvePromptAction(prompt.id, decoded));
}
function stoneFixture() {
  const game = fixture(), stone = game.register(new EarthenSealStone());
  game.source.tools.push(stone);
  return { ...game, stone, useStone: () => game.store.reduceEffect(game.state, new AttackEffect(game.player, game.opponent, stone.attacks[0])) };
}

describe('VSTAR family counter and damage semantics', () => {
  for (const owner of [0, 1]) it(`Hazard Star sets three poison counters through real ability activation for owner ${owner}`, () => {
    const game = fixture(owner), drapion = game.register(new DrapionVSTAR()); game.source.cards = [drapion];
    game.activatePower(drapion, { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 });
    expect(game.opponent.active.specialConditions).toContain(SpecialCondition.POISONED);
    expect(game.opponent.active.specialConditions).toContain(SpecialCondition.PARALYZED);
    game.store.reduceEffect(game.state, new BetweenTurnsEffect(game.opponent));
    expect(game.opponent.active.damage).toBe(30); expect(game.player.usedVSTAR).toBe(true);
  });
  it('Hazard Star does not bypass Stealthy Hood ability-effect protection', () => {
    const game = fixture(), drapion = game.register(new DrapionVSTAR()), hood = game.register(new StealthyHood());
    game.source.cards = [drapion]; game.opponent.active.tools.push(hood);
    game.activatePower(drapion, { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 });
    expect(game.opponent.active.specialConditions.length).toBe(0); expect(game.player.usedVSTAR).toBe(true);
  });
  it('Hazard Star cannot be used after another VSTAR power', () => {
    const game = fixture(), drapion = game.register(new DrapionVSTAR()); game.source.cards = [drapion]; game.player.usedVSTAR = true;
    expect(() => game.activatePower(drapion, { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 })).toThrow();
    expect(game.opponent.active.specialConditions.length).toBe(0);
  });
  for (const mode of ['weakness', 'Mist', 'Manaphy', 'Battle Cage', 'split']) it(`Lightning Storm Star is attack damage, not counters: ${mode}`, () => {
    const game = fixture(), zeraora = game.register(new ZeraoraVSTAR()); game.source.cards = [zeraora];
    game.opponent.active.cards = [game.register(new NativeVTarget())]; game.opponent.bench[2].cards = [game.register(new NativeVTarget())];
    game.opponent.active.getPokemonCard()!.weakness = [{ type: CardType.LIGHTNING }];
    game.opponent.active.getPokemonCard()!.resistance = [{ type: CardType.LIGHTNING, value: -30 }];
    if (mode === 'Mist') { const energy = game.register(new MistEnergy()); game.opponent.bench[2].cards.push(energy); game.opponent.bench[2].energies.cards.push(energy); }
    if (mode === 'Manaphy') game.opponent.bench[0].cards = [game.register(new Manaphy())];
    if (mode === 'Battle Cage') game.player.stadium.cards = [game.register(new BattleColosseum())];
    game.store.reduceEffect(game.state, new AttackEffect(game.player, game.opponent, zeraora.attacks[1]));
    expect(game.pending()[0] instanceof PutDamagePrompt).toBe(true);
    const onBench = ['Mist', 'Manaphy', 'Battle Cage'].includes(mode);
    resolveFamilyPrompt(game, mode === 'split' ? [{ target: opposingActive, damage: 120 }, { target: opposingBench, damage: 120 }]
      : [{ target: onBench ? opposingBench : opposingActive, damage: 240 }]);
    expect(game.opponent.active.damage).toBe(mode === 'split' ? 120 : onBench ? 0 : 240);
    expect(game.opponent.bench[2].damage).toBe(mode === 'split' ? 120 : mode === 'Manaphy' || !onBench ? 0 : 240);
    expect(game.player.usedVSTAR).toBe(true);
  });
  it('Lightning Storm Star rejects a second VSTAR use', () => {
    const game = fixture(), zeraora = game.register(new ZeraoraVSTAR()); game.source.cards = [zeraora]; game.player.usedVSTAR = true;
    expect(() => game.store.reduceEffect(game.state, new AttackEffect(game.player, game.opponent, zeraora.attacks[1]))).toThrow();
    expect(game.pending().length).toBe(0);
  });
  it('Earthen Seal Stone exposes Star Gravity with its actual three Colorless cost', () => {
    const game = stoneFixture(), attacks = new CheckPokemonAttacksEffect(game.player);
    game.store.reduceEffect(game.state, attacks);
    expect(game.stone.attacks[0].name).toBe('Star Gravity'); expect(game.stone.attacks[0].cost).toEqual([CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]);
    expect(attacks.attacks.filter(a => a === game.stone.attacks[0]).length).toBe(1);
  });
  it('Earthen Seal Stone does not grant its seeded tool attack to a non-V Pokemon', () => {
    const game = stoneFixture(), target = game.register(new DamageTarget()); game.source.cards = [target];
    const attacks = new CheckPokemonAttacksEffect(game.player); game.store.reduceEffect(game.state, attacks);
    expect(attacks.attacks).not.toContain(game.stone.attacks[0]); expect(game.useStone).toThrow();
  });
  it('Earthen Seal Stone is unavailable under the actual Jamming Tower', () => {
    const game = stoneFixture(); game.player.stadium.cards = [game.register(new JammingTower())];
    const attacks = new CheckPokemonAttacksEffect(game.player); game.store.reduceEffect(game.state, attacks);
    expect(attacks.attacks).not.toContain(game.stone.attacks[0]); expect(game.useStone).toThrow();
  });
  it('Star Gravity uses each V maximum HP, preserves existing counters and never heals a low-HP target', () => {
    const game = stoneFixture(), active = game.register(new NativeVTarget()), vmax = game.register(new NativeVMAXTarget());
    active.hp = 300; vmax.hp = 330; game.opponent.active.cards = [active]; game.opponent.active.damage = 40;
    game.opponent.bench[2].cards = [vmax]; game.opponent.bench[2].damage = 50;
    const low = game.register(new NativeVTarget()); low.hp = 300; game.opponent.bench[1].cards = [low]; game.opponent.bench[1].damage = 250;
    game.opponent.bench[0].cards = [game.register(new DamageTarget())]; game.opponent.bench[0].damage = 20;
    game.useStone(); expect(game.opponent.active.damage).toBe(200); expect(game.opponent.bench[2].damage).toBe(230);
    expect(game.opponent.bench[1].damage).toBe(250); expect(game.opponent.bench[0].damage).toBe(20); expect(game.player.usedVSTAR).toBe(true);
  });
  it('Star Gravity includes the actual Aspertia City Gym HP bonus', () => {
    const game = stoneFixture(), target = game.register(new NativeVTarget()); target.hp = 300;
    game.opponent.active.cards = [target]; game.player.stadium.cards = [game.register(new AspertiaCityGym())];
    game.useStone(); expect(game.opponent.active.damage).toBe(220);
  });
  for (const protection of ['Mist', 'Battle Cage', 'Manaphy']) it(`Star Gravity has attack-effect protection semantics: ${protection}`, () => {
    const game = stoneFixture(); game.opponent.active.cards = [game.register(new NativeVTarget())];
    game.opponent.bench[2].cards = [game.register(new NativeVTarget())];
    game.opponent.active.getPokemonCard()!.hp = 300; game.opponent.bench[2].getPokemonCard()!.hp = 300;
    if (protection === 'Mist') { const energy = game.register(new MistEnergy()); game.opponent.active.cards.push(energy); game.opponent.active.energies.cards.push(energy); }
    if (protection === 'Battle Cage') game.player.stadium.cards = [game.register(new BattleColosseum())];
    if (protection === 'Manaphy') game.opponent.bench[0].cards = [game.register(new Manaphy())];
    game.useStone(); expect(game.opponent.active.damage).toBe(protection === 'Mist' ? 0 : 200);
    expect(game.opponent.bench[2].damage).toBe(protection === 'Battle Cage' ? 0 : 200);
  });
  it('Star Gravity cannot consume a second VSTAR power', () => {
    const game = stoneFixture(); game.player.usedVSTAR = true; expect(game.useStone).toThrow();
    expect(game.opponent.active.damage).toBe(0);
  });
  it('Ancient Star completes without recursively probing its own newly gained Ability', () => {
    const game = fixture(), aero = game.register(new AerodactylVstar()); game.source.cards = [aero];
    expect(() => game.store.reduceEffect(game.state, new AttackEffect(game.player, game.opponent, aero.attacks[1]))).not.toThrow();
    expect(aero.ancientStarActive).toBe(true); expect(game.player.usedVSTAR).toBe(true);
  });
  it('Ancient Star removes an opponent Pokemon V Ability without unbounded recursion', () => {
    const game = fixture(), aero = game.register(new AerodactylVstar()), target = game.register(new NativeVTarget());
    game.source.cards = [aero]; game.opponent.active.cards = [target];
    game.store.reduceEffect(game.state, new AttackEffect(game.player, game.opponent, aero.attacks[1]));
    let thrown: unknown;
    try { game.store.reduceEffect(game.state, new PowerEffect(game.opponent, target.powers[0], target)); } catch (error) { thrown = error; }
    expect(thrown instanceof GameError).toBe(true);
    expect(thrown instanceof GameError ? thrown.message : undefined).toBe(GameMessage.BLOCKED_BY_ABILITY);
  });
  it('Ancient Star does not prevent a non-V Pokemon Ability', () => {
    const game = fixture(), aero = game.register(new AerodactylVstar()), target = game.register(new NativeNonVTarget());
    game.source.cards = [aero]; game.opponent.active.cards = [target];
    game.store.reduceEffect(game.state, new AttackEffect(game.player, game.opponent, aero.attacks[1]));
    expect(() => game.store.reduceEffect(game.state, new PowerEffect(game.opponent, target.powers[0], target))).not.toThrow();
  });
});

describe('counter checkup and extra-turn boundaries', () => {
  it('Star Chronos skips both Pokemon Checkups but still starts and draws for the extra turn', () => {
    const game = fixture(), dialga = game.register(new OriginFormeDialgaVSTAR()); game.source.cards = [dialga];
    for (const p of game.state.players) { p.deck.cards = [game.register(new DamageTarget()), game.register(new DamageTarget())]; p.active.addSpecialCondition(SpecialCondition.POISONED); }
    game.store.reduceEffect(game.state, new AttackEffect(game.player, game.opponent, dialga.attacks[1]));
    const turn = game.state.turn; game.store.reduceEffect(game.state, new EndTurnEffect(game.player));
    expect(game.player.active.damage).toBe(0); expect(game.opponent.active.damage).toBe(0);
    expect(game.state.activePlayer).toBe(0); expect(game.state.turn).toBe(turn + 1); expect(game.player.hand.cards.length).toBe(1);
    expect(game.player.usedTurnSkip).toBe(false);
    game.store.reduceEffect(game.state, new EndTurnEffect(game.player));
    expect(game.state.activePlayer).toBe(1); expect(game.player.active.damage).toBe(10); expect(game.opponent.active.damage).toBe(10);
  });
  it('consumes a granted extra turn even when no source card remains to reset its flag', () => {
    const game = fixture(); game.player.deck.cards = [game.register(new DamageTarget()), game.register(new DamageTarget())]; game.player.usedTurnSkip = true;
    game.store.reduceEffect(game.state, new EndTurnEffect(game.player));
    expect(game.state.activePlayer).toBe(0); expect(game.player.usedTurnSkip).toBe(false);
    game.store.reduceEffect(game.state, new EndTurnEffect(game.player)); expect(game.state.activePlayer).toBe(1);
  });
  for (const heads of [false, true]) it(`normal Burn places only two counters, then applies its real coin result: ${heads}`, () => {
    const game = fixture(); game.opponent.active.addSpecialCondition(SpecialCondition.BURNED);
    game.store.reduceEffect(game.state, new BetweenTurnsEffect(game.opponent)); expect(game.opponent.active.damage).toBe(20);
    expect(game.pending()[0] instanceof CoinFlipPrompt).toBe(true); resolveFamilyPrompt(game, heads);
    expect(game.opponent.active.damage).toBe(20); expect(game.opponent.active.specialConditions.includes(SpecialCondition.BURNED)).toBe(!heads);
  });
  for (const heads of [false, true]) it(`pre-resolved Burn does not double damage or ignore recovery: ${heads}`, () => {
    const game = fixture(); game.opponent.active.addSpecialCondition(SpecialCondition.BURNED);
    const checkup = new BetweenTurnsEffect(game.opponent); checkup.burnFlipResult = heads;
    game.store.reduceEffect(game.state, checkup); expect(game.opponent.active.damage).toBe(20);
    expect(game.opponent.active.specialConditions.includes(SpecialCondition.BURNED)).toBe(!heads); expect(game.pending().length).toBe(0);
  });
  for (const source of ['Wela Volcano Park', 'Centiskorch', 'Centiskorch with Hood']) it(`Burn still flips but cannot recover only if its source is effective: ${source}`, () => {
    const game = fixture(); game.opponent.active.addSpecialCondition(SpecialCondition.BURNED);
    if (source === 'Wela Volcano Park') game.player.stadium.cards = [game.register(new WelaVolcanoPark())];
    else game.player.bench[0].cards = [game.register(new Centiskorch())];
    if (source === 'Centiskorch with Hood') { const hood = game.register(new StealthyHood()); game.opponent.active.tools.push(hood); }
    game.store.reduceEffect(game.state, new BetweenTurnsEffect(game.opponent)); expect(game.pending()[0] instanceof CoinFlipPrompt).toBe(true);
    resolveFamilyPrompt(game, true); expect(game.opponent.active.damage).toBe(20);
    expect(game.opponent.active.specialConditions.includes(SpecialCondition.BURNED)).toBe(source !== 'Centiskorch with Hood');
  });
});
class NativeVUnionTarget extends NativeVTarget { protected _tags = [CardTag.POKEMON_VUNION]; }
class NativeExTarget extends NativeVTarget { protected _tags = [CardTag.POKEMON_ex]; }
class AttachmentObserver extends DamageTarget {
  public observed: AttachEnergyEffect[] = [];
  public block = false;
  public reduceEffect(_store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttachEnergyEffect) { this.observed.push(effect); if (this.block) effect.preventDefault = true; }
    return state;
  }
}
function attachFamilyEnergy(game: ReturnType<typeof fixture>, target: PokemonCardList, card: Card): void {
  game.register(card); target.cards.push(card); target.energies.cards.push(card);
}

describe('remaining VSTAR family contracts', () => {
  it('Star Winder counts only the attacker provided energy units, consumes VSTAR and switches after the attack', () => {
    const game = fixture(), card = game.register(new SerperiorVSTAR()), reserve = game.register(new NativeVTarget());
    game.source.cards = [card]; game.player.bench[0].cards = [reserve];
    attachFamilyEnergy(game, game.source, new DoubleColorlessEnergy()); attachFamilyEnergy(game, game.source, new PsychicEnergy());
    attachFamilyEnergy(game, game.player.bench[0], new DoubleColorlessEnergy());
    const attack = new AttackEffect(game.player, game.opponent, card.attacks[1]);
    game.store.reduceEffect(game.state, attack); expect(attack.damage).toBe(180); expect(game.player.usedVSTAR).toBe(true);
    expect(game.source.getPokemonCard()).toBe(card); expect(game.pending().length).toBe(0);
    game.store.reduceEffect(game.state, new AfterAttackEffect(game.player, game.opponent, card.attacks[1]));
    expect(game.pending()[0] instanceof ChoosePokemonPrompt).toBe(true);
    resolveFamilyPrompt(game, [{ player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 }]);
    expect(game.player.active.getPokemonCard()).toBe(reserve);
    expect(() => game.store.reduceEffect(game.state, new AttackEffect(game.player, game.opponent, card.attacks[1]))).toThrow();
  });
  it('Star Raid damages each physical V by exactly120 without Weakness or Resistance and cannot repeat', () => {
    const game = fixture(), card = game.register(new MewtwoVSTAR()), active = game.register(new NativeVTarget());
    game.source.cards = [card]; game.opponent.active.cards = [active]; active.weakness = [{ type: CardType.PSYCHIC }];
    const reserve = game.register(new NativeVMAXTarget()); reserve.resistance = [{ type: CardType.PSYCHIC, value: -30 }];
    game.opponent.bench[0].cards = [reserve]; game.opponent.bench[1].cards = [game.register(new NativeVUnionTarget())];
    game.opponent.bench[2].cards = [game.register(new NativeNonVTarget())]; game.state.phase = GamePhase.ATTACK;
    game.store.reduceEffect(game.state, new AttackEffect(game.player, game.opponent, card.attacks[1]));
    expect(game.opponent.active.damage).toBe(120); expect(game.opponent.bench[0].damage).toBe(120);
    expect(game.opponent.bench[1].damage).toBe(120); expect(game.opponent.bench[2].damage).toBe(0);
    expect(game.player.usedVSTAR).toBe(true);
    expect(() => game.store.reduceEffect(game.state, new AttackEffect(game.player, game.opponent, card.attacks[1]))).toThrow();
  });
  it('Silvery Snow Star counts Active/VMAX/VUNION once and excludes Pokemon ex', () => {
    const game = fixture(), card = game.register(new AlolanVulpixVSTAR()); game.source.cards = [card];
    game.opponent.active.cards = [game.register(new NativeVTarget())];
    game.opponent.bench[0].cards = [game.register(new NativeVMAXTarget())];
    game.opponent.bench[1].cards = [game.register(new NativeVUnionTarget())];
    game.opponent.bench[2].cards = [game.register(new NativeExTarget())];
    const attack = new AttackEffect(game.player, game.opponent, card.attacks[1]); game.store.reduceEffect(game.state, attack);
    expect(attack.damage).toBe(210); expect(game.player.usedVSTAR).toBe(true);
  });
  for (const attached of [false, true]) it(`Aura Star counts all provided enemy units without an extra70: ${attached}`, () => {
    const game = fixture(), card = game.register(new LucarioVSTAR()); game.source.cards = [card];
    game.opponent.bench[0].cards = [game.register(new NativeVTarget())];
    attachFamilyEnergy(game, game.source, new DoubleColorlessEnergy());
    if (attached) { attachFamilyEnergy(game, game.opponent.active, new DoubleColorlessEnergy()); attachFamilyEnergy(game, game.opponent.bench[0], new PsychicEnergy()); }
    const attack = new AttackEffect(game.player, game.opponent, card.attacks[1]); game.store.reduceEffect(game.state, attack);
    expect(attack.damage).toBe(attached ? 210 : 0); expect(game.player.usedVSTAR).toBe(true);
  });
  it('30C Starbirth consumes VSTAR before searching and carries the actual VSTAR tag', () => {
    const game = fixture(), card = game.register(new ArceusVSTAR30C()); game.source.cards = [card];
    game.store.reduceEffect(game.state, new PowerEffect(game.player, card.powers[0], card));
    expect(game.player.usedVSTAR).toBe(true); expect(card.hasTag(CardTag.POKEMON_VSTAR)).toBe(true);
    expect(game.pending().length).toBeGreaterThan(0);
    expect(() => game.store.reduceEffect(game.state, new PowerEffect(game.player, card.powers[0], card))).toThrow();
  });
  for (const blocked of [false, true]) it(`Star Portal works with only its Active and preserves the real discard source: ${blocked}`, () => {
    const game = fixture(), card = game.register(new OriginFormePalkiaVSTAR()), water = game.register(new WaterEnergy());
    game.source.cards = [card]; game.player.discard.cards = [water]; game.player.energyPlayedTurn = 1;
    const observer = game.register(new AttachmentObserver()); observer.block = blocked; game.opponent.bench[4].cards = [observer];
    game.store.reduceEffect(game.state, new PowerEffect(game.player, card.powers[0], card));
    expect(game.pending()[0] instanceof AttachEnergyPrompt).toBe(true);
    resolveFamilyPrompt(game, [{ to: { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 }, index: 0 }]);
    expect(observer.observed.length).toBe(1); expect(observer.observed[0].source).toBe(game.player.discard);
    expect(observer.observed[0].isManual).toBe(false); expect(game.player.energyPlayedTurn).toBe(1);
    expect(game.source.cards.includes(water)).toBe(!blocked); expect(game.player.discard.cards.includes(water)).toBe(blocked);
    expect(game.player.usedVSTAR).toBe(true);
  });
  for (const targetSlot of ['Active', 'Bench', 'Normal']) it(`Shield Star subtracts100 after Weakness and handles direct damage: ${targetSlot}`, () => {
    const game = fixture(), card = game.register(new ZamazentaVstar()); game.source.cards = [card];
    game.store.reduceEffect(game.state, new PowerEffect(game.player, card.powers[0], card));
    const target = targetSlot === 'Bench' ? game.player.bench[0] : game.player.active;
    if (targetSlot !== 'Bench') game.player.bench[1].cards = [card];
    const victim = game.register(new NativeVTarget()); victim.weakness = [{ type: CardType.FIRE }]; target.cards = [victim];
    const attacker = game.register(new NativeNonVTarget()); attacker.cardType = [CardType.FIRE]; game.opponent.active.cards = [attacker];
    game.state.phase = GamePhase.ATTACK;
    const base = new AttackEffect(game.opponent, game.player, { name: 'Probe', cost: [], damage: 150, text: '' });
    const damage = targetSlot === 'Normal' ? new DealDamageEffect(base, 150) : new PutDamageEffect(base, 150); damage.target = target;
    game.store.reduceEffect(game.state, damage); expect(target.damage).toBe(targetSlot === 'Bench' ? 50 : 200);
  });
  for (const protectedTarget of [false, true]) it(`Star Cipher preserves additive Weakness and respects Ability protection: ${protectedTarget}`, () => {
    const game = fixture(), card = game.register(new UnownVSTAR()), target = game.register(new NativeVTarget());
    game.source.cards = [card]; game.opponent.active.cards = [target]; target.weakness = [{ type: CardType.FIRE, value: 30 }];
    if (protectedTarget) game.opponent.active.tools.push(game.register(new StealthyHood()));
    game.store.reduceEffect(game.state, new AttackEffect(game.player, game.opponent, card.attacks[1]));
    const stats = new CheckPokemonStatsEffect(game.opponent.active); game.store.reduceEffect(game.state, stats);
    expect(stats.weakness).toEqual([{ type: protectedTarget ? CardType.FIRE : CardType.PSYCHIC, value: 30 }]);
  });
  it('Star Cipher does not create a Weakness and is lost when that Pokemon leaves play', () => {
    const game = fixture(), card = game.register(new UnownVSTAR()), target = game.register(new NativeVTarget());
    game.source.cards = [card]; game.opponent.active.cards = [target]; target.weakness = [];
    game.store.reduceEffect(game.state, new AttackEffect(game.player, game.opponent, card.attacks[1]));
    const empty = new CheckPokemonStatsEffect(game.opponent.active); game.store.reduceEffect(game.state, empty); expect(empty.weakness).toEqual([]);
    game.source.cards = [game.register(new DamageTarget())]; game.player.discard.cards = [card];
    game.store.reduceEffect(game.state, new CheckPokemonStatsEffect(game.opponent.active));
    game.player.discard.cards = []; game.source.cards = [card];
    const powers = new CheckPokemonPowersEffect(game.player, card); game.store.reduceEffect(game.state, powers);
    expect(powers.powers.some(power => power.name === 'Star Cipher')).toBe(false); expect(game.player.usedVSTAR).toBe(true);
  });
  for (const blocked of [false, true]) it(`Star Order grant and activation follow actual Tool blocking: ${blocked}`, () => {
    const game = fixture(), holder = game.register(new NativeVTarget()), stone = game.register(new SkySealStone());
    game.source.cards = [holder]; game.source.tools.push(stone);
    if (blocked) game.player.stadium.cards = [game.register(new JammingTower())];
    const powers = new CheckPokemonPowersEffect(game.player, holder); game.store.reduceEffect(game.state, powers);
    expect(powers.powers.some(power => power.name === 'Star Order')).toBe(!blocked);
    if (blocked) expect(() => game.store.reduceEffect(game.state, new PowerEffect(game.player, stone.powers[0], holder))).toThrow();
    else game.store.reduceEffect(game.state, new PowerEffect(game.player, stone.powers[0], holder));
    expect(game.player.usedVSTAR).toBe(!blocked); expect(stone.extraPrizes).toBe(!blocked);
  });
  for (const create of [() => new AerodactylVstar(), () => new UnownVSTAR()]) it(`Freezing Shroud sees the actual gained Ability of ${create().fullName}`, () => {
    const game = fixture(), card = game.register(create()), frost = game.register(new Froslass());
    game.source.cards = [card]; game.player.bench[0].cards = [frost];
    game.store.reduceEffect(game.state, new AttackEffect(game.player, game.opponent, card.attacks[1]));
    game.state.phase = GamePhase.BETWEEN_TURNS; game.store.reduceEffect(game.state, new BetweenTurnsEffect(game.player));
    expect(game.source.damage).toBe(10);
  });
});


