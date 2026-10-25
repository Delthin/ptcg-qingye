import { Store } from '../../game/store/store';
import { State, GamePhase } from '../../game/store/state/state';
import { Player } from '../../game/store/state/player';
import { Card } from '../../game/store/card/card';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { PokemonCardList } from '../../game/store/state/pokemon-card-list';
import { CardList } from '../../game/store/state/card-list';
import { CardTarget, PlayerType, SlotType } from '../../game/store/actions/play-card-action';
import { ResolvePromptAction } from '../../game/store/actions/resolve-prompt-action';
import { MoveDamagePrompt } from '../../game/store/prompts/move-damage-prompt';
import { ChoosePokemonPrompt } from '../../game/store/prompts/choose-pokemon-prompt';
import { ChoosePrizePrompt } from '../../game/store/prompts/choose-prize-prompt';
import { CAN_PLAY_TRAINER_CARD } from '../../game/store/prefabs/trainer-prefabs';
import { Agatha } from '../09-sword-and-shield/set-chilling-reign/agatha';
import { playTrainerCard } from './card-test-helpers';

class AgathaTarget extends PokemonCard {
  public set = 'TEST';
  public name = 'Agatha Target';
  public fullName = 'Agatha Target TEST';
  public hp = 200;
}
const own: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
const opposing: CardTarget = { player: PlayerType.TOP_PLAYER, slot: SlotType.ACTIVE, index: 0 };

function setup(ownerIndex = 0, damage = 40) {
  const state = new State();
  state.phase = GamePhase.PLAYER_TURN; state.turn = 3; state.activePlayer = ownerIndex;
  state.players = [new Player(), new Player()];
  state.players[0].id = 17; state.players[1].id = 29;
  const register = <T extends Card>(card: T): T => {
    card.id = state.cardNames.length; state.cardNames.push(card.fullName); return card;
  };
  for (const player of state.players) {
    player.active.cards = [register(new AgathaTarget())];
    player.bench = Array.from({ length: 5 }, () => new PokemonCardList());
    player.bench[0].cards = [register(new AgathaTarget())];
    player.bench[0].damage = 10;
    player.bench[2].cards = [register(new AgathaTarget())];
    player.deck.cards = [register(new AgathaTarget())];
    player.prizes = Array.from({ length: 6 }, () => {
      const prize = new CardList(); prize.isSecret = true; prize.cards = [register(new AgathaTarget())]; return prize;
    });
  }
  const player = state.players[ownerIndex], opponent = state.players[1 - ownerIndex];
  player.active.damage = damage; opponent.active.damage = 20;
  const card = register(new Agatha()); player.hand.cards = [card];
  const store = new Store({ onStateChange() {} }, false); store.state = state;
  const pending = () => state.prompts.filter(prompt => prompt.result === undefined);
  const play = () => playTrainerCard(store, state, ownerIndex, card.fullName);
  const prompt = () => {
    const current = pending()[0];
    if (!(current instanceof MoveDamagePrompt)) throw new Error('Expected Agatha move prompt');
    return current;
  };
  const answer = (count: number) => {
    const current = prompt();
    const result = Array.from({ length: count }, () => ({ from: own, to: opposing }));
    expect(current.validate(result, state)).toBe(true);
    store.dispatch(new ResolvePromptAction(current.id, result));
  };
  return { state, store, player, opponent, card, register, pending, play, prompt, answer };
}

describe('Agatha CRE actual supporter damage-counter transfer', () => {
  for (const count of [1, 2, 3]) {
    it(`moves ${count} counters of 10 damage from own active to opposing active`, () => {
      const game = setup();
      game.play();
      expect(game.pending().length).toBe(1);
      expect(game.prompt().playerType).toBe(PlayerType.ANY);
      expect(game.prompt().slots).toEqual([SlotType.ACTIVE]);
      game.answer(count);
      expect(game.player.active.damage).toBe(40 - count * 10);
      expect(game.opponent.active.damage).toBe(20 + count * 10);
      expect(game.player.bench[0].damage).toBe(10);
      expect(game.opponent.bench[0].damage).toBe(10);
      expect(game.player.hand.cards).not.toContain(game.card);
      expect(game.player.supporter.cards).not.toContain(game.card);
      expect(game.player.discard.cards).toContain(game.card);
      expect(game.player.supporterTurn).toBe(1);
      expect(game.pending().length).toBe(0);
    });
  }
  it('limits the available count to damage actually on the active', () => {
    const game = setup(0, 10); game.play();
    expect(game.prompt().options.max).toBe(1);
    expect(game.prompt().validate([{ from: own, to: opposing }, { from: own, to: opposing }], game.state)).toBe(false);
    game.answer(1);
    expect(game.player.active.damage).toBe(0);
    expect(game.opponent.active.damage).toBe(30);
  });
  it('rejects reverse, own-side and bench transfers', () => {
    const game = setup(); game.play(); const prompt = game.prompt();
    for (const [from, to] of [
      [opposing, own], [own, own],
      [{ ...own, slot: SlotType.BENCH }, opposing],
      [own, { ...opposing, slot: SlotType.BENCH }],
    ]) expect(prompt.validate([{ from, to }], game.state)).toBe(false);
    expect(prompt.validate(Array.from({ length: 4 }, () => ({ from: own, to: opposing })), game.state)).toBe(false);
  });
  it('does not play or consume a Supporter when only the bench has damage', () => {
    const game = setup(0, 0);
    expect(CAN_PLAY_TRAINER_CARD(game.store, game.state, game.player, game.card)).toBe(false);
    expect(game.play).toThrow();
    expect(game.player.hand.cards).toContain(game.card);
    expect(game.player.supporterTurn).toBe(0);
    expect(game.pending().length).toBe(0);
  });
  it('keeps one-Supporter-per-turn enforcement after successful cleanup', () => {
    const game = setup(); game.play(); game.answer(1);
    const second = game.register(new Agatha()); game.player.hand.cards.push(second);
    expect(() => playTrainerCard(game.store, game.state, 0, second.fullName)).toThrow();
    expect(game.player.supporterTurn).toBe(1);
    expect(game.opponent.active.damage).toBe(30);
  });
  it('uses the same relative directions for the second player', () => {
    const game = setup(1); game.play();
    expect(game.prompt().playerId).toBe(29);
    game.answer(2);
    expect(game.player.active.damage).toBe(20);
    expect(game.opponent.active.damage).toBe(40);
    expect(game.player.supporterTurn).toBe(1);
  });
  it('allows an active KO and finishes promotion, one prize and Trainer cleanup', () => {
    const game = setup();
    const knockedOut = game.opponent.active.getPokemonCard()!; knockedOut.hp = 40;
    const prize = game.player.prizes[0].cards[0];
    game.play(); game.answer(2);
    for (let i = 0; i < 4 && game.pending().length > 0; i++) {
      const prompt = game.pending()[0];
      if (prompt instanceof ChoosePokemonPrompt) {
        const result = prompt.decode([{ player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 }], game.state);
        expect(prompt.playerId).toBe(game.opponent.id);
        expect(prompt.validate(result, game.state)).toBe(true);
        game.store.dispatch(new ResolvePromptAction(prompt.id, result));
      } else if (prompt instanceof ChoosePrizePrompt) {
        const result = prompt.decode([0], game.state);
        expect(prompt.playerId).toBe(game.player.id);
        expect(prompt.validate(result, game.state)).toBe(true);
        game.store.dispatch(new ResolvePromptAction(prompt.id, result));
      } else throw new Error(`Unexpected KO prompt ${prompt.type}`);
    }
    expect(game.opponent.discard.cards).toContain(knockedOut);
    expect(game.player.hand.cards).toContain(prize);
    expect(game.player.prizesTaken).toBe(1);
    expect(game.player.discard.cards).toContain(game.card);
    expect(game.player.supporterTurn).toBe(1);
    expect(game.pending().length).toBe(0);
  });
});
