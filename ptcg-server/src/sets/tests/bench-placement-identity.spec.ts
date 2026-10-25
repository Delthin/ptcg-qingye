import { CardManager } from '../../game/cards/card-manager';
import { StateSerializer } from '../../game/serializer/state-serializer';
import { Card } from '../../game/store/card/card';
import { CardList } from '../../game/store/state/card-list';
import { ChooseCardsPrompt, ChooseCardsPromptType } from '../../game/store/prompts/choose-cards-prompt';
import { ResolvePromptAction } from '../../game/store/actions/resolve-prompt-action';
import { ShuffleDeckPrompt } from '../../game/store/prompts/shuffle-prompt';
import { WaitPrompt } from '../../game/store/prompts/wait-prompt';
import { Store } from '../../game/store/store';
import { setupGame, padDeck, getCardByName } from './test-helpers';
import { playTrainerCard } from './card-test-helpers';
import { Gimmighoul as GimmighoulM1L } from '../11-mega-evolution/set-mega-evolution/gimmighoul';

// Production assigns one index per physical copy, including same-name copies.
function indexCards(state: ReturnType<typeof setupGame>['state']): void {
  const indexed = new Set<Card>();
  const lists: CardList[] = [];
  state.players.forEach(player => lists.push(player.active, ...player.bench,
    player.deck, player.hand, player.discard, player.supporter, player.stadium,
    player.lostzone, ...player.prizes));
  state.cardNames = [];
  lists.forEach(list => list.cards.forEach(card => {
    if (!indexed.has(card)) {
      indexed.add(card);
      card.id = state.cardNames.length;
      state.cardNames.push(card.fullName);
    }
  }));
}

describe('Bench placement keeps same-name physical copies distinct', () => {
  beforeAll(() => {
    // This set has multiple set codes; the helper cannot infer M1L from its index.
    const manager = CardManager.getInstance();
    if (!manager.isCardDefined('Gimmighoul M1L')) {
      manager.defineCard(new GimmighoulM1L());
    }
  });
  const pairs = [
    ['Ralts SIT', 'Ralts SIT'],
    ...['Gimmighoul PAR', 'Gimmighoul2 PAR', 'Gimmighoul PAF',
      'Gimmighoul SSP', 'Gimmighoul M1L', 'Gimmighoul 30C'].map(name => [name, name]),
    ['Gimmighoul PAR', 'Gimmighoul2 PAR'],
    ['Gimmighoul2 PAR', 'Gimmighoul PAR'],
  ];
  const cases = ['Nest Ball SVI', 'Buddy-Buddy Poffin TEF'].flatMap(trainer =>
    pairs.map(([existingName, incomingName]) => ({ trainer, existingName, incomingName })));
  for (const { trainer, existingName, incomingName } of cases) {
    it(`${trainer}: ${existingName} then ${incomingName} keeps independent Bench slots and snapshots`, () => {
      const game = setupGame({ turn: 3,
        player1: { active: { card: existingName.startsWith('Gimmighoul') ? 'Gholdengo ex PAR' : 'Manaphy BRS' },
          bench: [{ card: existingName, energy: ['Psychic Energy SVE'], damage: 20 }],
          hand: [trainer], deck: [incomingName, ...padDeck(9)] },
        player2: { active: { card: 'Manaphy BRS' }, deck: padDeck(10) },
      });
      // Model the real Gholdengo deck, including another Gimmighoul below the evolution.
      if (existingName.startsWith('Gimmighoul')) {
        game.player1.active.cards.unshift(getCardByName(existingName));
      }
      indexCards(game.state);
      const oldSlot = game.player1.bench[0];
      const oldCards = oldSlot.cards.slice();
      const incoming = game.player1.deck.cards[0];
      expect(incoming.name).toBe(oldCards[0].name);
      expect(incoming.fullName).toBe(incomingName);
      expect(incoming).not.toBe(oldCards[0]);
      expect(incoming.id).not.toBe(oldCards[0].id);
      const serializer = new StateSerializer();
      StateSerializer.setKnownCards(CardManager.getInstance().getAllCards());
      const before = serializer.serialize(game.state);
      game.overridePrompt(ChooseCardsPromptType, () => [0]);
      playTrainerCard(game.store, game.state, 0, trainer);

      const check = (state: typeof game.state) => {
        const player = state.players[0];
        expect(player.bench[0].cards.map(card => card.id)).toEqual(oldCards.map(card => card.id));
        expect(player.bench[0].damage).toBe(20);
        expect(player.bench[1].getPokemonCard()!.id).toBe(incoming.id);
        expect(player.bench[1].cards.length).toBe(1);
        expect(player.bench[2].cards.length).toBe(0);
        expect(player.deck.cards.some(card => card.id === incoming.id)).toBe(false);
      };
      check(game.state);
      const after = serializer.serialize(game.state);
      check(serializer.deserialize(after));
      check(serializer.deserializeDiff(before, serializer.serializeDiffFromSerialized(before, after)));
      expect(game.player1.bench[0]).toBe(oldSlot);
      expect(oldSlot.cards).toEqual(oldCards);
    });
  }

  for (const name of ['Gimmighoul PAR', 'Gimmighoul2 PAR']) {
    it(`${name}: resolves Nest Ball through separate dispatches with an otherwise identical existing copy`, () => {
      const game = setupGame({ turn: 3,
        player1: { active: { card: 'Gholdengo ex PAR' }, bench: [{ card: name }],
          hand: ['Nest Ball SVI'], deck: [name, ...padDeck(9)] },
        player2: { active: { card: 'Manaphy BRS' }, deck: padDeck(10) },
      });
      game.player1.active.cards.unshift(getCardByName(name));
      indexCards(game.state);
      const original = game.player1.bench[0].getPokemonCard()!;
      const incoming = game.player1.deck.cards[0];
      const store = new Store({ onStateChange() {} });
      store.state = game.state;
      playTrainerCard(store, game.state, 0, 'Nest Ball SVI');

      // Unlike the automatic test handler, the network client answers later.
      const choose = game.state.prompts.find(prompt => prompt.result === undefined) as ChooseCardsPrompt;
      expect(choose instanceof ChooseCardsPrompt).toBe(true);
      expect(game.player1.bench[1].cards.length).toBe(0);
      const selected = choose.decode([choose.cards.cards.indexOf(incoming)]);
      expect(choose.validate(selected)).toBe(true);
      store.dispatch(new ResolvePromptAction(choose.id, selected));
      expect(game.player1.bench[0].cards).toEqual([original]);
      expect(game.player1.bench[1].cards).toEqual([incoming]);
      expect(game.player1.bench[0].damage).toBe(0);
      expect(game.player1.bench[1].damage).toBe(0);
      expect(original.id).not.toBe(incoming.id);

      const shuffle = game.state.prompts.find(prompt => prompt.result === undefined) as ShuffleDeckPrompt;
      expect(shuffle instanceof ShuffleDeckPrompt).toBe(true);
      const order = shuffle.decode(game.player1.deck.cards.map((_, index) => index), game.state);
      expect(shuffle.validate(order, game.state)).toBe(true);
      store.dispatch(new ResolvePromptAction(shuffle.id, order));
      const wait = game.state.prompts.find(prompt => prompt.result === undefined) as WaitPrompt;
      expect(wait instanceof WaitPrompt).toBe(true);
      expect(wait.message).toBe('Deck shuffle animation');
      store.dispatch(new ResolvePromptAction(wait.id, true));
      expect(store.hasPrompts()).toBe(false);
      expect(game.player1.bench[0].cards).toEqual([original]);
      expect(game.player1.bench[1].cards).toEqual([incoming]);
    });
  }
});
