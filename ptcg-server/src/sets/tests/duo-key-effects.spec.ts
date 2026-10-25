import {
  ChooseAttackPromptType,
  ChooseCardsPromptType,
  EnergyCard,
  EnergyType,
  PlayerType,
  PutDamagePromptType,
  RemoveDamagePromptType,
  SlotType,
} from '../../game';
import { setupGame, padDeck } from './test-helpers';
import {
  getDamage,
  getZoneCount,
  playTrainerCard,
  useAbility,
  useAttack,
  zoneContains,
} from './card-test-helpers';

// Oracles used by these tests (printed card text):
// - Dragapult ex TWM Phantom Dive: 200 damage to the Active, then 6 damage counters on the
//   opponent's Benched Pokemon in any way you like. Tera Pokemon only prevent damage, not counters.
// - Gholdengo ex PAR Make It Rain: discard any number of Basic Energy cards from hand; 50 damage each.
// - Night Stretcher SFA: put a Pokemon or a Basic Energy card from discard into hand (not Special Energy).
// - Superior Energy Retrieval PAL: discard 2 cards from hand, then recover up to 4 Basic Energy from discard.
// - Munkidori TWM Adrena-Brain: move up to 3 damage counters from 1 of your Pokemon to 1 of your
//   opponent's Pokemon (single source, single destination).
// - Mew ex MEW Genome Hacking: copy 1 of the Defending Pokemon's attacks and use it.
// - Mew ex 30C Memory Helix: use the attacks of your Benched Pokemon (normal path only).

function isBasicEnergy(card: unknown): boolean {
  return card instanceof EnergyCard && card.energyType === EnergyType.BASIC;
}

function isSpecialEnergy(card: unknown): boolean {
  return card instanceof EnergyCard && card.energyType === EnergyType.SPECIAL;
}

describe('Dragapult ex TWM Phantom Dive', () => {
  it('deals 200 to the Active and 60 counters to a Benched Tera Pokemon', () => {
    const game = setupGame({
      turn: 2,
      player1: {
        active: { card: 'Dragapult ex TWM', energy: ['Fire Energy SVE', 'Psychic Energy SVE'] },
        deck: padDeck(10),
      },
      player2: {
        active: { card: 'Gholdengo ex PAR' },
        bench: [{ card: 'Dragapult ex TWM' }],
        deck: padDeck(10),
      },
    });

    game.overridePrompt(PutDamagePromptType, () => [
      { target: { player: PlayerType.TOP_PLAYER, slot: SlotType.BENCH, index: 0 }, damage: 60 },
    ]);

    useAttack(game.store, game.state, 0, 'Phantom Dive');

    expect(getDamage(game.state, 1)).toBe(200);
    expect(getDamage(game.state, 1, 0)).toBe(60);
  });
});

describe('Gholdengo ex PAR Make It Rain', () => {
  function makeItRainGame() {
    return setupGame({
      turn: 2,
      player1: {
        active: { card: 'Gholdengo ex PAR', energy: ['Metal Energy SVE'] },
        hand: ['Fire Energy SVE', 'Psychic Energy SVE', 'Double Turbo Energy BRS'],
        deck: padDeck(10),
      },
      player2: {
        active: { card: 'Gholdengo ex PAR' },
        deck: padDeck(10),
      },
    });
  }

  it('discards only the chosen Basic Energy and deals 50 per discarded card', () => {
    const game = makeItRainGame();

    game.overridePrompt(ChooseCardsPromptType, (prompt) => {
      const cards = (prompt as any).cards.cards as unknown[];
      return cards
        .map((card, index) => ({ card, index }))
        .filter(({ card }) => isBasicEnergy(card))
        .map(({ index }) => index);
    });

    useAttack(game.store, game.state, 0, 'Make It Rain');

    expect(getDamage(game.state, 1)).toBe(100);
    expect(zoneContains(game.state, 0, 'discard', 'Fire Energy SVE')).toBe(true);
    expect(zoneContains(game.state, 0, 'discard', 'Psychic Energy SVE')).toBe(true);
    expect(zoneContains(game.state, 0, 'hand', 'Double Turbo Energy BRS')).toBe(true);
    expect(getZoneCount(game.state, 0, 'discard')).toBe(2);
  });

  it('rejects selecting a Special Energy', () => {
    const game = makeItRainGame();

    game.overridePrompt(ChooseCardsPromptType, (prompt) => {
      const cards = (prompt as any).cards.cards as unknown[];
      return [cards.findIndex((card) => isSpecialEnergy(card))];
    });

    expect(() => useAttack(game.store, game.state, 0, 'Make It Rain')).toThrow();
  });
});

describe('Superior Energy Retrieval PAL', () => {
  it('discards 2 cards then recovers 4 Basic Energy from discard', () => {
    const game = setupGame({
      turn: 2,
      player1: {
        active: { card: 'Ralts SIT' },
        hand: ['Superior Energy Retrieval PAL', 'Fire Energy SVE', 'Psychic Energy SVE'],
        discard: [
          'Metal Energy SVE',
          'Darkness Energy SVE',
          'Water Energy SVE',
          'Grass Energy SVE',
        ],
        deck: padDeck(10),
      },
      player2: {
        active: { card: 'Ralts SIT' },
        deck: padDeck(10),
      },
    });

    playTrainerCard(game.store, game.state, 0, 'Superior Energy Retrieval PAL');

    const player = game.state.players[0];
    expect(player.hand.cards.filter(isBasicEnergy).length).toBe(4);
    expect(player.discard.cards.filter(isBasicEnergy).length).toBe(2);
  });
});

describe('Munkidori TWM Adrena-Brain', () => {
  const fromActive = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
  const fromBench0 = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 };
  const toActive = { player: PlayerType.TOP_PLAYER, slot: SlotType.ACTIVE, index: 0 };
  const toBench0 = { player: PlayerType.TOP_PLAYER, slot: SlotType.BENCH, index: 0 };

  function adrenaBrainGame() {
    return setupGame({
      turn: 2,
      player1: {
        active: { card: 'Munkidori TWM', energy: ['Darkness Energy SVE'], damage: 30 },
        bench: [{ card: 'Ralts SIT', damage: 30 }],
        deck: padDeck(10),
      },
      player2: {
        active: { card: 'Gholdengo ex PAR' },
        bench: [{ card: 'Ralts SIT' }],
        deck: padDeck(10),
      },
    });
  }

  it('moves up to 3 counters from one own Pokemon to one opponent Pokemon', () => {
    const game = adrenaBrainGame();

    game.overridePrompt(RemoveDamagePromptType, () => [
      { from: fromActive, to: toActive },
      { from: fromActive, to: toActive },
      { from: fromActive, to: toActive },
    ]);

    useAbility(game.store, game.state, 0, 'Adrena-Brain');

    expect(getDamage(game.state, 0)).toBe(0);
    expect(getDamage(game.state, 0, 0)).toBe(30);
    expect(getDamage(game.state, 1)).toBe(30);
  });

  it('rejects transfers from more than one source', () => {
    const game = adrenaBrainGame();

    game.overridePrompt(RemoveDamagePromptType, () => [
      { from: fromActive, to: toActive },
      { from: fromBench0, to: toActive },
      { from: fromBench0, to: toActive },
    ]);

    expect(() => useAbility(game.store, game.state, 0, 'Adrena-Brain')).toThrow();
  });

  it('rejects transfers to more than one destination', () => {
    const game = adrenaBrainGame();

    game.overridePrompt(RemoveDamagePromptType, () => [
      { from: fromActive, to: toActive },
      { from: fromActive, to: toBench0 },
    ]);

    expect(() => useAbility(game.store, game.state, 0, 'Adrena-Brain')).toThrow();
  });
});

describe('Mew ex MEW Genome Hacking', () => {
  it('copies and uses a real attack from the opponent Active Pokemon', () => {
    const game = setupGame({
      turn: 2,
      player1: {
        active: {
          card: 'Mew ex MEW',
          energy: ['Fire Energy SVE', 'Psychic Energy SVE', 'Darkness Energy SVE'],
        },
        deck: padDeck(10),
      },
      player2: {
        active: { card: 'Dragapult ex TWM' },
        deck: padDeck(10),
      },
    });

    game.overridePrompt(ChooseAttackPromptType, () => ({ index: 0, attack: 'Jet Headbutt' }));

    useAttack(game.store, game.state, 0, 'Genome Hacking');

    expect(getDamage(game.state, 1)).toBe(70);
  });
});

describe('Mew ex 30C Memory Helix', () => {
  it('uses a Benched Pokemon attack on the normal path', () => {
    const game = setupGame({
      turn: 2,
      player1: {
        active: { card: 'Mew ex 30C', energy: ['Darkness Energy SVE'] },
        bench: [{ card: 'Dragapult ex TWM' }],
        deck: padDeck(10),
      },
      player2: {
        active: { card: 'Gholdengo ex PAR' },
        deck: padDeck(10),
      },
    });

    game.overridePrompt(ChooseAttackPromptType, () => ({ index: 0, attack: 'Jet Headbutt' }));

    useAbility(game.store, game.state, 0, 'Memory Helix');

    expect(getDamage(game.state, 1)).toBe(70);
  });
});

describe('Night Stretcher SFA canPlay', () => {
  it('is not playable when discard only holds Special Energy', () => {
    const game = setupGame({
      turn: 2,
      player1: {
        active: { card: 'Ralts SIT' },
        hand: ['Night Stretcher SFA'],
        discard: ['Double Turbo Energy BRS'],
        deck: padDeck(10),
      },
      player2: {
        active: { card: 'Ralts SIT' },
        deck: padDeck(10),
      },
    });

    const nightStretcher = game.state.players[0].hand.cards.find(
      (card) => card.fullName === 'Night Stretcher SFA',
    ) as any;

    expect(nightStretcher.canPlay(game.store, game.state, game.state.players[0])).toBe(false);
    expect(() => playTrainerCard(game.store, game.state, 0, 'Night Stretcher SFA')).toThrow();
  });

  it('is playable when discard holds a Basic Energy', () => {
    const game = setupGame({
      turn: 2,
      player1: {
        active: { card: 'Ralts SIT' },
        hand: ['Night Stretcher SFA'],
        discard: ['Double Turbo Energy BRS', 'Metal Energy SVE'],
        deck: padDeck(10),
      },
      player2: {
        active: { card: 'Ralts SIT' },
        deck: padDeck(10),
      },
    });

    const nightStretcher = game.state.players[0].hand.cards.find(
      (card) => card.fullName === 'Night Stretcher SFA',
    ) as any;

    expect(nightStretcher.canPlay(game.store, game.state, game.state.players[0])).toBe(true);

    playTrainerCard(game.store, game.state, 0, 'Night Stretcher SFA');
    expect(
      game.state.players[0].hand.cards.some((card) => card.fullName === 'Metal Energy SVE'),
    ).toBe(true);
  });
});
