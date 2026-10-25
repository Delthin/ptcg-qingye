import { CardManager } from '../../game/cards/card-manager';
import { StateSerializer } from '../../game/serializer/state-serializer';
import { SuperType } from '../../game/store/card/card-types';
import { GameMessage } from '../../game/game-message';
import { AlertPrompt } from '../../game/store/prompts/alert-prompt';
import { ConfirmPrompt } from '../../game/store/prompts/confirm-prompt';
import { Player } from '../../game/store/state/player';
import { GamePhase, State } from '../../game/store/state/state';
import { Eevee } from '../../sets/10-scarlet-and-violet/set-shrouded-fable/eevee';
import { Magnemite } from '../../sets/10-scarlet-and-violet/set-scarlet-and-violet/magnemite';
import { Magneton } from '../../sets/10-scarlet-and-violet/set-surging-sparks/magneton';
import { Potion } from '../../sets/06-black-and-white/set-boundaries-crossed/potion';
import { Nemona } from '../../sets/10-scarlet-and-violet/set-scarlet-and-violet/nemona';
import { Pawmi } from '../../sets/10-scarlet-and-violet/set-scarlet-and-violet/pawmi';
import { LightningEnergy } from '../../sets/10-scarlet-and-violet/set-scarlet-and-violet-energy/lightning-energy';
import { TutorialScenario } from '../../tutorial/scenario';
import { StateSanitizer } from './state-sanitizer';

describe('Private state transport', () => {
  const manager = CardManager.getInstance();
  let oldKnownCards = StateSerializer.knownCards;
  beforeAll(() => {
    [new Eevee(), new Magnemite(), new Magneton(), new Potion(), new Nemona(), new Pawmi(), new LightningEnergy()].forEach(card => {
      if (!manager.isCardDefined(card.fullName)) manager.defineCard(card);
    });
    oldKnownCards = StateSerializer.knownCards;
    StateSerializer.setKnownCards(manager.getAllCards());
  });
  afterAll(() => StateSerializer.setKnownCards(oldKnownCards));

  it('masks the global name dictionary and anonymizes hidden IDs, without mutating live state', () => {
    const state = new TutorialScenario(3).state;
    const opponent = state.players[1];
    const hidden = opponent.hand.cards[0];
    hidden.printingId = 'private-test-edition'; hidden.printingImage = '/scans/private-test-art.png';
    const originalNames = state.cardNames.slice();
    const sanitized = StateSanitizer.sanitizeForViewer(state, { playerId: 1, roleId: 0 });
    expect(sanitized.cardNames[hidden.id]).toBe('Unknown');
    expect(sanitized.cardNames[state.players[0].deck.cards[0].id]).toBe('Unknown');
    expect(sanitized.cardNames[state.players[0].prizes[0].cards[0].id]).toBe('Unknown');
    expect(sanitized.cardNames[state.players[0].hand.cards[0].id]).toBe(state.players[0].hand.cards[0].fullName);
    expect(sanitized.players[1].hand.cards.every(card => card.id >= originalNames.length && card.fullName === 'Unknown')).toBe(true);
    const wire = new StateSerializer().serialize(sanitized);
    expect(wire).not.toContain('private-test-edition');
    expect(wire).not.toContain('private-test-art');
    const received = new StateSerializer().deserialize(wire);
    expect(received.players[1].hand.cards.every(card => card.superType === SuperType.NONE && card.fullName === 'Unknown')).toBe(true);
    expect(received.players[0].hand.cards.map(card => card.fullName)).toEqual(state.players[0].hand.cards.map(card => card.fullName));
    expect(state.cardNames).toEqual(originalNames);
    expect(state.players[1].hand.cards[0]).toBe(hidden);
  });

  for (const ownerId of [11, 29]) {
    it(`exposes only a public GO_FIRST alert to non-owners when player ${ownerId} chooses`, () => {
      const state = new State();
      state.phase = GamePhase.SETUP;
      state.players = [11, 29].map(id => { const player = new Player(); player.id = id; return player; });
      const owner = state.players.find(player => player.id === ownerId)!;
      const handCard = new Eevee(); handCard.id = 0;
      handCard.printingId = 'private-opening-hand';
      owner.hand.cards = [handCard];
      state.cardNames = [handCard.fullName];
      const prompt = Object.assign(new ConfirmPrompt(ownerId, GameMessage.GO_FIRST), {
        id: 7341,
        perspectivePlayerId: 8123,
        privatePayload: { secret: 'synthetic-private-opening-payload', cards: owner.hand },
      });
      state.prompts = [prompt];

      const ownView = StateSanitizer.sanitizeForViewer(state, { playerId: ownerId, roleId: 0 });
      const ownPrompt = ownView.prompts[0] as typeof prompt;
      expect(ownPrompt instanceof ConfirmPrompt).toBe(true);
      expect(ownPrompt).not.toBe(prompt);
      expect(ownPrompt.id).toBe(7341);
      expect(ownPrompt.message).toBe(GameMessage.GO_FIRST);
      expect(ownPrompt.privatePayload).not.toBe(prompt.privatePayload);
      ownPrompt.privatePayload.secret = 'synthetic-changed-clone';
      expect(prompt.privatePayload.secret).toBe('synthetic-private-opening-payload');

      const opponentId = ownerId === 11 ? 29 : 11;
      for (const viewerId of [opponentId, 99]) {
        const view = StateSanitizer.sanitizeForViewer(state, { playerId: viewerId, roleId: 0 });
        expect(view.prompts.length).toBe(1);
        const publicPrompt = view.prompts[0] as AlertPrompt;
        expect(publicPrompt instanceof AlertPrompt).toBe(true);
        expect(publicPrompt instanceof ConfirmPrompt).toBe(false);
        expect(publicPrompt).toEqual(new AlertPrompt(ownerId, GameMessage.GO_FIRST));
        expect(publicPrompt.id).not.toBe(prompt.id);
        expect(publicPrompt.result).toBeUndefined();
        expect(Object.keys(publicPrompt).sort()).toEqual(['id', 'message', 'playerId', 'type']);
        expect(view.players.find(player => player.id === ownerId)!.hand.cards[0].fullName).toBe('Unknown');
        const serializer = new StateSerializer();
        const wire = serializer.serialize(view);
        expect(wire).not.toContain('private-opening-hand');
        expect(wire).not.toContain('synthetic-private-opening-payload');
        expect(wire).not.toContain('7341');
        expect(wire).not.toContain('8123');
        const received = serializer.deserialize(wire);
        expect(received.prompts[0] instanceof AlertPrompt).toBe(true);
        expect((received.prompts[0] as AlertPrompt).message).toBe(GameMessage.GO_FIRST);
      }

      expect(state.prompts).toEqual([prompt]);
      expect(prompt instanceof ConfirmPrompt).toBe(true);
      expect(prompt.id).toBe(7341);
      expect(prompt.result).toBeUndefined();
      expect(prompt.perspectivePlayerId).toBe(8123);
      expect(prompt.privatePayload.cards).toBe(owner.hand);
      expect(owner.hand.cards[0]).toBe(handCard);
      expect(state.cardNames).toEqual([handCard.fullName]);
    });
  }

  it('keeps ordinary Confirm prompts and other prompt types masked during setup', () => {
    const state = new State(); state.phase = GamePhase.SETUP;
    const prompts = [
      new ConfirmPrompt(11, GameMessage.NOT_YOUR_TURN),
      new AlertPrompt(11, GameMessage.GO_FIRST),
    ];
    prompts.forEach((prompt, index) => { prompt.id = 50 + index; });
    state.prompts = prompts;
    const view = StateSanitizer.sanitizeForViewer(state, { playerId: 29, roleId: 0 });
    expect(view.prompts).toEqual([
      new AlertPrompt(11, GameMessage.NOT_YOUR_TURN),
      new AlertPrompt(11, GameMessage.NOT_YOUR_TURN),
    ]);
    expect(state.prompts).toBe(prompts);
    expect(prompts.map(prompt => prompt.id)).toEqual([50, 51]);
  });

  for (const phase of [GamePhase.WAITING_FOR_PLAYERS, GamePhase.PLAYER_TURN, GamePhase.FINISHED]) {
    it(`masks a GO_FIRST Confirm outside setup (phase ${phase})`, () => {
      const state = new State(); state.phase = phase;
      state.prompts = [new ConfirmPrompt(11, GameMessage.GO_FIRST)];
      const view = StateSanitizer.sanitizeForViewer(state, { playerId: 29, roleId: 0 });
      expect(view.prompts).toEqual([new AlertPrompt(11, GameMessage.NOT_YOUR_TURN)]);
      expect(state.prompts[0] instanceof ConfirmPrompt).toBe(true);
    });
  }

  it('removes completed GO_FIRST prompts for owners, opponents and observers', () => {
    const state = new State(); state.phase = GamePhase.SETUP;
    state.prompts = [true, false].map(result => {
      const prompt = new ConfirmPrompt(11, GameMessage.GO_FIRST); prompt.result = result; return prompt;
    });
    for (const playerId of [11, 29, 99]) {
      const view = StateSanitizer.sanitizeForViewer(state, { playerId, roleId: 0 });
      expect(view.prompts).toEqual([]);
    }
    expect(state.prompts.map(prompt => prompt.result)).toEqual([true, false]);
  });

  it('round-trips full and diff private views as real cards become public', () => {
    const lesson = new TutorialScenario();
    const goFirst = lesson.state.prompts.find(prompt => prompt instanceof ConfirmPrompt
      && prompt.message === GameMessage.GO_FIRST && prompt.playerId === lesson.state.players[0].id
      && prompt.result === undefined);
    expect(goFirst).toBeDefined();
    lesson.submitAction({ step: 0, action: { type: 'resolvePrompt', id: goFirst!.id, result: true } });
    expect(goFirst!.result).toBe(true);
    expect(lesson.completedSteps).toBe(0);
    const serializer = new StateSerializer();
    const before = serializer.serialize(StateSanitizer.sanitizeForViewer(lesson.state, { playerId: 1, roleId: 0 }));
    lesson.submit({ step: 0, action: 'setup', cardId: 0 });
    const afterState = StateSanitizer.sanitizeForViewer(lesson.state, { playerId: 1, roleId: 0 });
    const difference = serializer.serializeDiff(before, afterState);
    const received = serializer.deserializeDiff(before, difference);
    expect(received.players[0].active.getPokemonCard()!.fullName).toBe('Eevee SFA');
    expect(received.players[1].active.getPokemonCard()!.fullName).toBe('Pawmi SVI');
    expect(received.players[1].hand.cards.every(card => card.fullName === 'Unknown')).toBe(true);
    expect(received.players[0].deck.cards.every(card => card.fullName === 'Unknown')).toBe(true);
  });
});
