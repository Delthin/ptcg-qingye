import { Store } from '../../game/store/store';
import { State, GamePhase } from '../../game/store/state/state';
import { Player } from '../../game/store/state/player';
import { PokemonCardList } from '../../game/store/state/pokemon-card-list';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { CardType } from '../../game/store/card/card-types';
import { EvolveEffect, PowerEffect } from '../../game/store/effects/game-effects';
import { PutDamagePrompt } from '../../game/store/prompts/put-damage-prompt';
import { ChoosePokemonPrompt } from '../../game/store/prompts/choose-pokemon-prompt';
import { ConfirmPrompt } from '../../game/store/prompts/confirm-prompt';
import { ResolvePromptAction } from '../../game/store/actions/resolve-prompt-action';
import { PlayerType, SlotType } from '../../game/store/actions/play-card-action';
import { Chandelure } from '../06-black-and-white/set-noble-victories/chandelure';
import { GalarianObstagoon } from '../09-sword-and-shield/set-sword-and-shield/galarian-obstagoon';
import { Giratina } from '../08-sun-and-moon/set-lost-thunder/giratina';
class Target extends PokemonCard {
  public set = 'TEST'; public fullName = 'Selection Target TEST'; public name = 'Selection Target'; public hp = 200;
  public cardType = [CardType.COLORLESS];
}
function board() {
  const state = new State(); state.phase = GamePhase.PLAYER_TURN; state.turn = 5;
  state.players = [new Player(), new Player()]; state.players[0].id = 17; state.players[1].id = 29;
  for (const p of state.players) { p.active.cards = [new Target()]; p.bench = Array.from({ length: 5 }, () => new PokemonCardList()); p.bench[0].cards = [new Target()]; }
  const store = new Store({ onStateChange() {} }, false); store.state = state;
  return { state, store, player: state.players[0], opponent: state.players[1] };
}
const active = { player: PlayerType.TOP_PLAYER, slot: SlotType.ACTIVE, index: 0 };
const bench = { player: PlayerType.TOP_PLAYER, slot: SlotType.BENCH, index: 0 };
describe('counter target count contracts', () => {
  it('Chandelure places all three counters even when the only opponent has 10 HP left', () => {
    const g = board(), card = new Chandelure(); g.player.active.cards = [card]; g.opponent.bench[0].cards = []; g.opponent.active.damage = 190;
    card.reduceEffect(g.store, g.state, new PowerEffect(g.player, card.powers[0], card));
    const prompt = g.state.prompts.find(p => p instanceof PutDamagePrompt) as PutDamagePrompt;
    expect(prompt.damage).toBe(30); expect(prompt.maxAllowedDamage).toEqual([]);
    expect(prompt.validate([{ target: active, damage: 30 }], g.state)).toBe(true);
    expect(prompt.validate([{ target: active, damage: 10 }], g.state)).toBe(false);
  });
  it('Obstagoon requires one recipient rather than a split three-counter allocation', () => {
    const g = board(), card = new GalarianObstagoon(); g.player.active.cards = [card];
    card.reduceEffect(g.store, g.state, new EvolveEffect(g.player, g.player.active, card));
    const confirm = g.state.prompts.find(p => p instanceof ConfirmPrompt) as ConfirmPrompt;
    g.store.dispatch(new ResolvePromptAction(confirm.id, true), g.player.id);
    const prompt = g.state.prompts.find(p => p instanceof PutDamagePrompt) as PutDamagePrompt;
    expect(prompt.options.maxTargets).toBe(1);
    expect(prompt.validate([{ target: active, damage: 30 }], g.state)).toBe(true);
    expect(prompt.validate([{ target: active, damage: 20 }, { target: bench, damage: 10 }], g.state)).toBe(false);
  });
  for (const count of [0, 1, 2, 3]) it(`Giratina selects exactly min(2, available bench count): ${count}`, () => {
    const g = board(), card = new Giratina(); g.player.discard.cards = [card];
    for (let i = 0; i < 5; i++) g.opponent.bench[i].cards = i < count ? [new Target()] : [];
    card.reduceEffect(g.store, g.state, new PowerEffect(g.player, card.powers[0], card));
    expect(g.player.bench[1].cards).toContain(card); expect(g.player.discard.cards).not.toContain(card);
    const prompt = g.state.prompts.find(p => p instanceof ChoosePokemonPrompt) as ChoosePokemonPrompt | undefined;
    if (count === 0) { expect(prompt).toBeUndefined(); return; }
    expect(prompt!.options.min).toBe(Math.min(2, count)); expect(prompt!.options.max).toBe(Math.min(2, count));
  });
});
