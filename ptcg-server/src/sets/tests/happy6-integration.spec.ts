import { Store } from '../../game/store/store';
import { State, GamePhase } from '../../game/store/state/state';
import { Player } from '../../game/store/state/player';
import { CardList } from '../../game/store/state/card-list';
import { PokemonCardList } from '../../game/store/state/pokemon-card-list';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { EnergyCard } from '../../game/store/card/energy-card';
import { CardType, EnergyType } from '../../game/store/card/card-types';
import { Effect } from '../../game/store/effects/effect';
import { AddSpecialConditionsEffect } from '../../game/store/effects/attack-effects';
import { CoinFlipEffect } from '../../game/store/effects/play-card-effects';
import { AttackAction, RetreatAction, RetreatStartAction } from '../../game/store/actions/game-actions';
import { PlayerType, SlotType } from '../../game/store/actions/play-card-action';
import { ResolvePromptAction } from '../../game/store/actions/resolve-prompt-action';
import { WaitPrompt } from '../../game/store/prompts/wait-prompt';
import { Prompt } from '../../game/store/prompts/prompt';
import { ChooseAttackPrompt } from '../../game/store/prompts/choose-attack-prompt';
import { ChoosePokemonPrompt } from '../../game/store/prompts/choose-pokemon-prompt';
import { ChooseEnergyPrompt } from '../../game/store/prompts/choose-energy-prompt';
import { Clefable } from '../10-scarlet-and-violet/set-twilight-masquerade/clefable';
import { Laprasex } from '../10-scarlet-and-violet/set-stellar-crown/lapras-ex';
import { DoubleTurboEnergy } from '../09-sword-and-shield/set-brilliant-stars/double-turbo-energy';
import { TempleofSinnoh } from '../09-sword-and-shield/set-astral-radiance/temple-of-sinnoh';
import { MistysStaryu } from '../10-scarlet-and-violet/set-destined-rivals/mistys-staryu';
import { TeamRocketsRattata } from '../10-scarlet-and-violet/set-destined-rivals/team-rockets-rattata-dri';
import { ConfirmPrompt } from '../../game/store/prompts/confirm-prompt';
import { MoveEnergyPrompt } from '../../game/store/prompts/move-energy-prompt';
import { ChoosePrizePrompt } from '../../game/store/prompts/choose-prize-prompt';
import { DarkElectrode } from '../03-ex-ruby-and-sapphire/set-ex-team-rocket-returns/dark-electrode';
import { Happy6Squawkabilly } from '../10-scarlet-and-violet/set-happy-trainers/utility/cards';
import { Lucario } from '../10-scarlet-and-violet/set-scarlet-and-violet/lucario';
import { WAS_POKEMON_KNOCKED_OUT_DURING_OPPONENTS_LAST_TURN } from '../../game/store/prefabs/prefabs';

class Plain extends PokemonCard {
  public name = 'Integration target'; public fullName = 'Integration target TEST'; public set = 'TEST';
  public hp = 500; public cardType = [CardType.COLORLESS];
  public retreat = [CardType.COLORLESS, CardType.COLORLESS];
}
class Basic extends EnergyCard {
  public set = 'TEST'; public name = 'Integration basic'; public fullName = 'Integration basic TEST';
  public energyType = EnergyType.BASIC;
  constructor(type = CardType.PSYCHIC) { super(); this.provides = [type]; }
}
function board(attacker: PokemonCard, defender: PokemonCard, side = 0) {
  const state = new State(); state.phase = GamePhase.PLAYER_TURN; state.turn = 5; state.activePlayer = side;
  state.players = [new Player(), new Player()]; state.players[0].id = 17; state.players[1].id = 29;
  for (const p of state.players) {
    p.active.cards = [new Plain()]; p.bench = Array.from({ length: 5 }, () => new PokemonCardList());
    p.bench[0].cards = [new Plain()];
    p.deck.cards = Array.from({ length: 20 }, () => new Plain());
    p.prizes = Array.from({ length: 6 }, () => { const pile = new CardList(); pile.cards = [new Plain()]; return pile; });
  }
  const player = state.players[side], opponent = state.players[1 - side];
  player.active.cards = [attacker]; opponent.active.cards = [defender];
  const store = new Store({ onStateChange() {} }, false); store.state = state;
  const identify = () => {
    let id = 1;
    for (const p of state.players) for (const pile of [p.active, ...p.bench, p.hand, p.deck, p.discard, p.supporter, p.stadium, ...p.prizes]) {
      for (const card of pile.cards) card.id = id++;
    }
  };
  const finish = (copiedAttack?: string, extra?: (prompt: Prompt<any>) => unknown) => {
    for (let i = 0; i < 60; i++) {
      const prompt = store.state.prompts.find(p => p.result === undefined);
      if (!prompt) return;
      let raw: any = extra?.(prompt);
      if (raw === undefined) {
        if (prompt instanceof WaitPrompt) raw = null;
        else if (prompt instanceof ChooseAttackPrompt && copiedAttack) raw = { index: 0, attack: copiedAttack };
        else if (prompt instanceof ChoosePokemonPrompt) raw = [{ player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 }];
        else if (prompt instanceof ChooseEnergyPrompt) {
          const index = prompt.energy.findIndex(e => e.card instanceof DoubleTurboEnergy);
          if (index < 0) throw new Error('Missing Double Turbo payment');
          raw = [index];
        } else throw new Error('Unexpected integration prompt: ' + prompt.type);
      }
      const current = prompt as Prompt<any>;
      const result = current.decode(raw, store.state);
      expect(current.validate(result, store.state)).toBe(true);
      store.dispatch(new ResolvePromptAction(prompt.id, result), prompt.playerId);
    }
    throw new Error('Integration prompt loop');
  };
  const attack = (name: string, copiedAttack?: string, extra?: (prompt: Prompt<any>) => unknown) => {
    identify(); store.dispatch(new AttackAction(player.id, name), player.id); finish(copiedAttack, extra);
  };
  return { state, player, opponent, store, identify, finish, attack };
}

describe('Happy6 merged effect contracts through real actions', () => {
  for (const side of [0, 1]) {
    for (const variant of ['basic', 'double', 'temple']) {
      it(`seat ${side}: real Metronome copies Power Splash with ${variant} supply once`, () => {
        const clefable = new Clefable(), lapras = new Laprasex();
        const g = board(clefable, lapras, side);
        g.player.active.cards.push(new Basic());
        g.player.active.cards.push(variant === 'basic' ? new Basic() : new DoubleTurboEnergy());
        if (variant === 'temple') g.player.stadium.cards = [new TempleofSinnoh()];
        g.attack('Metronome', 'Power Splash');
        expect(g.opponent.active.getPokemonCard()).toBe(lapras);
        expect(g.opponent.active.damage).toBe(variant === 'double' ? 100 : 80);
        expect(g.player.active.damage).toBe(0);
        expect(g.store.state.activePlayer).toBe(1 - side);
      });
    }
    for (const source of [new MistysStaryu(), new TeamRocketsRattata()]) {
      it(`seat ${side}: ${source.name} applies its protected attack status after main damage`, () => {
        const defender = new Plain(); const g = board(source, defender, side);
        for (const type of source.attacks[0].cost) g.player.active.cards.push(new Basic(type));
        const seen: number[] = [];
        const originalTarget = defender.reduceEffect.bind(defender);
        spyOn(defender, 'reduceEffect').and.callFake((store: any, state: State, effect: Effect): State => {
          if (effect instanceof AddSpecialConditionsEffect && effect.target === g.opponent.active) {
            seen.push(g.opponent.active.damage);
            expect(effect.source).toBe(g.player.active);
          }
          return originalTarget(store, state, effect);
        });
        const reduce = g.store.reduceEffect.bind(g.store);
        spyOn(g.store, 'reduceEffect').and.callFake((state: State, effect: Effect): State => {
          if (!(effect instanceof CoinFlipEffect)) return reduce(state, effect);
          effect.result = true;
          return g.store.prompt(state, new WaitPrompt(effect.player.id, 0, 'Scripted coin'), () => {
            if (effect.callback) effect.callback(true);
          });
        });
        g.attack(source.attacks[0].name);
        expect(seen).toEqual([source.attacks[0].damage]);
      });
    }
  }
  for (const start of [false, true]) {
    it(`${start ? 'RetreatStartAction' : 'RetreatAction'} can pay two units with one Double Turbo card`, () => {
      const source = new Plain(); const g = board(source, new Plain());
      const turbo = new DoubleTurboEnergy(), basic = new Basic();
      const replacement = g.player.bench[0].getPokemonCard();
      g.player.active.cards.push(turbo, basic); g.identify();
      g.store.dispatch(start ? new RetreatStartAction(g.player.id) : new RetreatAction(g.player.id, 0), g.player.id);
      g.finish();
      expect(g.player.active.getPokemonCard()).toBe(replacement);
      expect(g.player.bench[0].getPokemonCard()).toBe(source);
      expect(g.player.bench[0].cards).toContain(basic);
      expect(g.player.discard.cards).toEqual([turbo]);
      expect(g.player.retreatedTurn).toBe(g.state.turn);
    });
  }
});

describe('Happy6 post-review lifecycle integration', () => {
  for (const side of [0, 1]) it(`seat ${side}: Squawkabilly switching a lethally damaged target keeps attack-damage KO cause`, () => {
    const source = new Happy6Squawkabilly(), target = new Lucario();
    const g = board(source, target, side);
    g.player.active.cards.push(new Basic());
    g.opponent.active.damage = target.hp - source.attacks[0].damage;
    g.attack(source.attacks[0].name, undefined, prompt => {
      if (prompt instanceof ConfirmPrompt) return true;
      if (prompt instanceof ChoosePrizePrompt) return [0];
      return undefined;
    });
    expect(g.opponent.discard.cards).toContain(target);
    const event = g.opponent.knockoutEventsDuringOpponentsLastTurn.find(e => e.target === target);
    expect(event).toBeDefined();
    expect(event!.cause).toBe('attack-damage');
    expect(event!.sourcePlayerId).toBe(g.player.id);
    expect(WAS_POKEMON_KNOCKED_OUT_DURING_OPPONENTS_LAST_TURN(g.opponent, {
      byAttackDamage: true, types: [CardType.FIGHTING],
    })).toBe(true);
  });
  for (const variant of ['copy-no', 'copy-yes', 'normal-yes']) {
    it(`Energy Bomb ${variant} consumes its pending handler once and can move every Energy card`, () => {
      const copied = variant !== 'normal-yes';
      const electrode = new DarkElectrode();
      const source = copied ? new Clefable() : electrode;
      const g = board(source, copied ? electrode : new Plain());
      const energies = [new Basic(copied ? CardType.PSYCHIC : CardType.LIGHTNING),
        new Basic(copied ? CardType.PSYCHIC : CardType.LIGHTNING)];
      g.player.active.cards.push(...energies);
      let confirmations = 0, transfers = 0;
      g.attack(copied ? 'Metronome' : 'Energy Bomb', copied ? 'Energy Bomb' : undefined, prompt => {
        if (prompt instanceof ConfirmPrompt) {
          confirmations++;
          return variant !== 'copy-no';
        }
        if (prompt instanceof MoveEnergyPrompt) {
          transfers++;
          return energies.map(card => ({
            from: { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 },
            to: { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 },
            index: g.player.active.cards.indexOf(card),
          }));
        }
        return undefined;
      });
      expect(confirmations).toBe(1);
      expect(transfers).toBe(variant === 'copy-no' ? 0 : 1);
      expect(g.opponent.active.damage).toBe(30);
      for (const card of energies) {
        expect((variant === 'copy-no' ? g.player.active : g.player.bench[0]).cards).toContain(card);
      }
      expect(g.player.discard.cards.length).toBe(0);
    });
  }
});
