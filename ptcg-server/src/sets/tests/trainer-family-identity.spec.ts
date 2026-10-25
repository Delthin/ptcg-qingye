import { GameMessage } from '../../game/game-message';
import { GameError } from '../../game/game-error';
import { TrainerType } from '../../game/store/card/card-types';
import { CAN_PLAY_TRAINER_CARD } from '../../game/store/prefabs/trainer-prefabs';
import { PokemonBreeder as BaseSetBreeder } from '../set-base-set/pokemon-breeder';
import { PokemonBreederSLG, PokemonBreeder2SLG } from '../set-shining-legends/other-prints';
import { playTrainerCard } from './card-test-helpers';
import { padDeck, setupGame } from './test-helpers';

// Simplified-Chinese Pokemon Breeder: Supporter, draw 2 then heal 20 from
// your Active Pokemon. It is not the Base Set Item that skips an evolution stage.
function breederGame(CardClass = PokemonBreederSLG, deckCount = 8, damage = 30) {
  const game = setupGame({
    turn: 3,
    player1: { active: { card: 'Ralts SIT', damage }, deck: padDeck(deckCount) },
    player2: { active: { card: 'Ralts SIT' }, deck: padDeck(10) },
  });
  const card = new CardClass();
  card.id = 9500;
  game.player1.hand.cards = [card];
  return { ...game, card };
}

function canPlay(game: ReturnType<typeof breederGame>): boolean {
  return CAN_PLAY_TRAINER_CARD(game.store, game.state, game.player1, game.card);
}

describe('Trainer family identity: Pokemon Breeder SLG', () => {
  for (const CardClass of [PokemonBreederSLG, PokemonBreeder2SLG]) {
    it(`draws two and heals only the Active for ${CardClass.name}, using one Supporter`, () => {
      const game = breederGame(CardClass);
      const active = game.player1.active.getPokemonCard();
      const drawn = game.player1.deck.cards.slice(0, 2);
      expect(game.card.trainerType).toBe(TrainerType.SUPPORTER);
      expect(canPlay(game)).toBe(true);
      playTrainerCard(game.store, game.state, 0, game.card.fullName);
      expect(game.player1.hand.cards).toEqual(drawn);
      expect(game.player1.active.damage).toBe(10);
      expect(game.player1.active.getPokemonCard()).toBe(active);
      expect(game.player1.supporterTurn).toBe(1);
      expect(game.player1.discard.cards).toContain(game.card);
      expect(game.store.hasPrompts()).toBe(false);
    });
  }

  it('works when healing has no effect but drawing is possible, even with only one deck card', () => {
    const game = breederGame(PokemonBreederSLG, 1, 0);
    expect(canPlay(game)).toBe(true);
    playTrainerCard(game.store, game.state, 0, game.card.fullName);
    expect(game.player1.hand.cards.length).toBe(1);
    expect(game.player1.active.damage).toBe(0);
  });

  it('heals without drawing when the deck is empty and healing still has an effect', () => {
    const game = breederGame(PokemonBreederSLG, 0, 10);
    expect(canPlay(game)).toBe(true);
    playTrainerCard(game.store, game.state, 0, game.card.fullName);
    expect(game.player1.hand.cards.length).toBe(0);
    expect(game.player1.active.damage).toBe(0);
    expect(game.player1.supporterTurn).toBe(1);
  });

  it('does not offer a no-effect play when both drawing and healing are impossible', () => {
    const game = breederGame(PokemonBreederSLG, 0, 0);
    expect(canPlay(game)).toBe(false);
    expect(() => playTrainerCard(game.store, game.state, 0, game.card.fullName)).toThrow(new GameError(GameMessage.CANNOT_PLAY_THIS_CARD));
    expect(game.player1.hand.cards).toEqual([game.card]);
  });

  it('preserves an active healing block while drawing and rejects blocked healing as the only effect', () => {
    const game = breederGame(PokemonBreederSLG, 4, 30);
    game.player1.active.cannotBeHealedNextTurn = true;
    expect(canPlay(game)).toBe(true);
    playTrainerCard(game.store, game.state, 0, game.card.fullName);
    expect(game.player1.hand.cards.length).toBe(2);
    expect(game.player1.active.damage).toBe(30);
    const empty = breederGame(PokemonBreederSLG, 0, 30);
    empty.player1.active.cannotBeHealedNextTurn = true;
    expect(canPlay(empty)).toBe(false);
  });

  it('does not bypass Supporter-use or first-turn restrictions', () => {
    const game = breederGame();
    game.player1.supporterTurn = 1;
    expect(canPlay(game)).toBe(false);
    game.player1.supporterTurn = 0;
    game.state.turn = 1;
    expect(canPlay(game)).toBe(false);
  });

  it('retains the separate Base Set evolution Item', () => {
    const legacy = new BaseSetBreeder();
    expect(legacy.trainerType).toBe(TrainerType.ITEM);
    expect(legacy.text).toContain('Stage 2');
  });
});
