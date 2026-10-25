import { AttackEffect } from '../../game/store/effects/game-effects';
import { AttachEnergyEffect } from '../../game/store/effects/play-card-effects';
import { ResolvePromptAction } from '../../game/store/actions/resolve-prompt-action';
import { PlayCardAction, PlayerType, SlotType } from '../../game/store/actions/play-card-action';
import { AttachEnergyPrompt } from '../../game/store/prompts/attach-energy-prompt';
import { ChooseCardsPrompt } from '../../game/store/prompts/choose-cards-prompt';
import { ShuffleDeckPrompt } from '../../game/store/prompts/shuffle-prompt';
import { WaitPrompt } from '../../game/store/prompts/wait-prompt';
import { Store } from '../../game/store/store';
import { setupGame, padDeck, SetupGameResult } from './test-helpers';

function manualStore(game: SetupGameResult): Store {
  const store = new Store({ onStateChange() {} });
  store.state = game.state;
  return store;
}

function answerNext(game: SetupGameResult, store: Store, raw: any): void {
  const prompt = game.state.prompts.find(p => p.result === undefined)!;
  expect(prompt).toBeDefined();
  const decoded = prompt.decode(raw, game.state);
  expect(prompt.validate(decoded, game.state)).toBe(true);
  store.dispatch(new ResolvePromptAction(prompt.id, decoded));
}

describe('Cresselia Crescent Glow targets', () => {
  function prepare(turn: number) {
    const game = setupGame({ turn,
      player1: { active: { card: 'Cresselia CRE', energy: ['Psychic Energy SVE'] },
        bench: [{ card: 'Ralts SIT' }],
        deck: ['Psychic Energy SVE', 'Psychic Energy SVE', 'Psychic Energy SVE', 'Psychic Energy SVE', ...padDeck(6)] },
      player2: { active: { card: 'Ralts SIT' }, deck: padDeck(10) },
    });
    const store = manualStore(game);
    const card = game.player1.active.getPokemonCard()!;
    card.reduceEffect(store, game.state, new AttackEffect(game.player1, game.player2, card.attacks[0]));
    const prompt = game.state.prompts.find(p => p.result === undefined) as AttachEnergyPrompt;
    expect(prompt instanceof AttachEnergyPrompt).toBe(true);
    return { game, store, prompt };
  }

  it('rejects splitting Psychic Energy between the Active and Bench before moving any cards', () => {
    const { game, store, prompt } = prepare(2);
    const beforeDeck = game.player1.deck.cards.slice();
    const beforeActive = game.player1.active.cards.slice();
    const result = prompt.decode([
      { index: 0, to: { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 } },
      { index: 1, to: { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 } },
    ], game.state);
    expect(prompt.validate(result, game.state)).toBe(false);
    expect(() => store.dispatch(new ResolvePromptAction(prompt.id, result))).toThrow();
    expect(game.player1.deck.cards).toEqual(beforeDeck);
    expect(game.player1.active.cards).toEqual(beforeActive);
    expect(game.player1.bench[0].cards.length).toBe(1);
  });

  it('still attaches three different physical Energy cards to one Benched Pokemon when going second', () => {
    const { game, store } = prepare(2);
    const energies = game.player1.deck.cards.slice(0, 3);
    answerNext(game, store, energies.map((_, index) => ({
      index, to: { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 },
    })));
    expect(game.player1.bench[0].energies.cards).toEqual(energies);
    expect(game.player1.deck.cards.some(card => energies.includes(card))).toBe(false);
    expect(game.state.prompts.find(p => p.result === undefined) instanceof ShuffleDeckPrompt).toBe(true);
  });

  for (const turn of [1, 3, 4]) {
    it(`does not allow two Energy on turn ${turn}`, () => {
      const { game, prompt } = prepare(turn);
      const result = prompt.decode([0, 1].map(index => ({
        index, to: { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 },
      })), game.state);
      expect(prompt.validate(result, game.state)).toBe(false);
    });
  }
});

// Exercise the two legacy callers against Store's strict, pre-move attachment
// contract, including the parent effect's cleanup after a prevented attachment.
describe('Legacy energy-source callers under strict attachment validation', () => {
  [false, true].forEach(prevent => {
    it(`Cresselia attaches from its deck and reaches shuffle with preventDefault=${prevent}`, () => {
      const game = setupGame({ turn: 2,
        player1: { active: { card: 'Cresselia CRE', energy: ['Psychic Energy SVE'] },
          hand: ['Water Energy SVE'],
          deck: ['Psychic Energy SVE', 'Psychic Energy SVE', ...padDeck(8)] },
        player2: { active: { card: 'Ralts SIT' }, deck: padDeck(10) },
      });
      const store = manualStore(game);
      const selected = game.player1.deck.cards.slice(0, 2);
      const handBefore = game.player1.hand.cards.slice();
      const energyBefore = game.player1.active.energies.cards.slice();
      let observed = 0;
      game.player2.active.getPokemonCard()!.reduceEffect = (_store, state, effect) => {
        if (effect instanceof AttachEnergyEffect) {
          observed++;
          expect(effect.source).toBe(game.player1.deck);
          expect(effect.source.cards).toContain(effect.energyCard);
          expect(effect.target.cards).not.toContain(effect.energyCard);
          expect(effect.isManual).toBe(false);
          effect.preventDefault = prevent;
        }
        return state;
      };
      const card = game.player1.active.getPokemonCard()!;
      card.reduceEffect(store, game.state, new AttackEffect(game.player1, game.player2, card.attacks[0]));
      expect(game.state.prompts.find(p => p.result === undefined) instanceof AttachEnergyPrompt).toBe(true);
      answerNext(game, store, selected.map((_, index) => ({
        index, to: { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 },
      })));
      expect(observed).toBe(2);
      expect(game.player1.hand.cards).toEqual(handBefore);
      expect(game.player1.active.energies.cards).toEqual(prevent ? energyBefore : [...energyBefore, ...selected]);
      selected.forEach(energy => {
        expect(game.player1.deck.cards.includes(energy)).toBe(prevent);
        expect(game.player1.active.cards.includes(energy)).toBe(!prevent);
      });
      expect(game.state.prompts.find(p => p.result === undefined) instanceof ShuffleDeckPrompt).toBe(true);
      answerNext(game, store, game.player1.deck.cards.map((_, index) => index));
      const wait = game.state.prompts.find(p => p.result === undefined) as WaitPrompt;
      expect(wait instanceof WaitPrompt).toBe(true);
      expect(wait.message).toBe('Deck shuffle animation');
      answerNext(game, store, true);
      expect(store.hasPrompts()).toBe(false);
    });

    it(`Mega Rayquaza returns all unattached revealed cards with preventDefault=${prevent}`, () => {
      const game = setupGame({ turn: 4,
        player1: { active: { card: 'Ralts SIT' }, hand: ['Mega Rayquaza ex M6', 'Water Energy SVE'],
          deck: ['Metal Energy SVE', 'Ralts SIT', 'Ralts SIT', 'Ralts SIT', ...padDeck(8)] },
        player2: { active: { card: 'Ralts SIT' }, deck: padDeck(10) },
      });
      const store = manualStore(game);
      const before = game.player1.deck.cards.slice();
      const energy = before[0];
      const handEnergy = game.player1.hand.cards[1];
      let observed = 0;
      game.player2.active.getPokemonCard()!.reduceEffect = (_store, state, effect) => {
        if (effect instanceof AttachEnergyEffect) {
          observed++;
          expect(effect.source).not.toBe(game.player1.hand);
          expect(effect.source.cards).toContain(energy);
          expect(effect.target.cards).not.toContain(energy);
          expect(effect.isManual).toBe(false);
          effect.preventDefault = prevent;
        }
        return state;
      };
      store.dispatch(new PlayCardAction(game.player1.id, 0,
        { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 }));
      answerNext(game, store, true); // use Champion's Roar
      answerNext(game, store, true); // reveal the top four
      expect(game.state.prompts.find(p => p.result === undefined) instanceof ChooseCardsPrompt).toBe(true);
      answerNext(game, store, [0]);
      expect(observed).toBe(1);
      expect(game.player1.hand.cards).toEqual([handEnergy]);
      const target = game.player1.bench[0];
      expect(target.energies.cards).toEqual(prevent ? [] : [energy]);
      expect(target.cards.includes(energy)).toBe(!prevent);
      const remainder = prevent ? before : before.slice(1);
      expect(game.player1.deck.cards.length).toBe(remainder.length);
      expect(game.player1.deck.cards).toEqual(jasmine.arrayContaining(remainder));
      expect(game.player1.deck.cards.includes(energy)).toBe(prevent);
      expect(store.hasPrompts()).toBe(false);
    });
  });
});
