import { AttachEnergyPrompt } from '../../game/store/prompts/attach-energy-prompt';
import { PlayerType, SlotType } from '../../game/store/actions/play-card-action';
import { CardManager } from '../../game/cards/card-manager';
import { padDeck, setupGame, getCardByName } from './test-helpers';
import { useAbility, useAttack } from './card-test-helpers';
import { Blastoise } from '../set-base-set/blastoise';
import { LunalaPrismStar } from '../08-sun-and-moon/set-ultra-prism/lunala-prism-star';
import { SolgaleoPrismStar } from '../08-sun-and-moon/set-ultra-prism/solgaleo-prism-star';
import { ZeraoraGX } from '../08-sun-and-moon/set-lost-thunder/zeraora-gx';
import { CharizardBraixenGX } from '../08-sun-and-moon/set-cosmic-eclipse/charizard-braixen-gx';
import { BlastoisePiplupGX } from '../08-sun-and-moon/set-cosmic-eclipse/blastoise-piplup-gx';
import { Miraidon } from '../10-scarlet-and-violet/set-temporal-forces/miraidon';
import { StevensMetagrossex } from '../10-scarlet-and-violet/set-destined-rivals/stevens-metagross-ex';
import { Gardevoirex } from '../10-scarlet-and-violet/set-scarlet-and-violet/gardevoir-ex';
import { Gorebyss } from '../10-scarlet-and-violet/set-destined-rivals/gorebyss';
import { Smoochum } from '../10-scarlet-and-violet/set-surging-sparks/smoochum';
import { Cinderace } from '../11-mega-evolution/set-mega-evolution/cinderace';
import { Morpeko } from '../10-scarlet-and-violet/set-twilight-masquerade/morpeko';
import { VictiniEX } from '../06-black-and-white/set-plasma-storm/victini-ex';

const active = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
const bench = { ...active, slot: SlotType.BENCH };
function accepts(prompt: AttachEnergyPrompt, raw: any, state: any) {
  try { return prompt.validate(prompt.decode(raw, state), state); } catch (_) { return false; }
}
describe('Energy-family current targets, quotas and timing', () => {
  beforeAll(() => {
    const manager = CardManager.getInstance();
    for (const card of [new Blastoise(), new LunalaPrismStar(), new SolgaleoPrismStar(), new ZeraoraGX(),
      new CharizardBraixenGX(), new BlastoisePiplupGX(), new Miraidon(), new StevensMetagrossex(), new Gardevoirex(),
      new Gorebyss(), new Smoochum(), new Cinderace(), new Morpeko(), new VictiniEX()]) {
      if (!manager.isCardDefined(card.fullName)) manager.defineCard(card);
    }
  });
  [
    { card: new Blastoise(), ability: true, energy: 'Water Energy SVE' },
    { card: new StevensMetagrossex(), ability: true, energy: 'Metal Energy SVE' },
    { card: new Miraidon(), ability: false, energy: 'Water Energy SVE' },
  ].forEach(({ card, ability, energy }) => {
    it(`${card.fullName} declares its target restriction before moving anything`, () => {
      const game = setupGame({ turn: 4,
        player1: { active: { card: card.fullName, energy: [energy] }, bench: [{ card: 'Arceus V BRS' }],
          hand: [energy], deck: [energy, ...padDeck(10)] },
        player2: { active: { card: 'Arceus V BRS' }, deck: padDeck(10) },
      });
      let answered = 0;
      game.overridePrompt('Attach energy', p => {
        const prompt = p as AttachEnergyPrompt;
        expect(accepts(prompt, [{ to: bench, index: 0 }], game.state)).toBe(false);
        expect(accepts(prompt, [{ to: active, index: 0 }], game.state)).toBe(true);
        answered++;
        return [{ to: active, index: 0 }];
      });
      if (ability) useAbility(game.store, game.state, 0, card.powers[0].name);
      else useAttack(game.store, game.state, 0, card.attacks[0].name);
      expect(answered).toBe(1);
      expect(game.player1.active.energies.cards.length).toBe(2);
    });
  });
  [new LunalaPrismStar(), new SolgaleoPrismStar()].forEach(card => {
    it(`${card.fullName} counts the opposing Active and requires the matching public-zone type`, () => {
      const energy = card instanceof LunalaPrismStar ? 'Psychic Energy SVE' : 'Metal Energy SVE';
      const game = setupGame({ turn: 4,
        player1: { active: { card: card.fullName, energy: [energy] }, discard: [energy, 'Water Energy SVE'], deck: padDeck(10) },
        player2: { active: { card: 'Arceus V BRS' }, deck: padDeck(10) },
      });
      let answered = 0;
      game.overridePrompt('Attach energy', p => {
        const prompt = p as AttachEnergyPrompt;
        expect(prompt.options.min).toBe(1); expect(prompt.options.max).toBe(1);
        expect(accepts(prompt, [{ to: active, index: 1 }], game.state)).toBe(false);
        answered++;
        return [{ to: active, index: 0 }];
      });
      useAttack(game.store, game.state, 0, card.attacks[0].name);
      expect(answered).toBe(1);
      expect(game.player1.active.energies.cards.length).toBe(2);
    });
  });
  [new CharizardBraixenGX(), new BlastoisePiplupGX()].forEach(card => {
    it(`${card.fullName} permits attachment to the attacking Active`, () => {
      const energy = card instanceof CharizardBraixenGX ? 'Fire Energy SVE' : 'Water Energy SVE';
      const game = setupGame({ turn: 4,
        player1: { active: { card: card.fullName, energy: [energy, energy, energy] }, hand: ['Water Energy SVE'],
          discard: ['Water Energy SVE'], deck: padDeck(10) },
        player2: { active: { card: 'Arceus V BRS' }, deck: padDeck(10) },
      });
      game.overridePrompt('Attach energy', () => [{ to: active, index: 0 }]);
      useAttack(game.store, game.state, 0, card.attacks[card instanceof CharizardBraixenGX ? 1 : 0].name);
      expect(game.player1.active.energies.cards.length).toBe(4);
    });
  });
  [0, 3].forEach(count => {
    it(`Zeraora Full Voltage-GX completes with ${count} non-Lightning basic energies`, () => {
      const game = setupGame({ turn: 4,
        player1: { active: { card: 'Zeraora GX LOT', energy: ['Lightning Energy SVE'] },
          discard: Array(count).fill('Water Energy SVE'), deck: padDeck(10) },
        player2: { active: { card: 'Arceus V BRS' }, deck: padDeck(10) },
      });
      game.overridePrompt('Attach energy', p => {
        const prompt = p as AttachEnergyPrompt;
        expect(prompt.options.min).toBe(count); expect(prompt.options.max).toBe(count);
        return Array.from({ length: count }, (_, index) => ({ to: active, index }));
      });
      useAttack(game.store, game.state, 0, 'Full Voltage-GX');
      expect(game.player1.active.energies.cards.length).toBe(1 + count);
      expect(game.player1.usedGX).toBe(true);
    });
  });
  it('Psychic Embrace checks the current evolution, not the Colorless base underneath', () => {
    const game = setupGame({ turn: 4,
      player1: { active: { card: 'Gardevoir ex SVI' }, bench: [{ card: 'Eevee EVS' }],
        discard: ['Psychic Energy SVE'], deck: padDeck(10) },
      player2: { active: { card: 'Arceus V BRS' }, deck: padDeck(10) },
    });
    game.player1.bench[0].cards.push(getCardByName('Espeon OBF'));
    game.overridePrompt('Attach energy', () => [{ to: bench, index: 0 }]);
    useAbility(game.store, game.state, 0, 'Psychic Embrace');
    expect(game.player1.bench[0].energies.cards.length).toBe(1);
    expect(game.player1.bench[0].damage).toBe(20);
  });
  it('Psychic Embrace rejects cumulative lethal batches without moving the first card', () => {
    const game = setupGame({ turn: 4,
      player1: { active: { card: 'Gardevoir ex SVI' }, bench: [{ card: 'Ralts SIT', damage: 20 }],
        discard: ['Psychic Energy SVE', 'Psychic Energy SVE', 'Psychic Energy SVE'], deck: padDeck(10) },
      player2: { active: { card: 'Arceus V BRS' }, deck: padDeck(10) },
    });
    const before = [...game.player1.discard.cards];
    game.overridePrompt('Attach energy', () => [0, 1, 2].map(index => ({ to: bench, index })));
    expect(() => useAbility(game.store, game.state, 0, 'Psychic Embrace')).toThrow();
    expect(game.player1.discard.cards).toEqual(before);
    expect(game.player1.bench[0].energies.cards.length).toBe(0);
    expect(game.player1.bench[0].damage).toBe(20);
  });
  [false, true].forEach(attach => {
    it(`Gorebyss calculates damage after its optional attachment (${attach})`, () => {
      const game = setupGame({ turn: 4,
        player1: { active: { card: 'Gorebyss DRI', energy: ['Water Energy SVE'] },
          hand: ['Water Energy SVE', 'Water Energy SVE'], deck: padDeck(10) },
        player2: { active: { card: 'Arceus V BRS' }, deck: padDeck(10) },
      });
      game.overridePrompt('Confirm', () => attach);
      game.overridePrompt('Attach energy', () => [0, 1].map(index => ({ to: active, index })));
      useAttack(game.store, game.state, 0, 'Crescendo Wave');
      expect(game.player2.active.damage).toBe(attach ? 90 : 30);
    });
  });
  [new Smoochum(), new Cinderace()].forEach(card => {
    it(`${card.fullName} completes its attack with an empty deck`, () => {
      const game = setupGame({ turn: 4,
        player1: { active: { card: card.fullName, energy: ['Water Energy SVE'] }, deck: [] },
        player2: { active: { card: 'Arceus V BRS' }, deck: padDeck(10) },
      });
      useAttack(game.store, game.state, 0, card.attacks[0].name);
      expect(game.state.activePlayer).toBe(1);
      expect(game.player2.active.damage).toBe(card.attacks[0].damage);
    });
  });
  it('Morpeko may attach zero for an up-to attack', () => {
    const game = setupGame({ turn: 4,
      player1: { active: { card: 'Morpeko TWM', energy: ['Lightning Energy SVE'] }, discard: ['Water Energy SVE'], deck: padDeck(10) },
      player2: { active: { card: 'Arceus V BRS' }, deck: padDeck(10) },
    });
    game.overridePrompt('Attach energy', () => []);
    useAttack(game.store, game.state, 0, 'Pick and Stick');
    expect(game.player1.discard.cards.length).toBe(1);
    expect(game.state.activePlayer).toBe(1);
  });
  it('Victini Turbo Energize already works with a full Bench (audit guard was a false positive)', () => {
    const game = setupGame({ turn: 4,
      player1: { active: { card: 'Victini EX PLS', energy: ['Fire Energy SVE'] },
        bench: Array.from({ length: 5 }, () => ({ card: 'Ralts SIT' })), deck: ['Water Energy SVE', 'Water Energy SVE', ...padDeck(10)] },
      player2: { active: { card: 'Arceus V BRS' }, deck: padDeck(10) },
    });
    game.overridePrompt('Attach energy', () => [0, 1].map(index => ({ to: bench, index })));
    useAttack(game.store, game.state, 0, 'Turbo Energize');
    expect(game.player1.bench[0].energies.cards.length).toBe(2);
  });
});
