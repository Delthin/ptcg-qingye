import { AttachEnergyPrompt, AttachEnergyPromptType } from '../../game/store/prompts/attach-energy-prompt';
import { PlayerType, SlotType } from '../../game/store/actions/play-card-action';
import { useAbility, useAttack } from './card-test-helpers';
import { padDeck, setupGame } from './test-helpers';
import { CardManager } from '../../game/cards/card-manager';
import { Oricorioex } from '../11-mega-evolution/set-phantasmal-flames/oricorio-ex';
import { MegaCharizardXex } from '../11-mega-evolution/set-phantasmal-flames/mega-charizard-x-ex';

const active = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
const bench = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 };

// Independent printed-text controls, not a blanket increase of every max: 1.
describe('Energy attachment family regressions', () => {
  beforeAll(() => {
    // These cards' fullName suffix is M2 but their set field is PFL, so the
    // generic harness's set-code inference cannot locate them by fullName.
    const manager = CardManager.getInstance();
    for (const card of [new Oricorioex(), new MegaCharizardXex()]) {
      if (!manager.isCardDefined(card.fullName)) manager.defineCard(card);
    }
  });
  [[], ['Metal Energy SVE']].forEach(hand => {
    it(`Kyurem V Rapid Freeze accepts zero matching cards (${hand.length} cards in hand)`, () => {
      const game = setupGame({ turn: 2,
        player1: { active: { card: 'Kyurem V LOR', energy: ['Water Energy SVE'] }, hand, deck: padDeck(10) },
        player2: { active: { card: 'Ralts SIT' }, deck: padDeck(10) },
      });
      const before = [...game.player1.hand.cards];
      useAttack(game.store, game.state, 0, 'Rapid Freeze');
      expect(game.player1.hand.cards).toEqual(before);
      expect(game.state.activePlayer).toBe(1);
    });
  });

  it('Kyurem V still attaches four cards in any distribution after the normal attachment', () => {
    const game = setupGame({ turn: 2,
      player1: { active: { card: 'Kyurem V LOR', energy: ['Water Energy SVE'] },
        bench: [{ card: 'Ralts SIT' }], hand: Array(4).fill('Water Energy SVE'), deck: padDeck(10) },
      player2: { active: { card: 'Ralts SIT' }, deck: padDeck(10) },
    });
    game.player1.energyPlayedTurn = game.state.turn;
    game.overridePrompt(AttachEnergyPromptType, () => [active, bench, bench, active].map((to, index) => ({ to, index })));
    useAttack(game.store, game.state, 0, 'Rapid Freeze');
    expect(game.player1.hand.cards.length).toBe(0);
    expect(game.player1.active.energies.cards.length).toBe(3);
    expect(game.player1.bench[0].energies.cards.length).toBe(2);
  });

  it('Joltik allows two Grass and two Lightning, including repeated types and targets', () => {
    const game = setupGame({ turn: 2,
      player1: { active: { card: 'Joltik SCR', energy: ['Grass Energy SVE'] }, bench: [{ card: 'Ralts SIT' }],
        deck: ['Grass Energy SVE', 'Grass Energy SVE', 'Lightning Energy SVE', 'Lightning Energy SVE', ...padDeck(10)] },
      player2: { active: { card: 'Ralts SIT' }, deck: padDeck(10) },
    });
    game.overridePrompt(AttachEnergyPromptType, prompt => {
      const attach = prompt as AttachEnergyPrompt;
      expect(attach.options.max).toBe(4);
      expect(attach.options.maxPerType).toBe(2);
      expect(attach.options.differentTypes).toBe(false);
      return [bench, bench, active, active].map((to, index) => ({ to, index }));
    });
    useAttack(game.store, game.state, 0, 'Jolting Charge');
    expect(game.player1.active.energies.cards.length).toBe(3);
    expect(game.player1.bench[0].energies.cards.length).toBe(2);
  });

  it('Joltik may attach zero but cannot attach three of the same type', () => {
    const game = setupGame({ turn: 2,
      player1: { active: { card: 'Joltik SCR', energy: ['Grass Energy SVE'] },
        deck: ['Grass Energy SVE', 'Grass Energy SVE', 'Grass Energy SVE', ...padDeck(10)] },
      player2: { active: { card: 'Ralts SIT' }, deck: padDeck(10) },
    });
    game.overridePrompt(AttachEnergyPromptType, prompt => {
      const attach = prompt as AttachEnergyPrompt;
      expect(attach.validate(attach.decode([0, 1, 2].map(index => ({ to: active, index })), game.state))).toBe(false);
      return [];
    });
    useAttack(game.store, game.state, 0, 'Jolting Charge');
    expect(game.player1.active.energies.cards.length).toBe(1);
    expect(game.state.activePlayer).toBe(1);
  });

  it('Oricorio ex accepts a Fire Mega Evolution ex on the Bench and remains repeatable', () => {
    const game = setupGame({ turn: 2,
      player1: { active: { card: 'Ralts SIT' }, bench: [{ card: 'Oricorio ex M2' }, { card: 'Mega Charizard X ex M2' }],
        hand: ['Fire Energy SVE', 'Fire Energy SVE'], deck: padDeck(10) },
      player2: { active: { card: 'Ralts SIT' }, deck: padDeck(10) },
    });
    game.player1.energyPlayedTurn = game.state.turn;
    for (let i = 0; i < 2; i++) {
      game.overridePrompt(AttachEnergyPromptType, () => [{ to: bench, index: 0 }]);
      useAbility(game.store, game.state, 0, 'Excited Turbo');
    }
    expect(game.player1.bench[0].energies.cards.length).toBe(2);
    expect(game.player1.hand.cards.length).toBe(0);
    expect(game.state.activePlayer).toBe(0);
  });

  it('Oricorio ex still requires a Fire Mega Evolution ex', () => {
    const game = setupGame({ turn: 2,
      player1: { active: { card: 'Ralts SIT' }, bench: [{ card: 'Oricorio ex M2' }],
        hand: ['Fire Energy SVE'], deck: padDeck(10) },
      player2: { active: { card: 'Ralts SIT' }, deck: padDeck(10) },
    });
    expect(() => useAbility(game.store, game.state, 0, 'Excited Turbo')).toThrow();
    expect(game.player1.hand.cards.length).toBe(1);
  });

  it('Magnezone single-card activations can repeat in the same turn', () => {
    const game = setupGame({ turn: 2,
      player1: { active: { card: 'Magnezone BKT' }, bench: [{ card: 'Ralts SIT' }],
        hand: ['Lightning Energy SVE', 'Lightning Energy SVE'], deck: padDeck(10) },
      player2: { active: { card: 'Ralts SIT' }, deck: padDeck(10) },
    });
    game.player1.energyPlayedTurn = game.state.turn;
    for (const to of [active, bench]) {
      game.overridePrompt(AttachEnergyPromptType, prompt => {
        expect((prompt as AttachEnergyPrompt).options.max).toBe(1);
        return [{ to, index: 0 }];
      });
      useAbility(game.store, game.state, 0, 'Magnetic Circuit');
    }
    expect(game.player1.active.energies.cards.length).toBe(1);
    expect(game.player1.bench[0].energies.cards.length).toBe(1);
  });
});
