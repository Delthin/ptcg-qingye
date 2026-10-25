import { Store } from '../../game/store/store';
import { State, GamePhase } from '../../game/store/state/state';
import { Player } from '../../game/store/state/player';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { PokemonCardList } from '../../game/store/state/pokemon-card-list';
import { CardType, CardTag, Stage } from '../../game/store/card/card-types';
import { PowerType } from '../../game/store/card/pokemon-types';
import { Effect } from '../../game/store/effects/effect';
import { AttackEffect, PowerEffect, PlaceDamageCountersEffect, EffectOfAbilityEffect } from '../../game/store/effects/game-effects';
import { PutCountersEffect, PutDamageEffect } from '../../game/store/effects/attack-effects';
import { GameError } from '../../game/game-error';
import { GameMessage } from '../../game/game-message';
import { putAbilityDamageCounters, putPokemonPowerDamageCounters, moveDamageCounters } from '../../game/store/prefabs/damage-counter-effects';
import { MetalGoggles } from '../08-sun-and-moon/set-team-up/metal-goggles';
import { Machoke } from '../08-sun-and-moon/set-guardians-rising/machoke';
import { Jirachi } from '../10-scarlet-and-violet/set-paradox-rift/jirachi';
import { SkyPillar } from '../08-sun-and-moon/set-celestial-storm/sky-pillar';
import { Cloyster } from '../03-ex-ruby-and-sapphire/set-ex-dragon-frontiers/cloyster';
import { Umbreon } from '../05-heartgold-and-soulsilver/set-call-of-legends/umbreon';
import { Poltchageist } from '../10-scarlet-and-violet/set-twilight-masquerade/poltchageist';
import { MistysMagikarp } from '../10-scarlet-and-violet/set-destined-rivals/mistys-magikarp';
import { TeamRocketsArticuno } from '../10-scarlet-and-violet/set-destined-rivals/team-rockets-articuno';
import { Shuppet } from '../11-mega-evolution/set-pitch-black/shuppet';
import { AntiqueSkullFossil } from '../11-mega-evolution/set-pitch-black/antique-skull-fossil';
class Target extends PokemonCard {
  public set = 'TEST'; public fullName = 'Guard Target TEST'; public name = 'Guard Target'; public hp = 300; public stage = Stage.BASIC;
  public cardType = [CardType.METAL]; protected _tags = [CardTag.DELTA_SPECIES, CardTag.TEAM_ROCKET];
  public powers = [{ name: 'Guard source', powerType: PowerType.ABILITY, text: '' }];
  public attacks = [{ name: 'Guard attack', cost: [], damage: 0, text: '' }];
}
class Lock extends Target {
  public provider?: PokemonCard; public ownerId = 29;
  public reduceEffect(_store: Store, state: State, effect: Effect): State {
    if (effect instanceof PowerEffect && effect.card === this.provider && effect.player.id === this.ownerId) throw new GameError(GameMessage.BLOCKED_BY_ABILITY);
    return state;
  }
}
function board() {
  const state = new State(); state.phase = GamePhase.ATTACK; state.turn = 5; state.players = [new Player(), new Player()];
  for (const [i,p] of state.players.entries()) { p.id = i === 0 ? 17 : 29; p.active.cards = [new Target()]; p.bench = Array.from({length:5},()=>new PokemonCardList()); p.bench[0].cards=[new Target()]; p.bench[1].cards=[new Target()]; }
  const store = new Store({onStateChange(){}},false); store.state=state;
  const player=state.players[0], opponent=state.players[1]; return {store,state,player,opponent};
}
function attack(g: ReturnType<typeof board>) { return new AttackEffect(g.player,g.opponent,g.player.active.getPokemonCard()!.attacks[0]); }
function recipient(kind: 'metal'|'machoke', disabled = false) {
  const g=board(); const target=kind==='metal'?g.opponent.active:g.opponent.bench[1];
  if(kind==='metal') {target.tools=[new MetalGoggles()];if(disabled)g.opponent.stadiumAndToolHaveNoEffectTurnsRemaining=1;}
  else { const card=new Machoke();g.opponent.bench[0].cards=[card];if(disabled){const lock=new Lock();lock.provider=card;g.player.bench[4].cards=[lock];} }
  return {...g,target};
}
describe('counter defensive guards preserve source and recipient semantics',()=>{
  for(const ward of ['metal','machoke'] as const)for(const disabled of [false,true])for(const origin of ['ability','legacy','trainer','attack'] as const)it(`${ward} ${origin} placement with guard disabled=${disabled}`,()=>{
    const g=recipient(ward,disabled),source=g.player.active.getPokemonCard()!;
    if(origin==='ability')putAbilityDamageCounters(g.store,g.state,new PowerEffect(g.player,source.powers[0],source),g.target,10);
    else if(origin==='legacy'){source.powers[0].powerType=PowerType.POKEPOWER;putPokemonPowerDamageCounters(g.store,g.state,source,g.target,10);}
    else if(origin==='trainer'){const placement=new PlaceDamageCountersEffect(g.player,g.target,10);placement.origin='trainer';g.store.reduceEffect(g.state,placement);}
    else{const placement=new PutCountersEffect(attack(g),10);placement.target=g.target;g.store.reduceEffect(g.state,placement);}
    expect(g.target.damage).toBe(!disabled&&(origin==='ability'||origin==='attack')?0:10);
  });
  for(const ward of ['metal','machoke'] as const)it(`${ward} recipient-only protection does not stop removing counters from that Pokemon`,()=>{
    const g=recipient(ward),source=g.target;source.damage=10;
    moveDamageCounters(g.store,g.state,g.player,source,g.player.active,10,attack(g));
    expect(source.damage).toBe(0);expect(g.player.active.damage).toBe(10);
  });
  for(const ward of ['metal','machoke','jirachi'] as const)it(`${ward} must not prevent its controller's own attack counters`,()=>{
    const g=board(),target=g.player.bench[1];
    if(ward==='metal')target.tools=[new MetalGoggles()];else g.player.bench[0].cards=[ward==='machoke'?new Machoke():new Jirachi()];
    const placement=new PutCountersEffect(attack(g),10);placement.target=target;g.store.reduceEffect(g.state,placement);expect(target.damage).toBe(10);
  });
  it('Metal Goggles reduces damage after weakness exactly once',()=>{
    const g=recipient('metal');g.player.active.getPokemonCard()!.cardType=[CardType.FIRE];g.target.getPokemonCard()!.weakness=[{type:CardType.FIRE}];
    const damage=new PutDamageEffect(attack(g),40);damage.target=g.target;g.store.reduceEffect(g.state,damage);expect(g.target.damage).toBe(50);
  });
  const guards=['sky','cloyster','umbreon','poltchageist','magikarp','articuno','hide'] as const;
  function allEffects(kind: typeof guards[number], disabled: boolean) {
    const g=board();let target=g.opponent.bench[1],provider:PokemonCard|undefined;
    if(kind==='sky'){g.player.stadium.cards=[new SkyPillar()];if(disabled)g.opponent.stadiumAndToolHaveNoEffectTurnsRemaining=1;}
    else if(kind==='umbreon'){const card=new Umbreon();g.opponent.active.cards=[card];target=g.opponent.active;g.player.active.getPokemonCard()!.powers[0].powerType=PowerType.POKEPOWER;if(!disabled)card.marker.addMarker(card.MOONLIGHT_FANG_MARKER,card);}
    else if(kind==='poltchageist'||kind==='magikarp'||kind==='hide'){provider=kind==='poltchageist'?new Poltchageist():kind==='hide'?new Shuppet():new MistysMagikarp();target.cards=[provider];}
    else {provider=kind==='cloyster'?new Cloyster():new TeamRocketsArticuno();g.opponent.bench[0].cards=[provider];}
    if(provider&&disabled){const lock=new Lock();lock.provider=provider;g.player.bench[4].cards=[lock];}
    return {...g,target};
  }
  for(const ward of guards)for(const disabled of [false,true])for(const direction of ['from','to'] as const)it(`${ward} all-effects ${direction} with guard disabled=${disabled}`,()=>{
    const g=allEffects(ward,disabled),source=direction==='from'?g.target:g.player.active,target=direction==='from'?g.player.active:g.target;source.damage=10;
    moveDamageCounters(g.store,g.state,g.player,source,target,10,attack(g));
    expect(source.damage).toBe(!disabled&&direction==='from'?10:0);
    expect(target.damage).toBe(disabled?10:0);
  });
  for(const sourceKind of ['ability','legacy','trainer'] as const)for(const direction of ['from','to'] as const)it(`Hide-n-sneak ${sourceKind} counter movement ${direction}`,()=>{
    const g=allEffects('hide',false),source=direction==='from'?g.target:g.player.active,target=direction==='from'?g.player.active:g.target;
    source.damage=10;const card=g.player.active.getPokemonCard()!;card.powers[0].powerType=sourceKind==='legacy'?PowerType.POKEPOWER:PowerType.ABILITY;
    const origin=sourceKind==='trainer'?undefined:new PowerEffect(g.player,card.powers[0],card);
    moveDamageCounters(g.store,g.state,g.player,source,target,10,origin);
    expect(source.damage).toBe(sourceKind==='ability'&&direction==='from'?10:0);expect(target.damage).toBe(sourceKind==='ability'?0:10);
  });
  it('Hide-n-sneak allows an untargeted ability check without throwing',()=>{
    const g=allEffects('hide',false),card=g.player.active.getPokemonCard()!;
    const probe=new EffectOfAbilityEffect(g.player,card.powers[0],card);
    expect(()=>g.store.reduceEffect(g.state,probe)).not.toThrow();expect(probe.preventDefault).toBe(false);expect(g.target.damage).toBe(0);
  });
  it('Hide-n-sneak also recognizes a Fossil acting as a Pokemon source',()=>{
    const g=board(),shuppet=new Shuppet(),fossil=new AntiqueSkullFossil();g.player.active.cards=[shuppet];g.opponent.active.cards=[fossil];
    const damage=new PutDamageEffect(attack(g),10);damage.target=g.opponent.active;g.store.reduceEffect(g.state,damage);
    expect(g.opponent.active.getPokemonCard()).toBe(fossil);expect(g.player.active.damage).toBe(0);
  });
  for(const protectedSource of [false,true])it(`next-turn all-effects marker is respected on the removal source: ${protectedSource}`,()=>{
    const g=board(),source=g.opponent.bench[1];source.damage=10;if(protectedSource)source.preventEffectsOfAttacksNextTurn={};
    moveDamageCounters(g.store,g.state,g.player,source,g.player.active,10,attack(g));expect(source.damage).toBe(protectedSource?10:0);expect(g.player.active.damage).toBe(protectedSource?0:10);
  });
});
