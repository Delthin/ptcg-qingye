import { Store } from '../../game/store/store';
import { State, GamePhase } from '../../game/store/state/state';
import { Player } from '../../game/store/state/player';
import { CardList } from '../../game/store/state/card-list';
import { PokemonCardList } from '../../game/store/state/pokemon-card-list';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { EnergyCard } from '../../game/store/card/energy-card';
import { CardType } from '../../game/store/card/card-types';
import { AttackAction } from '../../game/store/actions/game-actions';
import { ResolvePromptAction } from '../../game/store/actions/resolve-prompt-action';
import { WaitPrompt } from '../../game/store/prompts/wait-prompt';
import { Prompt } from '../../game/store/prompts/prompt';
import { ChoosePrizePrompt } from '../../game/store/prompts/choose-prize-prompt';
import { ChoosePokemonPrompt } from '../../game/store/prompts/choose-pokemon-prompt';
import { PlayerType, SlotType } from '../../game/store/actions/play-card-action';
import { Mankey } from '../10-scarlet-and-violet/set-scarlet-and-violet/mankey';
import { Gimmighoul } from '../10-scarlet-and-violet/set-paradox-rift/gimmighoul';
import { Cresselia } from '../09-sword-and-shield/set-chilling-reign/cresselia';

class RecoilTarget extends PokemonCard {
  public set = 'TEST'; public name = 'Recoil Target'; public fullName = 'Recoil Target TEST'; public hp = 200;
  public cardType = [CardType.COLORLESS]; public weakness = []; public resistance = [];
}
class RecoilEnergy extends EnergyCard {
  public set = 'TEST'; public name = 'Fighting Energy'; public fullName = 'Recoil Fighting Energy TEST'; public provides = [CardType.FIGHTING];
}
function board(attackingIndex: number) {
  const state = new State(); state.phase = GamePhase.PLAYER_TURN; state.turn = 5; state.activePlayer = attackingIndex;
  state.players = [new Player(), new Player()]; let id = 1000;
  const identify = <T extends PokemonCard | EnergyCard>(card: T): T => { card.id = id++; return card; };
  for (const [i, player] of state.players.entries()) {
    player.id = i === 0 ? 17 : 29; player.active.cards = [identify(new RecoilTarget())];
    player.bench = Array.from({ length: 5 }, () => new PokemonCardList()); player.bench[0].cards = [identify(new RecoilTarget())];
    player.deck.cards = Array.from({ length: 10 }, () => identify(new RecoilTarget()));
    player.prizes = Array.from({ length: 6 }, () => { const list = new CardList(); list.cards = [identify(new RecoilTarget())]; return list; });
  }
  const player = state.players[attackingIndex], opponent = state.players[1 - attackingIndex], card = identify(new Mankey());
  player.active.cards = [card, identify(new RecoilEnergy())];
  const store = new Store({ onStateChange() {} }, false); store.state = state;
  return { store, state, player, opponent, card };
}
describe('Mankey full attack recoil regression', () => {
  for (const create of [() => new Gimmighoul(), () => new Cresselia()]) it(`Fighting resistance on ${create().fullName} cancels opponent damage but not recoil`, () => {
    const g = board(0), defender = create(); defender.id = 2000; g.opponent.active.cards = [defender];
    expect(defender.resistance.some(r => r.type === CardType.FIGHTING && r.value === -30)).toBe(true);
    g.store.dispatch(new AttackAction(g.player.id, g.card.attacks[0].name));
    const prompt = g.state.prompts.find(p => p.result === undefined);
    if (!(prompt instanceof WaitPrompt)) throw new Error('Expected the real attack animation wait');
    g.store.dispatch(new ResolvePromptAction(prompt.id, true), prompt.playerId);
    expect(g.player.active.damage).toBe(10);
    expect(g.opponent.active.damage).toBe(0);
    expect(g.store.hasPrompts()).toBe(false);
    expect(g.state.activePlayer).toBe(1);
  });
  it('still deals opponent damage when the recoil knocks Mankey out', () => {
    const g = board(0); g.player.active.damage = 50;
    g.store.dispatch(new AttackAction(g.player.id, g.card.attacks[0].name));
    for (let step = 0; g.store.hasPrompts() && step < 8; step++) {
      const prompt = g.state.prompts.find(p => p.result === undefined);
      if (!prompt) throw new Error('Pending prompt not found');
      let raw: unknown;
      if (prompt instanceof WaitPrompt) raw = true;
      else if (prompt instanceof ChoosePrizePrompt) raw = [0];
      else if (prompt instanceof ChoosePokemonPrompt) raw = [{ player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 }];
      else throw new Error('Unexpected prompt: ' + prompt.type);
      const responsePrompt: Prompt<unknown> = prompt;
      const decoded = responsePrompt.decode(raw, g.state);
      expect(responsePrompt.validate(decoded, g.state)).toBe(true);
      g.store.dispatch(new ResolvePromptAction(prompt.id, decoded), prompt.playerId);
    }
    expect(g.opponent.active.damage).toBe(30);
    expect(g.player.discard.cards.includes(g.card)).toBe(true);
    expect(g.opponent.prizes.filter(p => p.cards.length > 0).length).toBe(5);
    expect(g.store.hasPrompts()).toBe(false);
  });
  for (const attackingIndex of [0, 1]) it(`Monkey Beatdown deals both opponent 30 and recoil 10 for player ${attackingIndex}`, () => {
    const g = board(attackingIndex);
    g.store.dispatch(new AttackAction(g.player.id, g.card.attacks[0].name));
    const prompt = g.state.prompts.find(p => p.result === undefined);
    expect(prompt instanceof WaitPrompt).toBe(true);
    if (!(prompt instanceof WaitPrompt)) throw new Error('Expected the real attack animation wait');
    expect(prompt.message).toBe('Attack animation');
    g.store.dispatch(new ResolvePromptAction(prompt.id, true), prompt.playerId);
    expect(g.player.active.damage).toBe(10);
    expect(g.opponent.active.damage).toBe(30);
    expect(g.store.hasPrompts()).toBe(false);
    expect(g.state.activePlayer).toBe(1 - attackingIndex);
  });
});
