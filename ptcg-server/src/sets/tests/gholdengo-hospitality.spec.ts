import { AttachEnergyPrompt, AttachEnergyPromptType } from '../../game/store/prompts/attach-energy-prompt';
import { CardTarget, PlayerType, SlotType } from '../../game/store/actions/play-card-action';
import { AS_OFTEN_AS_YOU_LIKE_ATTACH_BASIC_TYPE_ENERGY_FROM_HAND } from '../../game/store/prefabs/prefabs';
import { CardType } from '../../game/store/card/card-types';
import { useAttack } from './card-test-helpers';
import { setupGame, padDeck } from './test-helpers';

// Printed Lavish Hospitality: any number of Basic Metal Energy from hand,
// to your own Pokémon in any distribution. Attaching none is legal.
describe('Gholdengo PAF — Lavish Hospitality', () => {
  const active: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
  const bench0: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 };
  const bench1: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 1 };
  const metals = ['Metal Energy SVE', 'Metal Energy SVE', 'Metal Energy SVE', 'Metal Energy SVE'];

  function makeGame(hand: string[] = metals) {
    return setupGame({
      turn: 2,
      player1: {
        active: { card: 'Gholdengo PAF', energy: ['Metal Energy SVE'] },
        bench: [{ card: 'Ralts SIT' }, { card: 'Ralts SIT' }],
        hand,
        deck: padDeck(10),
      },
      player2: { active: { card: 'Ralts SIT' }, deck: padDeck(10) },
    });
  }

  [
    { name: 'one to the Active', targets: [active], counts: [2, 0, 0] },
    { name: 'one to the Bench', targets: [bench0], counts: [1, 1, 0] },
    { name: 'all four to the Active', targets: [active, active, active, active], counts: [5, 0, 0] },
    { name: 'all four to one Benched Pokémon', targets: [bench0, bench0, bench0, bench0], counts: [1, 4, 0] },
    { name: 'all four across Active and Bench', targets: [active, bench0, bench0, bench1], counts: [2, 2, 1] },
    { name: 'a subset across two Benched Pokémon', targets: [bench0, bench1], counts: [1, 1, 1] },
    { name: 'zero despite having eligible cards', targets: [], counts: [1, 0, 0] },
  ].forEach(({ name, targets, counts }) => {
    it(`attaches ${name} even after the normal turn attachment was used`, () => {
      const game = makeGame();
      game.player1.energyPlayedTurn = game.state.turn;
      const before = [...game.player1.hand.cards];
      game.overridePrompt(AttachEnergyPromptType, prompt => {
        const attach = prompt as AttachEnergyPrompt;
        expect(attach.options.min).toBe(0);
        expect(attach.options.max).toBe(4);
        expect(attach.options.sameTarget).toBe(false);
        expect(attach.options.differentTargets).toBe(false);
        expect(attach.playerType).toBe(PlayerType.BOTTOM_PLAYER);
        expect(attach.slots).toContain(SlotType.ACTIVE);
        expect(attach.slots).toContain(SlotType.BENCH);
        return targets.map((to, index) => ({ to, index }));
      });

      useAttack(game.store, game.state, 0, 'Lavish Hospitality');

      expect([game.player1.active, game.player1.bench[0], game.player1.bench[1]]
        .map(slot => slot.energies.cards.length)).toEqual(counts);
      targets.forEach((to, index) => {
        const slot = to.slot === SlotType.ACTIVE ? game.player1.active : game.player1.bench[to.index];
        expect(slot.energies.cards).toContain(before[index]);
        expect(slot.cards).toContain(before[index]);
      });
      expect(game.player1.hand.cards).toEqual(before.slice(targets.length));
      expect(game.player2.active.energies.cards.length).toBe(0);
      expect(game.state.activePlayer).toBe(1);
    });
  });

  it('may cancel without attaching and still ends the attack', () => {
    const game = makeGame();
    const before = [...game.player1.hand.cards];
    game.overridePrompt(AttachEnergyPromptType, () => null);
    useAttack(game.store, game.state, 0, 'Lavish Hospitality');
    expect(game.player1.hand.cards).toEqual(before);
    expect(game.player1.active.energies.cards.length).toBe(1);
    expect(game.state.activePlayer).toBe(1);
  });

  [[], ['Water Energy SVE', 'Double Turbo Energy BRS']].forEach(hand => {
    it(`finishes with no matching energy (${hand.length} cards in hand)`, () => {
      const game = makeGame(hand);
      const before = [...game.player1.hand.cards];
      useAttack(game.store, game.state, 0, 'Lavish Hospitality');
      expect(game.player1.hand.cards).toEqual(before);
      expect(game.player1.active.energies.cards.length).toBe(1);
      expect(game.state.prompts.some(p => p instanceof AttachEnergyPrompt)).toBe(false);
      expect(game.state.activePlayer).toBe(1);
    });
  });

  it('offers only Basic Metal Energy, retaining other basics, special energy and Pokémon', () => {
    const game = makeGame(['Metal Energy SVE', 'Water Energy SVE', 'Unit Energy LPM UPR', 'Metal Energy SVE', 'Ralts SIT']);
    const before = [...game.player1.hand.cards];
    game.overridePrompt(AttachEnergyPromptType, prompt => {
      const attach = prompt as AttachEnergyPrompt;
      expect(attach.options.max).toBe(2);
      expect(attach.options.blocked).toEqual([1, 2, 4]);
      expect(() => attach.decode([{ to: active, index: 1 }], game.state)).toThrow();
      expect(() => attach.decode([{ to: active, index: 2 }], game.state)).toThrow();
      return [{ to: active, index: 0 }, { to: bench0, index: 3 }];
    });
    useAttack(game.store, game.state, 0, 'Lavish Hospitality');
    expect(game.player1.hand.cards).toEqual([before[1], before[2], before[4]]);
    expect(game.player1.active.energies.cards).toContain(before[0]);
    expect(game.player1.bench[0].energies.cards).toEqual([before[3]]);
  });

  [
    { name: 'opponent', to: { ...active, player: PlayerType.TOP_PLAYER } },
    { name: 'empty Bench', to: { ...bench0, index: 4 } },
    { name: 'non-Pokémon slot', to: { ...active, slot: SlotType.HAND } },
  ].forEach(({ name, to }) => {
    it(`rejects a ${name} target before moving any cards`, () => {
      const game = makeGame();
      const before = [...game.player1.hand.cards];
      game.overridePrompt(AttachEnergyPromptType, () => [{ to: active, index: 0 }, { to, index: 1 }]);
      expect(() => useAttack(game.store, game.state, 0, 'Lavish Hospitality')).toThrow();
      expect(game.player1.hand.cards).toEqual(before);
      expect(game.player1.active.energies.cards.length).toBe(1);
      expect(game.player2.active.energies.cards.length).toBe(0);
    });
  });

  it('rejects assigning the same physical energy twice', () => {
    const game = makeGame();
    const before = [...game.player1.hand.cards];
    game.overridePrompt(AttachEnergyPromptType, () => [{ to: active, index: 0 }, { to: bench0, index: 0 }]);
    expect(() => useAttack(game.store, game.state, 0, 'Lavish Hospitality')).toThrow();
    expect(game.player1.hand.cards).toEqual(before);
  });

  it('preserves the helper default of one card for unlimited-use abilities', () => {
    const game = makeGame();
    AS_OFTEN_AS_YOU_LIKE_ATTACH_BASIC_TYPE_ENERGY_FROM_HAND(game.store, game.state, game.player1, CardType.METAL);
    const prompt = game.state.prompts.find(p => p instanceof AttachEnergyPrompt) as AttachEnergyPrompt;
    expect(prompt.options.min).toBe(1);
    expect(prompt.options.max).toBe(1);
    expect(prompt.validate(prompt.decode([{ to: active, index: 0 }, { to: bench0, index: 1 }], game.state))).toBe(false);
  });
});
