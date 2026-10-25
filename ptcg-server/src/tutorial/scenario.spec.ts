import { CardManager } from '../game/cards/card-manager';
import { AttackAction } from '../game/store/actions/game-actions';
import { PlayCardAction, PlayerType, SlotType } from '../game/store/actions/play-card-action';
import { Eevee } from '../sets/10-scarlet-and-violet/set-shrouded-fable/eevee';
import { Magnemite } from '../sets/10-scarlet-and-violet/set-scarlet-and-violet/magnemite';
import { Magneton } from '../sets/10-scarlet-and-violet/set-surging-sparks/magneton';
import { Potion } from '../sets/06-black-and-white/set-boundaries-crossed/potion';
import { Nemona } from '../sets/10-scarlet-and-violet/set-scarlet-and-violet/nemona';
import { Pawmi } from '../sets/10-scarlet-and-violet/set-scarlet-and-violet/pawmi';
import { LightningEnergy } from '../sets/10-scarlet-and-violet/set-scarlet-and-violet-energy/lightning-energy';
import { TutorialEngineAction, TutorialEngineInput, TutorialInput, TutorialReceipt, TutorialScenario, tutorialSteps } from './scenario';
import { StateSerializer } from '../game/serializer/state-serializer';
import { Base64 } from '../utils/base64';
import { ChooseStartingPokemonPrompt } from '../game/store/prompts/choose-starting-pokemon-prompt';
import { ConfirmPrompt } from '../game/store/prompts/confirm-prompt';
import { PokemonCardList } from '../game/store/state/pokemon-card-list';
import { CardList } from '../game/store/state/card-list';
import { State } from '../game/store/state/state';
import { CAN_PLAY_TRAINER_CARD } from '../game/store/prefabs/trainer-prefabs';
import { TrainerEffect } from '../game/store/effects/play-card-effects';
import { ResolvePromptAction } from '../game/store/actions/resolve-prompt-action';

describe('Fixed beginner lesson on the real rule engine', () => {
  const previousKnownCards = StateSerializer.knownCards;
  afterAll(() => StateSerializer.setKnownCards(previousKnownCards));
  beforeAll(() => {
    const manager = CardManager.getInstance();
    [new Eevee(), new Magnemite(), new Magneton(), new Potion(), new Nemona(), new Pawmi(), new LightningEnergy()].forEach(card => {
      if (!manager.isCardDefined(card.fullName)) manager.defineCard(card);
    });
    StateSerializer.setKnownCards(manager.getAllCards());
  });

  it('starts with seven cards and complete 60-card decks, without exposing the opponent hand', () => {
    const view = new TutorialScenario(0).snapshot();
    expect(view.phase).toBe('setup');
    expect(view.hand.length).toBe(7);
    expect(view.self.deckCount).toBe(53);
    expect(view.opponent.deckCount).toBe(53);
    expect((view.opponent as any).hand).toBeUndefined();
  });

  it('rejects a wrong card and an out-of-order step without changing the board', () => {
    const lesson = new TutorialScenario(0);
    const before = JSON.stringify(lesson.snapshot());
    expect(() => lesson.submit({ step: 0, action: 'setup', cardId: 5 })).toThrow();
    expect(() => lesson.submit({ step: 1, action: 'bench', cardId: 1 })).toThrow();
    expect(JSON.stringify(lesson.snapshot())).toBe(before);
  });

  it('enforces first-turn attacks, evolution, supporters and the one-energy rule in the engine', () => {
    const attackLesson = new TutorialScenario(3);
    expect(() => attackLesson.store.dispatch(new AttackAction(1, 'Headbutt'))).toThrow();
    const target = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 };
    const evolutionLesson = new TutorialScenario(3);
    const evolution = evolutionLesson.state.players[0].hand.cards.findIndex(c => c.fullName === 'Magneton SSP');
    expect(() => evolutionLesson.store.dispatch(new PlayCardAction(1, evolution, target))).toThrow();
    const supporterLesson = new TutorialScenario(3);
    const supporter = supporterLesson.state.players[0].hand.cards.findIndex(c => c.fullName === 'Nemona SVI');
    expect(() => supporterLesson.store.dispatch(new PlayCardAction(1, supporter, { ...target, slot: SlotType.BOARD }))).toThrow();
    const energyLesson = new TutorialScenario(3);
    const energy = energyLesson.state.players[0].hand.cards.findIndex(c => c.fullName === 'Lightning Energy SVE');
    expect(() => energyLesson.store.dispatch(new PlayCardAction(1, energy, target))).toThrow();
  });

  it('keeps exact card and prize choices through reconstruction, then ends through a legal knockout', () => {
    const lesson = new TutorialScenario(0);
    const history: TutorialInput[] = [];
    for (let step = 0; step < tutorialSteps.length; step++) {
      const instruction = tutorialSteps[step];
      const input: TutorialInput = { step, action: instruction.id };
      if (instruction.target === 'hand') {
        const candidates = lesson.snapshot().hand.filter(c => c.fullName === instruction.cardFullName);
        input.cardId = candidates[candidates.length - 1].id;
      }
      if (instruction.target === 'prizes') input.prizeIndex = 4;
      lesson.submit(input);
      history.push(input);
      expect(new TutorialScenario(history).snapshot()).toEqual(lesson.snapshot());
    }
    const result = lesson.snapshot();
    expect(result.phase).toBe('finished');
    expect(result.winner).toBe('you');
    expect(result.self.prizeCount).toBe(4); // This is NOT a one-prize/six-prize shortcut.
    expect(result.opponent.active).toBeNull();
    expect(result.opponent.bench.every(slot => slot === null)).toBe(true);
    expect(result.self.active!.damage).toBe(40);
    expect(result.self.active!.energies.length).toBe(2); // Attacks did not consume energy.
    expect(result.self.discard.filter(c => c.fullName === 'Lightning Energy SVE').length).toBe(1); // Retreat did.
    expect(result.self.deckCount).toBe(38);
  });

  it('marks Potion playable only with a damaged friendly Pokemon through the real trainer check', () => {
    const healthy = new TutorialScenario(3);
    const player = healthy.state.players[0];
    const potion = player.hand.cards.find(c => c.fullName === 'Potion BCR') as Potion;
    expect(player.playableCardIds).not.toContain(potion.id);
    healthy.state.players[1].active.damage = 10;
    expect(CAN_PLAY_TRAINER_CARD(healthy.store, healthy.state, player, potion)).toBe(false);
    player.bench[0].damage = 10;
    expect(CAN_PLAY_TRAINER_CARD(healthy.store, healthy.state, player, potion)).toBe(true);
    player.cannotPlayItemCards = true;
    expect(CAN_PLAY_TRAINER_CARD(healthy.store, healthy.state, player, potion)).toBe(false);

    const damaged = new TutorialScenario(4);
    const damagedPlayer = damaged.state.players[0];
    const playablePotion = damagedPlayer.hand.cards.find(c => c.fullName === 'Potion BCR')!;
    expect(damagedPlayer.active.damage).toBe(10);
    expect(damagedPlayer.playableCardIds).toContain(playablePotion.id);
    expect(wire(damaged).players[0].playableCardIds).toContain(playablePotion.id);
  });

  it('keeps Potion when its normal engine target prompt is cancelled, without healing or discarding', () => {
    const lesson = new TutorialScenario(4);
    const player = lesson.state.players[0];
    const handIndex = player.hand.cards.findIndex(c => c.fullName === 'Potion BCR');
    const potion = player.hand.cards[handIndex];
    const originalIds = player.hand.cards.map(c => c.id).sort((a, b) => a - b);
    lesson.store.dispatch(new PlayCardAction(1, handIndex, { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BOARD, index: 0 }));
    const prompt = lesson.state.prompts.find(p => p.playerId === 1 && p.result === undefined)!;
    const result = prompt.decode(null, lesson.state);
    expect(prompt.validate(result, lesson.state)).toBe(true);
    lesson.store.dispatch(new ResolvePromptAction(prompt.id, result));
    expect(player.active.damage).toBe(10);
    expect(player.hand.cards.map(c => c.id).sort((a, b) => a - b)).toEqual(originalIds);
    expect(player.discard.cards).not.toContain(potion);
    expect(player.supporter.cards).not.toContain(potion);
    expect(player.playableCardIds).toContain(potion.id);
  });

  it('discards Potion itself after successful target resolution even without outer item cleanup', () => {
    const lesson = new TutorialScenario(4);
    const player = lesson.state.players[0];
    const potion = player.hand.cards.find(c => c.fullName === 'Potion BCR') as Potion;
    const originalHandSize = player.hand.cards.length;
    // Card effects must own their deferred cleanup, including the legacy TrainerEffect path.
    lesson.store.reduceEffect(lesson.state, new TrainerEffect(player, potion));
    const prompt = lesson.state.prompts.find(p => p.playerId === 1 && p.result === undefined)!;
    expect(player.active.damage).toBe(10);
    expect(player.discard.cards).not.toContain(potion);
    const result = prompt.decode([{ player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 }], lesson.state);
    expect(prompt.validate(result, lesson.state)).toBe(true);
    lesson.store.dispatch(new ResolvePromptAction(prompt.id, result));
    expect(player.active.damage).toBe(0);
    expect(player.hand.cards.length).toBe(originalHandSize - 1);
    expect(player.hand.cards).not.toContain(potion);
    expect(player.supporter.cards).not.toContain(potion);
    expect(player.discard.cards.filter(c => c.id === potion.id).length).toBe(1);
  });

  it('restores fixed pre-fix legacy receipts without clearing progress or renumbering card IDs', () => {
    const history: TutorialInput[] = [
      { step: 0, action: 'setup', cardId: 0 }, { step: 1, action: 'bench', cardId: 1 },
      { step: 2, action: 'energy-active', cardId: 5 }, { step: 3, action: 'first-pass' },
      { step: 4, action: 'potion', cardId: 3 }, { step: 5, action: 'heal' },
      { step: 6, action: 'supporter', cardId: 4 }, { step: 7, action: 'evolve', cardId: 2 },
      { step: 8, action: 'energy-bench', cardId: 6 }, { step: 9, action: 'retreat' },
      { step: 10, action: 'charge-pass' }, { step: 11, action: 'energy-second', cardId: 13 },
      { step: 12, action: 'attack-first' }, { step: 13, action: 'attack-knockout' },
      { step: 14, action: 'prize', prizeIndex: 4 }, { step: 15, action: 'attack-last-first' },
      { step: 16, action: 'attack-last' },
    ];
    const originalHistory = JSON.stringify(history);
    const healed = new TutorialScenario(history.slice(0, 6));
    expect(healed.completedSteps).toBe(6);
    expect(healed.state.players[0].hand.cards.length).toBe(5);
    expect(healed.state.players[0].discard.cards.some(c => c.id === 3 && c.fullName === 'Potion BCR')).toBe(true);
    const supported = new TutorialScenario(history.slice(0, 7));
    expect(supported.state.players[0].hand.cards.length).toBe(7); // Five cards, minus Nemona, plus three draws.
    expect(supported.state.players[0].discard.cards.some(c => c.id === 4 && c.fullName === 'Nemona SVI')).toBe(true);
    const restored = new TutorialScenario(history);
    expect(restored.completedSteps).toBe(17);
    expect(restored.snapshot().winner).toBe('you');
    expect(restored.state.players[0].discard.cards.some(c => c.id === 3 && c.fullName === 'Potion BCR')).toBe(true);
    expect(restored.state.players[0].active.cards.some(c => c.id === 2 && c.fullName === 'Magneton SSP')).toBe(true);
    expect(JSON.stringify(history)).toBe(originalHistory);
  });

  function harness(initial: TutorialReceipt[] = []) {
    const history = initial.slice();
    const lesson = new TutorialScenario(history);
    const act = (action: TutorialEngineAction) => {
      const input: TutorialEngineInput = { step: lesson.completedSteps, action };
      lesson.submitAction(input);
      history.push(input);
      const restored = new TutorialScenario(history);
      expect(restored.completedSteps).toBe(lesson.completedSteps);
      expect(restored.snapshot()).toEqual(lesson.snapshot());
      expect(restored.state.prompts.filter(p => p.result === undefined).map(p => [p.id, p.type, p.playerId]))
        .toEqual(lesson.state.prompts.filter(p => p.result === undefined).map(p => [p.id, p.type, p.playerId]));
    };
    const resolve = (result: unknown) => {
      const prompt = lesson.state.prompts.find(p => p.playerId === 1 && p.result === undefined)!;
      act({ type: 'resolvePrompt', id: prompt.id, result });
    };
    const play = (fullName: string, slot: SlotType, index = 0) => act({ type: 'playCard',
      handIndex: lesson.state.players[0].hand.cards.findIndex(card => card.fullName === fullName),
      target: { player: PlayerType.BOTTOM_PLAYER, slot, index } });
    return { lesson, history, act, resolve, play };
  }

  function wire(lesson: TutorialScenario): State {
    return new StateSerializer().deserialize(new Base64().decode(lesson.gameState().stateData));
  }

  function expectSecretsHidden(lesson: TutorialScenario) {
    const state = wire(lesson);
    const hidden = [state.players[0].deck, ...state.players[0].prizes, state.players[1].hand,
      state.players[1].deck, ...state.players[1].prizes];
    for (const list of hidden) for (const card of list.cards) {
      expect(card.fullName).toBe('Unknown');
      expect(state.cardNames[card.id]).toBe('Unknown');
    }
    // The original ID dictionary must not leak cards hidden by the above lists.
    for (const list of [lesson.state.players[0].deck, ...lesson.state.players[0].prizes,
      lesson.state.players[1].hand, lesson.state.players[1].deck, ...lesson.state.players[1].prizes]) {
      for (const card of list.cards) expect(state.cardNames[card.id]).toBe('Unknown');
    }
  }

  it('keeps GO_FIRST and starting-layout confirmation as two real, refreshable setup actions', () => {
    const run = harness();
    expect(run.lesson.completedSteps).toBe(0);
    expect(wire(run.lesson).prompts.some(p => p instanceof ConfirmPrompt && p.playerId === 1)).toBe(true);
    expect(() => run.resolve(false)).toThrow();
    expect(run.history.length).toBe(0);
    run.resolve(true);
    expect(run.lesson.completedSteps).toBe(0);
    const state = wire(run.lesson);
    expect(state.players[0].hand instanceof CardList).toBe(true);
    expect(state.players[0].active instanceof PokemonCardList).toBe(true);
    expect(state.players[0].hand.cards.length).toBe(7);
    expect(state.prompts.some(p => p instanceof ChooseStartingPokemonPrompt)).toBe(true);
    expectSecretsHidden(run.lesson);
    expect(() => run.resolve({ active: 1, bench: Array(5).fill(null) })).toThrow();
    expect(() => run.resolve({ active: 0, bench: [1, null, null, null, null] })).toThrow();
    expect(run.history.length).toBe(1);
    run.resolve({ active: 0, bench: Array(5).fill(null) });
    expect(run.lesson.completedSteps).toBe(1);
    expect(run.lesson.state.turn).toBe(1);
    expect(run.lesson.state.players[0].getPrizeLeft()).toBe(6);
    expectSecretsHidden(run.lesson);
  });

  it('rejects wrong landing zones and legacy HTTP-shaped intents without advancing or mutating', () => {
    const lesson = new TutorialScenario(2);
    const before = JSON.stringify(lesson.snapshot());
    const handIndex = lesson.state.players[0].hand.cards.findIndex(card => card.fullName === 'Lightning Energy SVE');
    for (const target of [
      { player: PlayerType.TOP_PLAYER, slot: SlotType.ACTIVE, index: 0 },
      { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 },
      { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 1 },
    ]) expect(() => lesson.submitAction({ step: 2, action: { type: 'playCard', handIndex, target } })).toThrow();
    expect(() => lesson.submitAction({ step: 2, action: 'energy-active' } as any)).toThrow();
    expect(lesson.completedSteps).toBe(2);
    expect(JSON.stringify(lesson.snapshot())).toBe(before);
    const heal = new TutorialScenario(5);
    const prompt = heal.state.prompts.find(p => p.playerId === 1 && p.result === undefined)!;
    const healBefore = JSON.stringify(heal.snapshot());
    expect(() => heal.submitAction({ step: 5, action: { type: 'resolvePrompt', id: prompt.id,
      result: [{ player: PlayerType.TOP_PLAYER, slot: SlotType.ACTIVE, index: 0 }] } })).toThrow();
    expect(heal.completedSteps).toBe(5);
    expect(JSON.stringify(heal.snapshot())).toBe(healBefore);
  });

  it('replays a legacy prefix then persists retreatStart/payment and replacement selection in the same lesson', () => {
    const old = new TutorialScenario(0);
    const history: TutorialInput[] = [];
    for (let step = 0; step < 9; step++) {
      const instruction = tutorialSteps[step];
      const input: TutorialInput = { step, action: instruction.id };
      if (instruction.target === 'hand') input.cardId = old.snapshot().hand.find(c => c.fullName === instruction.cardFullName)!.id;
      old.submit(input); history.push(input);
    }
    const run = harness(history);
    run.act({ type: 'retreatStart' });
    expect(run.lesson.completedSteps).toBe(9);
    expect(run.lesson.state.players[0].active.getPokemonCard()!.fullName).toBe('Eevee SFA');
    expect(run.lesson.state.players[0].discard.cards.filter(c => c.fullName === 'Lightning Energy SVE').length).toBe(1);
    expect(run.lesson.state.prompts.some(p => p.type === 'Choose pokemon' && p.result === undefined)).toBe(true);
    expect(() => run.resolve(null)).toThrow();
    run.resolve([{ player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 }]);
    expect(run.lesson.completedSteps).toBe(10);
    expect(run.lesson.state.players[0].active.getPokemonCard()!.fullName).toBe('Magneton SSP');
    expectSecretsHidden(run.lesson);
  });

  it('completes all 17 lessons using raw live-table actions, preserving every intermediate prompt and a chosen bench/prize', () => {
    const run = harness();
    const own = (slot: SlotType, index = 0) => [{ player: PlayerType.BOTTOM_PLAYER, slot, index }];
    run.resolve(true);
    run.resolve({ active: 0, bench: Array(5).fill(null) });
    run.play('Magnemite SVI', SlotType.BENCH, 2); // User-selected slot, not scripted bench zero.
    run.play('Lightning Energy SVE', SlotType.ACTIVE);
    run.act({ type: 'passTurn' });
    expect(run.lesson.state.turn).toBe(3);
    expect(run.lesson.state.players[0].active.damage).toBe(10);
    const potionId = run.lesson.state.players[0].hand.cards.find(c => c.fullName === 'Potion BCR')!.id;
    expect(run.lesson.state.players[0].playableCardIds).toContain(potionId);
    run.play('Potion BCR', SlotType.ACTIVE); // Normal drag onto a friendly slot must still ask for the effect target.
    expect(run.lesson.completedSteps).toBe(5);
    expect(run.lesson.state.players[0].active.damage).toBe(10);
    expect(wire(run.lesson).prompts.some(p => p.type === 'Choose pokemon')).toBe(true);
    run.resolve(own(SlotType.ACTIVE));
    expect(run.lesson.state.players[0].active.damage).toBe(0);
    expect(run.lesson.state.players[0].hand.cards.some(c => c.id === potionId)).toBe(false);
    expect(run.lesson.state.players[0].supporter.cards.some(c => c.id === potionId)).toBe(false);
    expect(run.lesson.state.players[0].discard.cards.filter(c => c.id === potionId).length).toBe(1);
    run.play('Nemona SVI', SlotType.BOARD);
    run.play('Magneton SSP', SlotType.BENCH, 2);
    run.play('Lightning Energy SVE', SlotType.BENCH, 2);
    run.act({ type: 'retreatStart' });
    expect(run.lesson.completedSteps).toBe(9);
    expect(run.lesson.state.players[0].active.cards.filter(c => c.fullName === 'Lightning Energy SVE').length).toBe(0);
    run.resolve(own(SlotType.BENCH, 2));
    run.act({ type: 'passTurn' });
    run.play('Lightning Energy SVE', SlotType.ACTIVE);
    run.act({ type: 'attack', attack: 'Electric Ball' });
    expect(run.lesson.state.players[1].active.damage).toBe(40);
    run.act({ type: 'attack', attack: 'Electric Ball' });
    expect(run.lesson.completedSteps).toBe(14);
    expect(wire(run.lesson).prompts.some(p => p.type === 'Choose prize')).toBe(true);
    const chosen = run.lesson.state.players[0].prizes[4].cards[0].id;
    run.resolve([4]);
    expect(run.lesson.state.players[0].hand.cards.some(c => c.id === chosen)).toBe(true);
    run.act({ type: 'attack', attack: 'Electric Ball' });
    run.act({ type: 'attack', attack: 'Electric Ball' });
    expect(run.lesson.completedSteps).toBe(17);
    expect(run.history.length).toBe(19);
    const result = run.lesson.snapshot();
    expect(result.phase).toBe('finished');
    expect(result.winner).toBe('you');
    expect(result.self.prizeCount).toBe(4);
    expect(result.opponent.active).toBeNull();
    expect(result.opponent.bench.every(slot => slot === null)).toBe(true);
    expect(result.self.active!.damage).toBe(40);
    expect(result.self.active!.energies.length).toBe(2);
    expect(result.self.discard.filter(c => c.fullName === 'Lightning Energy SVE').length).toBe(1);
    expect(result.self.deckCount).toBe(38);
    expectSecretsHidden(run.lesson);
  });
});
