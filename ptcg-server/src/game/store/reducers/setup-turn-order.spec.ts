import { GameMessage } from '../../game-message';
import { ResolvePromptAction } from '../actions/resolve-prompt-action';
import { Format } from '../card/card-types';
import { PokemonCard } from '../card/pokemon-card';
import { ChooseStartingPokemonPrompt } from '../prompts/choose-starting-pokemon-prompt';
import { CoinFlipPrompt } from '../prompts/coin-flip-prompt';
import { ConfirmPrompt } from '../prompts/confirm-prompt';
import { Prompt } from '../prompts/prompt';
import { ShuffleDeckPrompt } from '../prompts/shuffle-prompt';
import { Player } from '../state/player';
import { GamePhase } from '../state/state';
import { Store } from '../store';
import { setupGame } from './setup-reducer';

class OpeningBasic extends PokemonCard {
  set = 'TEST'; name = 'Opening Basic'; fullName = 'Opening Basic TEST'; hp = 100;
}

function resolve<T>(store: Store, prompt: Prompt<T>, raw: T): void {
  const decoded = prompt.decode(raw, store.state);
  if (!prompt.validate(decoded, store.state)) throw new Error('Invalid prompt answer');
  store.dispatch(new ResolvePromptAction(prompt.id, decoded));
}

function harness(): Store {
  const store = new Store({ onStateChange: () => undefined });
  store.state.phase = GamePhase.SETUP;
  store.state.gameSettings.format = Format.STANDARD;
  store.state.players = [11, 29].map(id => {
    const player = new Player(); player.id = id; player.name = `Player ${id}`;
    player.deck.cards = Array.from({ length: 60 }, (_, index) => {
      const card = new OpeningBasic(); card.id = id * 100 + index; return card;
    });
    return player;
  });
  const generator = setupGame(() => generator.next(), store, store.state);
  generator.next();
  return store;
}

function pending(store: Store): Prompt<unknown>[] {
  return store.state.prompts.filter(prompt => prompt.result === undefined);
}

// Explicit outcomes guard the rule independently of the reducer's conditional expressions.
const outcomes = [
  { coin: 'heads', heads: true, choice: true, winnerId: 11, activePlayer: 0 },
  { coin: 'heads', heads: true, choice: false, winnerId: 11, activePlayer: 1 },
  { coin: 'tails', heads: false, choice: true, winnerId: 29, activePlayer: 1 },
  { coin: 'tails', heads: false, choice: false, winnerId: 29, activePlayer: 0 },
];

describe('Opening coin flip and turn-order choice', () => {
  for (const outcome of outcomes) {
    it(`${outcome.coin}: winner ${outcome.winnerId} chooses ${outcome.choice ? 'first' : 'second'}, then both shuffle`, () => {
      const store = harness();
      const coinPrompts = pending(store);
      expect(coinPrompts.length).toBe(1);
      const coin = coinPrompts[0] as CoinFlipPrompt;
      expect(coin instanceof CoinFlipPrompt).toBe(true);
      expect(coin.playerId).toBe(11);
      expect(coin.message).toBe(GameMessage.SETUP_WHO_BEGINS_FLIP);
      resolve(store, coin, outcome.heads);

      const choices = pending(store);
      expect(choices.length).toBe(1);
      const goFirst = choices[0] as ConfirmPrompt;
      expect(goFirst instanceof ConfirmPrompt).toBe(true);
      expect(goFirst.message).toBe(GameMessage.GO_FIRST);
      expect(goFirst.playerId).toBe(outcome.winnerId);
      expect(goFirst.result).toBeUndefined();
      expect(store.state.players.map(player => player.hand.cards.length)).toEqual([0, 0]);
      resolve(store, goFirst, outcome.choice);

      expect(store.state.activePlayer).toBe(outcome.activePlayer);
      expect(store.state.players[store.state.activePlayer].id).toBe(outcome.activePlayer === 0 ? 11 : 29);
      expect(goFirst.result).toBe(outcome.choice);
      const shuffles = pending(store) as ShuffleDeckPrompt[];
      expect(shuffles.length).toBe(2);
      expect(shuffles.every(prompt => prompt instanceof ShuffleDeckPrompt)).toBe(true);
      expect(shuffles.map(prompt => prompt.playerId)).toEqual([11, 29]);
      expect(store.state.phase).toBe(GamePhase.SETUP);

      // Continue through the real Store callbacks, not only the presence of shuffle prompts.
      const identityOrder = Array.from({ length: 60 }, (_, index) => index);
      resolve(store, shuffles[0], identityOrder);
      expect(store.state.players.map(player => player.hand.cards.length)).toEqual([0, 0]);
      expect(pending(store).map(prompt => prompt.playerId)).toEqual([29]);
      resolve(store, shuffles[1], identityOrder);
      expect(store.state.players.map(player => player.hand.cards.length)).toEqual([7, 7]);
      expect(store.state.players.map(player => player.deck.cards.length)).toEqual([53, 53]);
      expect(store.state.activePlayer).toBe(outcome.activePlayer);
      const starting = pending(store);
      expect(starting.length).toBe(2);
      expect(starting.every(prompt => prompt instanceof ChooseStartingPokemonPrompt)).toBe(true);
      expect(starting.map(prompt => prompt.playerId)).toEqual([11, 29]);
    });
  }
});
