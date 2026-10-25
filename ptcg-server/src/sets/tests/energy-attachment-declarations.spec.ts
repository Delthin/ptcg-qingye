import { AttachEnergyPrompt } from '../../game/store/prompts/attach-energy-prompt';
import { ChooseCardsPrompt } from '../../game/store/prompts/choose-cards-prompt';
import { PlayerType, SlotType } from '../../game/store/actions/play-card-action';
import { CardManager } from '../../game/cards/card-manager';
import { padDeck, setupGame } from './test-helpers';
import { useAttack } from './card-test-helpers';
import { Skeledirge } from '../10-scarlet-and-violet/set-scarlet-and-violet/skeledirge-svi';
import { Zebstrika } from '../10-scarlet-and-violet/set-paradox-rift/zebstrika-par';
import { Lycanroc } from '../10-scarlet-and-violet/set-temporal-forces/lycanroc-tef';
import { Pachirisu } from '../10-scarlet-and-violet/set-black-bolt-white-flare/pachirisu-svp';
import { Grumpig } from '../10-scarlet-and-violet/set-obsidian-flames/grumpig-obf';
import { Houndoom } from '../10-scarlet-and-violet/set-prismatic-evolution/houndoom-pre';
import { Dondozo } from '../10-scarlet-and-violet/set-paradox-rift/dondozo-par';
import { Boltund } from '../10-scarlet-and-violet/set-temporal-forces/boltund-tef';
import { ArceusVSTAR } from '../11-mega-evolution/set-30th-celebration/arceus-vstar-30c';
import { Smeargle } from '../09-sword-and-shield/set-silver-tempest/smeargle';
import { Beautifly } from '../06-black-and-white/set-dragons-exalted/beautifly';
import { Terapagos } from '../10-scarlet-and-violet/set-surging-sparks/terapagos';
import { Laprasex } from '../10-scarlet-and-violet/set-stellar-crown/lapras-ex';
import { Delibird } from '../11-mega-evolution/set-chaos-rising/delibird';

const active = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
const bench = { ...active, slot: SlotType.BENCH };
const otherBench = { ...bench, index: 1 };
function accepts(prompt: AttachEnergyPrompt, raw: any, state: any): boolean {
  try { return prompt.validate(prompt.decode(raw, state), state); } catch (_) { return false; }
}
const cases = [
  { card: new Skeledirge(), source: 'discard', energy: 'Water Energy SVE', cost: 'Fire Energy SVE', targets: [bench, otherBench] },
  { card: new Zebstrika(), source: 'discard', energy: 'Lightning Energy SVE', cost: 'Lightning Energy SVE', targets: [bench, otherBench] },
  { card: new Lycanroc(), source: 'discard', energy: 'Fighting Energy SVE', cost: 'Water Energy SVE', targets: [bench, otherBench] },
  { card: new Pachirisu(), source: 'discard', energy: 'Lightning Energy SVE', cost: 'Water Energy SVE', targets: [bench, otherBench] },
  { card: new Grumpig(), source: 'deck', energy: 'Water Energy SVE', cost: 'Psychic Energy SVE', targets: [bench, otherBench] },
  { card: new Houndoom(), source: 'deck', energy: 'Water Energy SVE', cost: 'Darkness Energy SVE', targets: [bench, otherBench] },
  { card: new Boltund(), source: 'deck', energy: 'Lightning Energy SVE', cost: 'Water Energy SVE', targets: [bench, otherBench] },
  { card: new ArceusVSTAR(), source: 'deck', energy: 'Water Energy SVE', cost: 'Water Energy SVE', targets: [bench, bench] },
  { card: new Dondozo(), source: 'top', energy: 'Water Energy SVE', cost: 'Water Energy SVE', targets: [active, active] },
  { card: new Smeargle(), source: 'top', energy: 'Water Energy SVE', cost: 'Water Energy SVE', targets: [bench, bench] },
];
describe('Energy-family source and target declarations', () => {
  beforeAll(() => {
    const manager = CardManager.getInstance();
    for (const card of [...cases.map(c => c.card), new Beautifly(), new Terapagos(), new Laprasex(), new Delibird()]) {
      if (!manager.isCardDefined(card.fullName)) manager.defineCard(card);
    }
  });
  cases.forEach(({ card, source, energy, cost, targets }) => [0, 2].forEach(count => {
    it(`${card.fullName} accepts ${count} basic cards in the printed distribution and rejects specials`, () => {
      const game = setupGame({ turn: 4,
        player1: { active: { card: card.fullName, energy: [cost, cost, cost] },
          bench: [{ card: 'Arceus V BRS' }, { card: 'Ralts SIT' }],
          discard: source === 'discard' ? [energy, energy, 'Double Turbo Energy BRS'] : [],
          deck: source === 'discard' ? padDeck(15) : [energy, energy, 'Double Turbo Energy BRS', ...padDeck(15)] },
        player2: { active: { card: 'Arceus V BRS' }, prizeCount: 4, deck: padDeck(15) },
      });
      let answered = 0;
      game.overridePrompt('Attach energy', p => {
        const prompt = p as AttachEnergyPrompt;
        const raw = targets.slice(0, count).map((to, index) => ({ to, index }));
        expect(accepts(prompt, raw, game.state)).toBe(true);
        const specialIndex = prompt.cardList.cards.findIndex(c => c.name === 'Double Turbo Energy');
        expect(specialIndex).toBeGreaterThanOrEqual(0);
        expect(accepts(prompt, [{ to: targets[0], index: specialIndex }], game.state)).toBe(false);
        if (card instanceof Boltund || card instanceof Lycanroc || card instanceof Pachirisu) {
          expect(accepts(prompt, [{ to: active, index: 0 }], game.state)).toBe(false);
        }
        if (card instanceof Dondozo) expect(accepts(prompt, [{ to: bench, index: 0 }], game.state)).toBe(false);
        if (card instanceof ArceusVSTAR) expect(accepts(prompt, [{ to: otherBench, index: 0 }], game.state)).toBe(false);
        if (card instanceof Smeargle) expect(accepts(prompt, [{ to: bench, index: 0 }, { to: otherBench, index: 1 }], game.state)).toBe(false);
        answered++;
        return raw;
      });
      useAttack(game.store, game.state, 0, card.attacks[0].name);
      expect(answered).toBe(1);
      expect(game.player1.bench[0].energies.cards.length + game.player1.bench[1].energies.cards.length
        + game.player1.active.energies.cards.length).toBe(3 + count);
    });
  }));
  it('Terapagos with no Tera recipient completes the up-to attack with zero and still shuffles', () => {
    const game = setupGame({ turn: 4,
      player1: { active: { card: 'Terapagos SSP', energy: ['Water Energy SVE'] }, deck: padDeck(10) },
      player2: { active: { card: 'Arceus V BRS' }, deck: padDeck(10) },
    });
    let shuffles = 0;
    game.overridePrompt('Shuffle deck', () => { shuffles++; return game.player1.deck.cards.map((_, i) => i); });
    useAttack(game.store, game.state, 0, 'Prism Charge');
    expect(game.player1.active.energies.cards.length).toBe(1);
    expect(game.state.activePlayer).toBe(1);
    expect(shuffles).toBe(1);
  });
  it('Beautifly rejects duplicate energy types before attachment', () => {
    const game = setupGame({ turn: 4,
      player1: { active: { card: 'Beautifly DRX', energy: ['Grass Energy SVE'] },
        deck: ['Water Energy SVE', 'Water Energy SVE', 'Fire Energy SVE', ...padDeck(10)] },
      player2: { active: { card: 'Arceus V BRS' }, deck: padDeck(10) },
    });
    let answered = 0;
    game.overridePrompt('Choose cards', p => {
      const prompt = p as ChooseCardsPrompt;
      const water = prompt.cards.cards.map((c, index) => c.name === 'Water Energy' ? index : -1).filter(i => i >= 0);
      expect(prompt.validate(prompt.decode(water.slice(0, 2)))).toBe(false);
      answered++;
      return [];
    });
    useAttack(game.store, game.state, 0, 'Triple Energy');
    expect(answered).toBe(1);
  });
  it('Terapagos rejects duplicate energy types and shuffles after a nonzero answer', () => {
    const game = setupGame({ turn: 4,
      player1: { active: { card: 'Terapagos SSP', energy: ['Water Energy SVE'] }, bench: [{ card: 'Lapras ex SCR' }],
        deck: ['Water Energy SVE', 'Water Energy SVE', 'Fire Energy SVE', ...padDeck(10)] },
      player2: { active: { card: 'Arceus V BRS' }, deck: padDeck(10) },
    });
    let shuffles = 0;
    game.overridePrompt('Attach energy', p => {
      const prompt = p as AttachEnergyPrompt;
      expect(accepts(prompt, [{ to: bench, index: 0 }, { to: bench, index: 1 }], game.state)).toBe(false);
      return [{ to: bench, index: 0 }, { to: bench, index: 2 }];
    });
    game.overridePrompt('Shuffle deck', () => { shuffles++; return game.player1.deck.cards.map((_, i) => i); });
    useAttack(game.store, game.state, 0, 'Prism Charge');
    expect(shuffles).toBe(1);
    expect(game.player1.bench[0].energies.cards.length).toBe(2);
  });
  it('Delibird offers basic cards to the opponent first, then the attacker, in each owner perspective', () => {
    const game = setupGame({ turn: 4,
      player1: { active: { card: 'Delibird M4', energy: ['Water Energy SVE'] }, hand: ['Water Energy SVE', 'Double Turbo Energy BRS'], deck: padDeck(10) },
      player2: { active: { card: 'Arceus V BRS' }, hand: ['Water Energy SVE', 'Double Turbo Energy BRS'], deck: padDeck(10) },
    });
    const owners: number[] = [];
    const selected = [game.player1.hand.cards[0], game.player2.hand.cards[0]];
    const answer = (p: any) => {
      const prompt = p as AttachEnergyPrompt;
      expect(accepts(prompt, [{ to: active, index: 1 }], game.state)).toBe(false);
      owners.push(prompt.playerId);
      if (owners.length === 1) game.overridePrompt('Attach energy', answer);
      return [{ to: active, index: 0 }];
    };
    game.overridePrompt('Attach energy', answer);
    useAttack(game.store, game.state, 0, 'Pleasing Present');
    expect(owners).toEqual([game.player2.id, game.player1.id]);
    [game.player1, game.player2].forEach((player, index) => {
      expect(player.hand.cards).not.toContain(selected[index]);
      expect(player.active.cards).toContain(selected[index]);
    });
  });
});
