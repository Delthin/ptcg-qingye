import { AttachEnergyPrompt } from '../../game/store/prompts/attach-energy-prompt';
import { PlayerType, SlotType, PlayCardAction } from '../../game/store/actions/play-card-action';
import { CardManager } from '../../game/cards/card-manager';
import { padDeck, setupGame } from './test-helpers';
import { useAbility, useAttack } from './card-test-helpers';
import { Electrode } from '../05-heartgold-and-soulsilver/set-triumphant/electrode';
import { Entei } from '../07-x-and-y/set-ancient-origins/entei';
import { Torkoal } from '../08-sun-and-moon/set-celestial-storm/torkoal';
import { Sharpedo } from '../08-sun-and-moon/set-unbroken-bonds/sharpedo';
import { Cryogonal } from '../09-sword-and-shield/set-evolving-skies/cryogonal';
import { Laprasex } from '../10-scarlet-and-violet/set-stellar-crown/lapras-ex';

const active = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
const bench = { ...active, slot: SlotType.BENCH };
function accepts(prompt: AttachEnergyPrompt, raw: any, state: any) {
  try { return prompt.validate(prompt.decode(raw, state), state); } catch (_) { return false; }
}
describe('Energy-family revealed subsets and temporary remainder conservation', () => {
  beforeAll(() => {
    const manager = CardManager.getInstance();
    for (const card of [new Electrode(), new Entei(), new Torkoal(), new Sharpedo(), new Cryogonal(), new Laprasex()]) {
      if (!manager.isCardDefined(card.fullName)) manager.defineCard(card);
    }
  });
  [new Entei(), new Torkoal()].forEach(card => {
    it(`${card.fullName} attaches only the physical cards discarded by this attack, not older matching copies`, () => {
      const game = setupGame({ turn: 4,
        player1: { active: { card: card.fullName, energy: ['Water Energy SVE', 'Water Energy SVE'] },
          bench: [{ card: 'Ralts SIT' }], hand: ['Fire Energy SVE'], discard: ['Fire Energy SVE'],
          deck: ['Fire Energy SVE', 'Fire Energy SVE', 'Water Energy SVE', 'Water Energy SVE', ...padDeck(10)] },
        player2: { active: { card: 'Arceus V BRS' }, deck: padDeck(10) },
      });
      game.player1.bench[0].cannotAttachEnergyFromHandNextTurn = true;
      const handBefore = [...game.player1.hand.cards];
      const old = game.player1.discard.cards[0];
      const revealed = game.player1.deck.cards.slice(0, 2);
      game.overridePrompt('Attach energy', p => {
        const prompt = p as AttachEnergyPrompt;
        expect(prompt.cardList).toBe(game.player1.discard);
        expect(game.player1.hand.cards).toEqual(handBefore);
        expect(prompt.options.min).toBe(2); expect(prompt.options.max).toBe(2);
        const oldIndex = prompt.cardList.cards.indexOf(old);
        expect(oldIndex).toBeGreaterThanOrEqual(0);
        expect(accepts(prompt, [{ to: bench, index: oldIndex },
          { to: bench, index: prompt.cardList.cards.indexOf(revealed[0]) }], game.state)).toBe(false);
        return revealed.map(card => ({ to: bench, index: prompt.cardList.cards.indexOf(card) }));
      });
      useAttack(game.store, game.state, 0, card.attacks[0].name);
      expect(game.player1.discard.cards).toContain(old);
      expect(game.player1.hand.cards).toEqual(handBefore);
      revealed.forEach(energy => expect(game.player1.bench[0].cards).toContain(energy));
    });
  });
  [new Cryogonal(), new Laprasex()].forEach(card => [null, [], [0]].forEach(answer => {
    it(`${card.fullName} conserves every revealed card for ${JSON.stringify(answer)} and shuffles once`, () => {
      const deck = ['Water Energy SVE', 'Water Energy SVE', ...padDeck(23, 'Ralts SIT')];
      const game = setupGame({ turn: 4,
        player1: { active: { card: card.fullName, energy: ['Water Energy SVE', 'Psychic Energy SVE', 'Metal Energy SVE'] },
          bench: [{ card: 'Ralts SIT' }], deck },
        player2: { active: { card: 'Arceus V BRS' }, deck: padDeck(10) },
      });
      const before = [...game.player1.deck.cards];
      let shuffles = 0;
      game.overridePrompt('Attach energy', () => answer === null ? null : answer.map(index => ({ to: bench, index })));
      game.overridePrompt('Shuffle deck', () => { shuffles++; return game.player1.deck.cards.map((_, i) => i); });
      useAttack(game.store, game.state, 0, card.attacks[card instanceof Laprasex ? 1 : 0].name);
      const combined = [...game.player1.deck.cards, ...game.player1.bench[0].energies.cards];
      expect(combined.length).toBe(before.length);
      before.forEach(card => expect(combined.filter(c => c === card).length).toBe(1));
      expect(game.player1.bench[0].energies.cards.length).toBe(answer?.length || 0);
      expect(shuffles).toBe(1);
    });
  }));
  [false, true].forEach(hasEnergy => {
    it(`Lapras returns the entire no-attachment remainder (energies=${hasEnergy})`, () => {
      const game = setupGame({ turn: 4,
        player1: { active: { card: 'Lapras ex SCR', energy: ['Water Energy SVE', 'Psychic Energy SVE', 'Metal Energy SVE'] },
          deck: padDeck(25, hasEnergy ? 'Water Energy SVE' : 'Ralts SIT') },
        player2: { active: { card: 'Arceus V BRS' }, deck: padDeck(10) },
      });
      const before = [...game.player1.deck.cards];
      game.overridePrompt('Attach energy', () => []);
      useAttack(game.store, game.state, 0, 'Larimar Rain');
      expect(game.player1.deck.cards.length).toBe(before.length);
      before.forEach(card => expect(game.player1.deck.cards.filter(c => c === card).length).toBe(1));
    });
  });
  [null, [], [0]].forEach(answer => {
    it(`Electrode TM discards all unassigned revealed cards for ${JSON.stringify(answer)}`, () => {
      const game = setupGame({ turn: 4,
        player1: { active: { card: 'Electrode TM' }, bench: [{ card: 'Ralts SIT' }],
          deck: ['Water Energy SVE', 'Water Energy SVE', ...padDeck(12, 'Ralts SIT')] },
        player2: { active: { card: 'Arceus V BRS' }, deck: padDeck(10) },
      });
      const top = game.player1.deck.cards.slice(0, 7);
      game.overridePrompt('Attach energy', () => answer === null ? null : answer.map(index => ({ to: bench, index })));
      useAbility(game.store, game.state, 0, 'Energymite');
      const attached = answer?.length ? [top[0]] : [];
      top.forEach(card => {
        expect(game.player1.deck.cards).not.toContain(card);
        if (attached.includes(card)) expect([game.player1.active, ...game.player1.bench].some(slot => slot.cards.includes(card))).toBe(true);
        else expect(game.player1.discard.cards).toContain(card);
      });
    });
  });
  [0, 1].forEach(count => {
    it(`Sharpedo offers an actual ${count}-card revealed subset to itself on the Bench`, () => {
      const game = setupGame({ turn: 4,
        player1: { active: { card: 'Ralts SIT' }, bench: [{ card: 'Carvanha UNB' }], hand: ['Sharpedo UNB'],
          deck: ['Darkness Energy SVE', 'Darkness Energy SVE', ...padDeck(12, 'Ralts SIT')] },
        player2: { active: { card: 'Arceus V BRS' }, deck: padDeck(10) },
      });
      const before = [...game.player1.deck.cards];
      let answered = 0;
      game.overridePrompt('Attach energy', p => {
        const prompt = p as AttachEnergyPrompt;
        expect(accepts(prompt, [{ to: active, index: 0 }], game.state)).toBe(false);
        answered++;
        return Array.from({ length: count }, (_, index) => ({ to: bench, index }));
      });
      game.store.dispatch(new PlayCardAction(game.player1.id, 0, bench));
      expect(answered).toBe(1);
      expect(game.player1.bench[0].energies.cards.length).toBe(count);
      const combined = [...game.player1.deck.cards, ...game.player1.bench[0].energies.cards];
      expect(combined.length).toBe(before.length);
      before.forEach(card => expect(combined.filter(c => c === card).length).toBe(1));
    });
  });
});
