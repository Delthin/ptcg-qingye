import { CardType, CardTag, Stage, SuperType } from '../../game/store/card/card-types';
import { PokemonCard } from '../../game/store/card/pokemon-card';
import { ChooseCardsPrompt, ChooseCardsPromptType } from '../../game/store/prompts/choose-cards-prompt';
import { set30thCelebration } from '../11-mega-evolution/set-30th-celebration';
import { useAttack } from './card-test-helpers';
import { ensureCardsRegistered, getCardByName, padDeck, setupGame } from './test-helpers';

describe('30thDC deluxe deck Pokémon', () => {
  const espeonName = 'Espeon ex 30C 014/040';

  beforeAll(() => ensureCardsRegistered(['Hydreigon 30C']));

  it('registers unique fullNames and the printed characteristics', () => {
    const names = set30thCelebration.map(card => card.fullName);
    expect(new Set(names).size).toBe(names.length);
    const espeon = getCardByName(espeonName) as PokemonCard;
    expect(espeon.hp).toBe(260);
    expect(espeon.stage).toBe(Stage.STAGE_1);
    expect(espeon.evolvesFrom).toBe('Eevee');
    expect(espeon.tags).toContain(CardTag.POKEMON_ex);
    expect(espeon.cardType).toEqual([CardType.PSYCHIC]);
    expect(espeon.weakness).toEqual([{ type: CardType.DARK }]);
    expect(espeon.resistance).toEqual([{ type: CardType.FIGHTING, value: -30 }]);
    expect(espeon.retreat).toEqual([CardType.COLORLESS]);
    expect(espeon.attacks[0].cost).toEqual([CardType.PSYCHIC, CardType.COLORLESS]);

    const hydreigon = getCardByName('Hydreigon 30C') as PokemonCard;
    expect(hydreigon.hp).toBe(170);
    expect(hydreigon.stage).toBe(Stage.STAGE_2);
    expect(hydreigon.evolvesFrom).toBe('Zweilous');
    expect(hydreigon.cardType).toEqual([CardType.DARK]);
    expect(hydreigon.weakness).toEqual([{ type: CardType.GRASS }]);
    expect(hydreigon.retreat).toEqual([CardType.COLORLESS, CardType.COLORLESS]);
    expect(hydreigon.attacks.map(attack => attack.cost)).toEqual([
      [CardType.DARK], [CardType.DARK, CardType.COLORLESS]
    ]);

    const kangaskhan = getCardByName('Kangaskhan 30C') as PokemonCard;
    expect(kangaskhan.hp).toBe(130);
    expect(kangaskhan.stage).toBe(Stage.BASIC);
    expect(kangaskhan.cardType).toEqual([CardType.COLORLESS]);
    expect(kangaskhan.weakness).toEqual([{ type: CardType.FIGHTING }]);
    expect(kangaskhan.retreat).toEqual([CardType.COLORLESS, CardType.COLORLESS]);
    expect(kangaskhan.attacks.map(attack => attack.cost)).toEqual([
      [CardType.COLORLESS, CardType.COLORLESS],
      [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]
    ]);
  });

  [{ benchCount: 0, expected: 30 }, { benchCount: 2, expected: 90 }, { benchCount: 5, expected: 180 }]
    .forEach(({ benchCount, expected }) => {
    it(`Sunshine Beatdown counts the Active and ${benchCount} Benched Pokémon only`, () => {
      const game = setupGame({
        turn: 2,
        player1: {
          active: { card: espeonName, energy: ['Psychic Energy SVE', 'Water Energy SVE'] },
          bench: Array.from({ length: benchCount }, () => ({ card: 'Eevee 30C' })),
          hand: ['Eevee 30C'],
          deck: padDeck(10)
        },
        player2: {
          active: { card: 'Mew VMAX 30C' },
          bench: [{ card: 'Eevee 30C' }],
          deck: padDeck(10)
        }
      });
      useAttack(game.store, game.state, 0, 'Sunshine Beatdown');
      expect(game.player2.active.damage).toBe(expected);
      expect(game.player2.bench[0].damage).toBe(0);
      expect(game.state.activePlayer).toBe(1);
    });
  });

  [
    { flips: [false, false, false], energy: 3, discarded: 0 },
    { flips: [false, true, false], energy: 3, discarded: 1 },
    { flips: [true, false, true], energy: 3, discarded: 2 },
    { flips: [true, true, true], energy: 4, discarded: 3 },
    { flips: [true, true, true], energy: 1, discarded: 1 },
    { flips: [true, true, true], energy: 0, discarded: 0 },
  ].forEach(({ flips, energy, discarded }) => {
    it(`Triple Bite discards ${discarded} of ${energy} attached Energy cards for ${flips.filter(Boolean).length} heads`, () => {
      const attached = ['Double Turbo Energy BRS', 'Water Energy SVE', 'Psychic Energy SVE', 'Darkness Energy SVE'].slice(0, energy);
      const game = setupGame({
        turn: 2,
        player1: {
          active: { card: 'Hydreigon 30C', energy: ['Darkness Energy SVE'] },
          deck: padDeck(10)
        },
        player2: {
          active: { card: 'Snorlax 30C', energy: attached },
          bench: [{ card: 'Eevee 30C', energy: ['Water Energy SVE'] }],
          deck: padDeck(10)
        }
      });
      let flipIndex = 0;
      // CoinFlipEffect resolves server-side with Math.random, then waits for
      // its animation; it no longer asks a CoinFlipPrompt for the result.
      spyOn(Math, 'random').and.callFake(() => flips[flipIndex++] ? 0.25 : 0.75);
      let choices = 0;
      const before = game.player2.active.energies.cards.slice();
      const selected = discarded > 0 ? before.slice(-discarded) : [];
      game.overridePrompt(ChooseCardsPromptType, prompt => {
        const choose = prompt as ChooseCardsPrompt;
        choices++;
        expect(choose.playerId).toBe(game.player1.id);
        expect(choose.cards).toBe(game.player2.active);
        expect(choose.filter.superType).toBe(SuperType.ENERGY);
        expect(choose.options.min).toBe(discarded);
        expect(choose.options.max).toBe(discarded);
        expect(choose.validate(null)).toBe(false);
        return selected.map(card => choose.cards.cards.indexOf(card));
      });

      useAttack(game.store, game.state, 0, 'Triple Bite');

      expect(flipIndex).toBe(3);
      expect(choices).toBe(discarded > 0 ? 1 : 0);
      expect(game.player2.active.energies.cards.length).toBe(energy - discarded);
      if (discarded > 0) {
        selected.forEach(card => {
          expect(game.player2.discard.cards).toContain(card);
          expect(game.player2.active.cards).not.toContain(card);
        });
      }
      expect(game.player1.active.energies.cards.length).toBe(1);
      expect(game.player2.bench[0].energies.cards.length).toBe(1);
      expect(game.player2.active.damage).toBe(0);
      expect(game.state.activePlayer).toBe(1);
    });
  });

  it('Pitch-Black Fangs deals 140 without discarding Energy', () => {
    const game = setupGame({
      turn: 2,
      player1: { active: { card: 'Hydreigon 30C', energy: ['Darkness Energy SVE', 'Water Energy SVE'] }, deck: padDeck(10) },
      player2: { active: { card: 'Snorlax 30C', energy: ['Water Energy SVE'] }, deck: padDeck(10) }
    });
    useAttack(game.store, game.state, 0, 'Pitch-Black Fangs');
    expect(game.player2.active.damage).toBe(140);
    expect(game.player2.active.energies.cards.length).toBe(1);
    expect(game.player1.active.energies.cards.length).toBe(2);
    expect(game.state.activePlayer).toBe(1);
  });

  [
    { attack: 'Rage', damage: 0, expected: 20 },
    { attack: 'Rage', damage: 50, expected: 70 },
    { attack: 'Rage', damage: 120, expected: 140 },
    { attack: 'Mega Punch', damage: 50, expected: 100 }
  ].forEach(({ attack, damage, expected }) => {
    it(`${attack} with ${damage} existing damage deals ${expected}`, () => {
      const game = setupGame({
        turn: 2,
        player1: {
          active: { card: 'Kangaskhan 30C', damage, energy: padDeck(3) },
          bench: [{ card: 'Eevee 30C', damage: 20 }],
          deck: padDeck(10)
        },
        player2: { active: { card: 'Snorlax 30C' }, deck: padDeck(10) }
      });
      useAttack(game.store, game.state, 0, attack);
      expect(game.player2.active.damage).toBe(expected);
      expect(game.player1.active.damage).toBe(damage);
      expect(game.state.activePlayer).toBe(1);
    });
  });
});
