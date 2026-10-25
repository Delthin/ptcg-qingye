import { EnergyType } from '../../game/store/card/card-types';
import { AttachEnergyPrompt } from '../../game/store/prompts/attach-energy-prompt';
import { ResolvePromptAction } from '../../game/store/actions/resolve-prompt-action';
import { AttachEnergyEffect, PlayPokemonEffect } from '../../game/store/effects/play-card-effects';
import { PlayerType, SlotType } from '../../game/store/actions/play-card-action';
import { ATTACH_ENERGY_PROMPT, ATTACH_X_TYPE_ENERGY_FROM_DISCARD_TO_1_OF_YOUR_POKEMON,
  ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON,
  LOOK_AT_TOP_X_CARDS_AND_ATTACH_UP_TO_Y_ENERGY } from '../../game/store/prefabs/prefabs';
import { setupGame, padDeck } from './test-helpers';
import { useAbility, useAttack, playTrainerCard } from './card-test-helpers';
import { CAN_PLAY_TRAINER_CARD } from '../../game/store/prefabs/trainer-prefabs';
import { TrainerCard } from '../../game/store/card/trainer-card';
import { CardManager } from '../../game/cards/card-manager';
import { HattereneV } from '../09-sword-and-shield/set-crown-zenith/hatterene-v';
import { Orbeetle } from '../09-sword-and-shield/set-lost-origin/orbeetle';

const active = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
const bench = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 };
function sourceGame() {
  return setupGame({ turn: 2,
    player1: { active: { card: 'Ralts SIT' }, bench: [{ card: 'Ralts SIT' }], hand: ['Water Energy SVE'],
      discard: ['Metal Energy SVE', 'Metal Energy SVE'], deck: ['Metal Energy SVE', 'Metal Energy SVE', ...padDeck(10)] },
    player2: { active: { card: 'Ralts SIT' }, deck: padDeck(10) },
  });
}
function resolve(game: ReturnType<typeof sourceGame>, raw: { to: typeof active; index: number }[] | null) {
  const prompt = game.state.prompts.find(p => p instanceof AttachEnergyPrompt && p.result === undefined) as AttachEnergyPrompt;
  const selected = (raw || []).map(r => prompt.cardList.cards[r.index]);
  const result = prompt.decode(raw, game.state);
  expect(prompt.validate(result)).toBe(true);
  game.store.dispatch(new ResolvePromptAction(prompt.id, result));
  return selected;
}

describe('Energy attachment sources and conditional turn limits', () => {
  beforeAll(() => {
    // fullName ends with the card number; the generic harness infers set from its last token.
    const manager = CardManager.getInstance();
    for (const card of [new HattereneV(), new Orbeetle()]) {
      if (!manager.isCardDefined(card.fullName)) manager.defineCard(card);
    }
  });
  [
    { name: 'generic discard', source: 'discard', run: (g: ReturnType<typeof sourceGame>) =>
      ATTACH_ENERGY_PROMPT(g.store, g.state, g.player1, PlayerType.BOTTOM_PLAYER, SlotType.DISCARD,
        [SlotType.ACTIVE, SlotType.BENCH], { energyType: EnergyType.BASIC }, { min: 0, max: 2 }) },
    { name: 'single-target discard', source: 'discard', run: (g: ReturnType<typeof sourceGame>) =>
      ATTACH_X_TYPE_ENERGY_FROM_DISCARD_TO_1_OF_YOUR_POKEMON(g.store, g.state, g.player1, 2) },
    { name: 'generic deck', source: 'deck', run: (g: ReturnType<typeof sourceGame>) =>
      ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON(g.store, g.state, g.player1, 2, 2,
        { energyFilter: { energyType: EnergyType.BASIC } }) },
    { name: 'top-deck', source: 'deck', run: (g: ReturnType<typeof sourceGame>) =>
      LOOK_AT_TOP_X_CARDS_AND_ATTACH_UP_TO_Y_ENERGY(g.store, g.state, g.player1, 5, 5,
        { energyFilter: { energyType: EnergyType.BASIC } }) },
  ].forEach(({ name, source, run }) => {
    it(`${name} moves selected physical cards exactly once from its declared source`, () => {
      const game = sourceGame();
      const from = source === 'discard' ? game.player1.discard : game.player1.deck;
      const before = from.cards.length;
      const handBefore = [...game.player1.hand.cards];
      run(game);
      const destinations = name === 'single-target discard' ? [active, active] : [active, bench];
      const selected = resolve(game, destinations.map((to, index) => ({ to, index })));
      expect(from.cards.length).toBe(before - 2);
      expect(game.player1.hand.cards).toEqual(handBefore);
      selected.forEach((card, index) => {
        const target = destinations[index].slot === SlotType.ACTIVE ? game.player1.active : game.player1.bench[0];
        expect(from.cards).not.toContain(card);
        expect(target.cards).toContain(card);
        expect(target.energies.cards).toContain(card);
      });
    });
  });

  it('Bea remains playable without consuming its deck in the preview, then attaches real revealed energies', () => {
    const game = setupGame({ turn: 3,
      player1: { active: { card: 'Ralts SIT' }, bench: [{ card: 'Groudon PAR' }], hand: ['Bea VIV'],
        deck: ['Fighting Energy SVE', 'Water Energy SVE', 'Ralts SIT', 'Grass Energy SVE', 'Ralts SIT', ...padDeck(6)] },
      player2: { active: { card: 'Ralts SIT' }, deck: padDeck(10) },
    });
    const trainer = game.player1.hand.cards[0] as TrainerCard;
    const originalDeck = game.player1.deck.cards.slice();
    const selected = [originalDeck[0], originalDeck[1], originalDeck[3]];
    expect(CAN_PLAY_TRAINER_CARD(game.store, game.state, game.player1, trainer)).toBe(true);
    expect(game.player1.deck.cards).toEqual(originalDeck);
    expect(game.player1.discard.cards.length).toBe(0);
    expect(game.store.hasPrompts()).toBe(false);
    game.overridePrompt('Attach energy', () => [0, 1, 2].map(index => ({ to: bench, index })));
    playTrainerCard(game.store, game.state, 0, trainer.fullName);
    expect(game.player1.deck.cards).toEqual(originalDeck.slice(5));
    expect(game.player1.bench[0].energies.cards).toEqual(selected);
    expect(game.player1.bench[0].cards).toEqual(jasmine.arrayContaining(selected));
    expect(game.player1.discard.cards).toEqual(jasmine.arrayContaining([originalDeck[2], originalDeck[4], trainer]));
    expect(game.player1.discard.cards.length).toBe(3);
    expect(game.player1.supporterTurn).toBe(1);
  });

  it('cancelled discard attachment leaves all cards untouched', () => {
    const game = sourceGame();
    const before = [...game.player1.discard.cards];
    ATTACH_ENERGY_PROMPT(game.store, game.state, game.player1, PlayerType.BOTTOM_PLAYER, SlotType.DISCARD,
      [SlotType.ACTIVE], { energyType: EnergyType.BASIC }, { min: 0, max: 2, allowCancel: true });
    resolve(game, null);
    expect(game.player1.discard.cards).toEqual(before);
    expect(game.player1.active.energies.cards.length).toBe(0);
  });

  it('an attachment prevented by an in-play effect does not pre-move source cards', () => {
    const game = sourceGame();
    const before = [...game.player1.deck.cards];
    game.player1.active.getPokemonCard()!.reduceEffect = (_store, state, effect) => {
      if (effect instanceof AttachEnergyEffect) effect.preventDefault = true;
      return state;
    };
    ATTACH_UP_TO_X_ENERGY_FROM_DECK_TO_Y_OF_YOUR_POKEMON(game.store, game.state, game.player1, 2, 2);
    resolve(game, [{ to: active, index: 0 }]);
    expect(game.player1.deck.cards).toEqual(before);
    expect(game.player1.active.energies.cards.length).toBe(0);
  });

  it('choosing zero from top-deck returns all revealed cards without losing or duplicating any', () => {
    const game = sourceGame();
    const before = game.player1.deck.cards.map(c => c.id).sort();
    LOOK_AT_TOP_X_CARDS_AND_ATTACH_UP_TO_Y_ENERGY(game.store, game.state, game.player1, 5, 5);
    resolve(game, []);
    expect(game.player1.deck.cards.map(c => c.id).sort()).toEqual(before);
    expect(game.player1.active.energies.cards.length).toBe(0);
  });

  [
    { card: 'Emolga-EX XY', attack: 'Energy Glide', cost: 'Lightning Energy SVE', source: 'deck', opponent: false,
      energies: ['Lightning Energy SVE'] },
    { card: 'Melmetal DAA', attack: 'Energy Link', cost: 'Metal Energy SVE', source: 'discard', opponent: false,
      energies: ['Double Turbo Energy BRS'] },
    { card: 'Solgaleo-GX SUM', attack: 'Sol Burst-GX', cost: 'Metal Energy SVE', source: 'deck', opponent: false,
      energies: ['Metal Energy SVE', 'Double Turbo Energy BRS'] },
    { card: 'Victini VMAX BST', attack: 'Spreading Flames', cost: 'Fire Energy SVE', source: 'discard', opponent: false,
      energies: ['Fire Energy SVE', 'Fire Energy SVE'] },
    { card: 'Hatterene V CRZ 65', attack: 'Horoscope', cost: 'Psychic Energy SVE', source: 'deck', opponent: false,
      energies: ['Water Energy SVE', 'Double Turbo Energy BRS'] },
    { card: 'Jellicent PHF', attack: 'Meddling', cost: 'Water Energy SVE', source: 'discard', opponent: true,
      energies: ['Water Energy SVE', 'Double Turbo Energy BRS'] },
  ].forEach(({ card, attack, cost, source, opponent, energies }) => {
    it(`${card} moves real source cards to the correct owner and board perspective`, () => {
      const game = setupGame({ turn: 2,
        player1: { active: { card, energy: [cost] }, bench: [{ card: 'Ralts SIT' }],
          discard: opponent ? [] : source === 'discard' ? energies : [],
          deck: source === 'deck' ? [...energies, ...padDeck(10)] : padDeck(10) },
        player2: { active: { card: 'Ralts SIT' }, discard: opponent ? energies : [], deck: padDeck(10) },
      });
      const owner = opponent ? game.player2 : game.player1;
      const from = source === 'deck' ? owner.deck : owner.discard;
      const selected = [...from.cards.slice(0, energies.length)];
      const before = from.cards.length;
      const target = opponent ? { ...active, player: PlayerType.TOP_PLAYER } : active;
      game.overridePrompt('Attach energy', () => selected.map((_, index) => ({ to: target, index })));
      useAttack(game.store, game.state, 0, attack);
      expect(from.cards.length).toBe(before - selected.length);
      const attachedSlot = opponent ? owner.active : [owner.active, ...owner.bench]
        .find(slot => slot.getPokemonCard()?.fullName === card)!;
      selected.forEach(energy => {
        expect(from.cards).not.toContain(energy);
        expect(attachedSlot.cards).toContain(energy);
        expect(attachedSlot.energies.cards).toContain(energy);
      });
      if (opponent) expect(game.player1.active.energies.cards.length).toBe(1);
    });
  });

  it('Orbeetle resolves TOP targets relative to the ability owner, not the opponent twice', () => {
    const game = setupGame({ turn: 2,
      player1: { active: { card: 'Orbeetle LOR 20' }, deck: padDeck(10) },
      player2: { active: { card: 'Ralts SIT' }, discard: ['Water Energy SVE'], deck: padDeck(10) },
    });
    const energy = game.player2.discard.cards[0];
    const card = game.player1.active.getPokemonCard()!;
    game.overridePrompt('Attach energy', () => [{ to: { ...active, player: PlayerType.TOP_PLAYER }, index: 0 }]);
    // Target/perspective regression follows this implementation's existing PlayPokemonEffect trigger.
    card.reduceEffect(game.store, game.state, new PlayPokemonEffect(game.player1, card, game.player1.active));
    const confirm = game.state.prompts.find(p => p.result === undefined)!;
    game.store.dispatch(new ResolvePromptAction(confirm.id, true));
    expect(game.player2.discard.cards.length).toBe(0);
    expect(game.player2.active.cards).toContain(energy);
    expect(game.player1.active.energies.cards.length).toBe(0);
  });

  [
    { card: 'Gardevoir CRE', ability: 'Shining Arcana', count: 2 },
    { card: 'Hydreigon PAL', ability: 'Tri Howl', count: 3 },
    { card: 'Magnezone ASR', ability: 'Giga Magnet', count: 0 },
  ].forEach(({ card, ability, count }) => {
    it(`${ability} remains once-per-turn after all energies attached or no matching energy revealed`, () => {
      const game = setupGame({ turn: 2,
        player1: { active: { card }, deck: padDeck(10) },
        player2: { active: { card: 'Ralts SIT' }, deck: padDeck(10) },
      });
      useAbility(game.store, game.state, 0, ability);
      expect(game.player1.active.energies.cards.length).toBe(count);
      expect(() => useAbility(game.store, game.state, 0, ability)).toThrow();
    });
  });
});
