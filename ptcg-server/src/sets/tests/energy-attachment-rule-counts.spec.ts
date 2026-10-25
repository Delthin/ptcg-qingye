import { AttachEnergyPrompt } from '../../game/store/prompts/attach-energy-prompt';
import { PlayerType, SlotType, PlayCardAction } from '../../game/store/actions/play-card-action';
import { CardManager } from '../../game/cards/card-manager';
import { EnergyCard } from '../../game/store/card/energy-card';
import { padDeck, setupGame } from './test-helpers';
import { useAbility, useAttack } from './card-test-helpers';
import { LurantisGX } from '../08-sun-and-moon/set-sun-and-moon/lurantis-gx';
import { Shuckle } from '../08-sun-and-moon/set-lost-thunder/shuckle';
import { Rotom } from '../08-sun-and-moon/set-cosmic-eclipse/rotom';
import { Archaludonex } from '../10-scarlet-and-violet/set-surging-sparks/archaludon-ex';
import { Magneton } from '../10-scarlet-and-violet/set-surging-sparks/magneton';
import { ElectrodeGX } from '../08-sun-and-moon/set-celestial-storm/electrode-gx';
import { Electrodeex } from '../03-ex-ruby-and-sapphire/set-ex-firered-leafgreen/electrode-ex';

const active = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
const bench = { ...active, slot: SlotType.BENCH };
const cards = [new LurantisGX(), new Shuckle(), new Rotom(), new Archaludonex(), new Magneton(), new ElectrodeGX(), new Electrodeex()];
function accepts(prompt: AttachEnergyPrompt, raw: any, state: any) {
  try { return prompt.validate(prompt.decode(raw, state), state); } catch (_) { return false; }
}
// Expectations follow official JP advanced guide v3.4 D-04/D-05 and card FAQs,
// not a universal min=0 rule. Evidence paths are in the followup checkpoint.
describe('Energy-family officially resolved public-zone counts and KO order', () => {
  beforeAll(() => {
    const manager = CardManager.getInstance();
    for (const card of cards) if (!manager.isCardDefined(card.fullName)) manager.defineCard(card);
  });
  [new LurantisGX(), new Shuckle(), new Rotom()].forEach(card => [0, 1, 2, 3].forEach(available => {
    it(`${card.fullName} fixed two uses exactly ${Math.min(2, available)} of ${available} eligible public cards`, () => {
      const game = setupGame({ turn: 4,
        player1: { active: { card: card.fullName, energy: ['Grass Energy SVE', 'Psychic Energy SVE'] },
          bench: [{ card: 'Ralts SIT' }], discard: [...Array(available).fill('Water Energy SVE'), 'Double Turbo Energy BRS'], deck: padDeck(10) },
        player2: { active: { card: 'Arceus V BRS' }, deck: padDeck(10) },
      });
      const count = Math.min(2, available);
      let answered = 0;
      game.overridePrompt('Attach energy', p => {
        const prompt = p as AttachEnergyPrompt;
        expect(prompt.options.min).toBe(count); expect(prompt.options.max).toBe(count);
        expect(accepts(prompt, [], game.state)).toBe(false);
        if (count === 2) expect(accepts(prompt, [{ to: bench, index: 0 }], game.state)).toBe(false);
        answered++;
        return Array.from({ length: count }, (_, index) => ({ to: bench, index }));
      });
      useAttack(game.store, game.state, 0, card.attacks[card instanceof Rotom ? 1 : 0].name);
      expect(answered).toBe(available > 0 ? 1 : 0);
      expect(game.player1.bench[0].energies.cards.length).toBe(count);
      expect(game.player2.active.damage).toBe(card instanceof LurantisGX ? 40 : 0);
    });
  }));
  it('Shuckle can attach to itself even without a Bench', () => {
    const game = setupGame({ turn: 4,
      player1: { active: { card: 'Shuckle LOT', energy: ['Grass Energy SVE'] }, discard: ['Water Energy SVE', 'Water Energy SVE'], deck: padDeck(10) },
      player2: { active: { card: 'Arceus V BRS' }, deck: padDeck(10) },
    });
    game.overridePrompt('Attach energy', () => [0, 1].map(index => ({ to: active, index })));
    useAttack(game.store, game.state, 0, 'Energy Drink');
    expect(game.player1.active.energies.cards.length).toBe(3);
  });
  it('Rotom with no Bench skips attachment and finishes the attack', () => {
    const game = setupGame({ turn: 4,
      player1: { active: { card: 'Rotom CEC', energy: ['Psychic Energy SVE'] }, discard: ['Water Energy SVE'], deck: padDeck(10) },
      player2: { active: { card: 'Arceus V BRS' }, deck: padDeck(10) },
    });
    useAttack(game.store, game.state, 0, 'Energy Assist');
    expect(game.player1.discard.cards.length).toBe(1);
    expect(game.state.activePlayer).toBe(1);
  });
  [0, 1, 2].forEach(available => {
    it(`Archaludon requires all ${available} eligible Metal cards after confirming the evolution Ability`, () => {
      const game = setupGame({ turn: 4,
        player1: { active: { card: 'Duraludon SCR' }, hand: ['Archaludon ex SSP'],
          discard: Array(available).fill('Metal Energy SVE'), deck: padDeck(10) },
        player2: { active: { card: 'Arceus V BRS' }, deck: padDeck(10) },
      });
      let answered = 0;
      game.overridePrompt('Attach energy', p => {
        const prompt = p as AttachEnergyPrompt;
        expect(prompt.options.min).toBe(available); expect(prompt.options.max).toBe(available);
        expect(accepts(prompt, [], game.state)).toBe(false);
        answered++;
        return Array.from({ length: available }, (_, index) => ({ to: active, index }));
      });
      game.store.dispatch(new PlayCardAction(game.player1.id, 0, active));
      expect(answered).toBe(available ? 1 : 0);
      expect(game.player1.active.energies.cards.length).toBe(available);
    });
  });
  it('Archaludon may decline the entire evolution Ability before allocation', () => {
    const game = setupGame({ turn: 4,
      player1: { active: { card: 'Duraludon SCR' }, hand: ['Archaludon ex SSP'], discard: ['Metal Energy SVE', 'Metal Energy SVE'], deck: padDeck(10) },
      player2: { active: { card: 'Arceus V BRS' }, deck: padDeck(10) },
    });
    game.overridePrompt('Confirm', () => false);
    game.store.dispatch(new PlayCardAction(game.player1.id, 0, active));
    expect(game.player1.discard.cards.length).toBe(2);
    expect(game.player1.active.energies.cards.length).toBe(0);
  });
  it('Magneton requires 1..3, may attach to itself, and then KOs itself', () => {
    const game = setupGame({ turn: 4,
      player1: { active: { card: 'Ralts SIT' }, bench: [{ card: 'Magneton SSP', energy: ['Lightning Energy SVE'] }],
        discard: Array(3).fill('Water Energy SVE'), deck: padDeck(10) },
      player2: { active: { card: 'Arceus V BRS' }, deck: padDeck(10) },
    });
    const target = game.player1.bench[0];
    const source = [...game.player1.discard.cards];
    const move = spyOn(game.player1.discard, 'moveCardTo').and.callThrough();
    game.overridePrompt('Attach energy', p => {
      const prompt = p as AttachEnergyPrompt;
      expect(prompt.options.min).toBe(1); expect(prompt.options.max).toBe(3);
      expect(accepts(prompt, [], game.state)).toBe(false);
      expect(accepts(prompt, [{ to: bench, index: 0 }], game.state)).toBe(true);
      return [{ to: bench, index: 0 }];
    });
    useAbility(game.store, game.state, 0, 'Overvolt Discharge');
    expect(move).toHaveBeenCalledWith(source[0], target);
    expect(game.player1.discard.cards.some(c => c.fullName === 'Magneton SSP')).toBe(true);
    expect(game.player2.getPrizeLeft()).toBe(5);
  });
  it('Magneton cannot use the Ability without basic Energy', () => {
    const game = setupGame({ turn: 4,
      player1: { active: { card: 'Magneton SSP' }, bench: [{ card: 'Ralts SIT' }], discard: ['Double Turbo Energy BRS'], deck: padDeck(10) },
      player2: { active: { card: 'Arceus V BRS' }, deck: padDeck(10) },
    });
    expect(() => useAbility(game.store, game.state, 0, 'Overvolt Discharge')).toThrow();
    expect(game.player1.active.damage).toBe(0);
  });
  [1, 5].forEach(available => {
    it(`Electrode-GX attaches all ${available} pre-KO discard cards, excluding its own attached Energy`, () => {
      const game = setupGame({ turn: 4,
        player1: { active: { card: 'Electrode-GX CES', energy: ['Lightning Energy SVE'] }, bench: [{ card: 'Ralts SIT' }],
          discard: Array(available).fill('Water Energy SVE'), deck: padDeck(10) },
        player2: { active: { card: 'Arceus V BRS' }, deck: padDeck(10) },
      });
      const original = game.player1.active.energies.cards[0];
      const selected = [...game.player1.discard.cards];
      game.overridePrompt('Attach energy', p => {
        const prompt = p as AttachEnergyPrompt;
        expect(prompt.cardList.cards).not.toContain(original);
        expect(prompt.options.min).toBe(available); expect(prompt.options.max).toBe(available);
        expect(accepts(prompt, [], game.state)).toBe(false);
        return Array.from({ length: available }, (_, index) => ({ to: bench, index }));
      });
      useAbility(game.store, game.state, 0, 'Extra Energy Bomb');
      selected.forEach(card => expect([game.player1.active, ...game.player1.bench].some(slot => slot.cards.includes(card))).toBe(true));
      expect(game.player1.discard.cards).toContain(original);
      expect(game.player2.getPrizeLeft()).toBe(4);
    });
  });
  it('Electrode-GX cannot initiate without a non-GX/non-EX recipient', () => {
    const game = setupGame({ turn: 4,
      player1: { active: { card: 'Electrode-GX CES' }, discard: Array(5).fill('Water Energy SVE'), deck: padDeck(10) },
      player2: { active: { card: 'Arceus V BRS' }, deck: padDeck(10) },
    });
    expect(() => useAbility(game.store, game.state, 0, 'Extra Energy Bomb')).toThrow();
    expect(game.player1.active.damage).toBe(0);
    expect(game.player1.discard.cards.length).toBe(5);
  });
  [0, 4].forEach(discardCount => {
    it(`old Electrode ex KOs first and includes its original attached Energy in ${1 + discardCount} cards`, () => {
      const game = setupGame({ turn: 4,
        player1: { active: { card: 'Ralts SIT' }, bench: [{ card: 'Electrode ex RG', energy: ['Lightning Energy SVE'] }],
          discard: Array(discardCount).fill('Water Energy SVE'), deck: padDeck(10) },
        player2: { active: { card: 'Arceus V BRS' }, deck: padDeck(10) },
      });
      const original = game.player1.bench[0].energies.cards[0];
      const electrode = game.player1.bench[0].getPokemonCard()!;
      let answered = 0;
      game.overridePrompt('Attach energy', p => {
        const prompt = p as AttachEnergyPrompt;
        expect(game.player1.discard.cards).toContain(electrode);
        expect(prompt.cardList.cards).toContain(original);
        expect(game.player2.getPrizeLeft()).toBe(4);
        const count = 1 + discardCount;
        expect(prompt.options.min).toBe(count); expect(prompt.options.max).toBe(count);
        answered++;
        return prompt.cardList.cards.map((card, index) => ({ card, index }))
          .filter(({ card }) => card instanceof EnergyCard).map(({ index }) => ({ to: active, index }));
      });
      useAbility(game.store, game.state, 0, 'Extra Energy Bomb');
      expect(answered).toBe(1);
      expect(game.player1.active.energies.cards.length).toBe(1 + discardCount);
      expect(game.player1.active.cards).toContain(original);
    });
  });
  it('old Electrode ex finishes Active replacement before rebuilding attachment targets', () => {
    const game = setupGame({ turn: 4,
      player1: { active: { card: 'Electrode ex RG', energy: ['Lightning Energy SVE'] }, bench: [{ card: 'Ralts SIT' }],
        discard: ['Water Energy SVE'], deck: padDeck(10) },
      player2: { active: { card: 'Arceus V BRS' }, deck: padDeck(10) },
    });
    let answered = 0;
    game.overridePrompt('Attach energy', p => {
      const prompt = p as AttachEnergyPrompt;
      expect(game.player1.active.getPokemonCard()!.fullName).toBe('Ralts SIT');
      expect(game.player2.getPrizeLeft()).toBe(4);
      expect(prompt.options.min).toBe(2); expect(prompt.options.max).toBe(2);
      answered++;
      return prompt.cardList.cards.map((card, index) => ({ card, index }))
        .filter(({ card }) => card instanceof EnergyCard).map(({ index }) => ({ to: active, index }));
    });
    useAbility(game.store, game.state, 0, 'Extra Energy Bomb');
    expect(answered).toBe(1);
    expect(game.player1.active.energies.cards.length).toBe(2);
  });
  it('old Electrode ex retains conservative rejection when both discard and itself have no Energy', () => {
    const game = setupGame({ turn: 4,
      player1: { active: { card: 'Electrode ex RG' }, bench: [{ card: 'Ralts SIT' }], deck: padDeck(10) },
      player2: { active: { card: 'Arceus V BRS' }, deck: padDeck(10) },
    });
    expect(() => useAbility(game.store, game.state, 0, 'Extra Energy Bomb')).toThrow();
    expect(game.player1.active.damage).toBe(0);
  });
});
