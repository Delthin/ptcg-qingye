import { AttachEnergyPrompt } from '../../game/store/prompts/attach-energy-prompt';
import { PlayerType, SlotType } from '../../game/store/actions/play-card-action';
import { CardManager } from '../../game/cards/card-manager';
import { padDeck, setupGame } from './test-helpers';
import { useAbility, useAttack } from './card-test-helpers';
import { Swampertex } from '../03-ex-ruby-and-sapphire/set-ex-crystal-guardians/swampert-ex';
import { Vikavolt } from '../08-sun-and-moon/set-sun-and-moon/vikavolt';
import { Volcanion } from '../08-sun-and-moon/set-unbroken-bonds/volcanion';
import { ArceusDialgaPalkiaGX } from '../08-sun-and-moon/set-cosmic-eclipse/arceus-dialga-palkia-gx';
import { ArceusV } from '../09-sword-and-shield/set-brilliant-stars/arceus-v';
import { ArceusVSTAR } from '../09-sword-and-shield/set-brilliant-stars/arceus-vstar';
import { Blastoise } from '../09-sword-and-shield/set-pokemon-go/blastoise';
import { Whimsicottex } from '../10-scarlet-and-violet/set-black-bolt-white-flare/whimsicott-ex';

const active = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
const cases = [
  { card: new Vikavolt(), ability: true, cost: ['Lightning Energy SVE'], deck: ['Grass Energy SVE', 'Lightning Energy SVE'], count: 2 },
  { card: new Volcanion(), ability: false, cost: ['Fire Energy SVE'], deck: Array(3).fill('Fire Energy SVE'), count: 3 },
  { card: new ArceusDialgaPalkiaGX(), ability: false, cost: ['Water Energy SVE', 'Metal Energy SVE', 'Metal Energy SVE'], deck: Array(3).fill('Water Energy SVE'), count: 3 },
  { card: new ArceusV(), ability: false, cost: ['Water Energy SVE', 'Water Energy SVE'], deck: Array(3).fill('Water Energy SVE'), count: 3 },
  { card: new ArceusVSTAR(), ability: false, cost: Array(3).fill('Water Energy SVE'), deck: Array(3).fill('Water Energy SVE'), count: 3 },
  { card: new Blastoise(), ability: true, cost: ['Water Energy SVE'], deck: Array(3).fill('Water Energy SVE'), count: 3 },
  { card: new Whimsicottex(), ability: false, cost: ['Grass Energy SVE'], deck: Array(3).fill('Water Energy SVE'), count: 3 },
];
describe('Energy-family atomic generator continuation', () => {
  beforeAll(() => {
    const manager = CardManager.getInstance();
    for (const card of [...cases.map(c => c.card), new Swampertex()]) {
      if (!manager.isCardDefined(card.fullName)) manager.defineCard(card);
    }
  });
  cases.forEach(({ card, ability, cost, deck, count }) => [0, count].forEach(selectedCount => {
    it(`${card.fullName} advances once after the entire ${selectedCount}-card answer`, () => {
      const game = setupGame({ turn: 2,
        player1: { active: { card: card.fullName, energy: cost }, deck: [...deck, ...padDeck(15)] },
        player2: { active: { card: 'Ralts SIT' }, deck: padDeck(15) },
      });
      const selected = [...game.player1.deck.cards.slice(0, selectedCount)];
      let shuffles = 0;
      game.overridePrompt('Attach energy', () => selected.map((_, index) => ({ to: active, index })));
      game.overridePrompt('Shuffle deck', () => {
        shuffles++;
        selected.forEach(energy => {
          expect(game.player1.deck.cards).not.toContain(energy);
          expect(game.player1.active.cards).toContain(energy);
        });
        return game.player1.deck.cards.map((_, index) => index);
      });
      if (ability) useAbility(game.store, game.state, 0, card.powers[0].name);
      else useAttack(game.store, game.state, 0, card.attacks[0].name);
      expect(shuffles).toBe(1);
      if (card instanceof Blastoise) expect(game.state.activePlayer).toBe(1);
    });
  }));
  [1, 3].forEach(count => {
    it(`Swampert ex finishes all ${count} public-discard attachments before ending its turn`, () => {
      const game = setupGame({ turn: 2,
        player1: { active: { card: 'Swampert ex CG' }, discard: Array(count).fill('Water Energy SVE'), deck: padDeck(15) },
        player2: { active: { card: 'Ralts SIT' }, deck: padDeck(15) },
      });
      game.overridePrompt('Attach energy', p => {
        const prompt = p as AttachEnergyPrompt;
        expect(prompt.options.min).toBe(count);
        expect(prompt.options.max).toBe(count);
        return Array.from({ length: count }, (_, index) => ({ to: active, index }));
      });
      useAbility(game.store, game.state, 0, 'Energy Recycle');
      expect(game.player1.discard.cards.length).toBe(0);
      expect(game.player1.active.energies.cards.length).toBe(count);
      expect(game.state.activePlayer).toBe(1);
    });
  });
});
