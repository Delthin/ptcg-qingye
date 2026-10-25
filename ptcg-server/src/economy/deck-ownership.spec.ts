import 'reflect-metadata';
import { Connection, createConnection, getMetadataArgsStorage } from 'typeorm';
import * as storageEntities from '../storage';
import { Deck, EconomyHolding, User } from '../storage';
import { CardManager } from '../game/cards/card-manager';
import { DeckAnalyser } from '../game/cards/deck-analyser';
import { Card } from '../game/store/card/card';
import { FREE_BASIC_ENERGIES } from '../game/store/card/free-basic-energy';
import { GameSettings } from '../game/core/game-settings';
import { State } from '../game/store/state/state';
import { StateSerializer } from '../game/serializer/state-serializer';
import { Replay } from '../game/core/replay';
import { StateSanitizer } from '../backend/socket/state-sanitizer';
import { AddPlayerAction } from '../game/store/actions/add-player-action';
import { setupPhaseReducer } from '../game/store/reducers/setup-reducer';
import { GrassEnergy } from '../sets/10-scarlet-and-violet/set-scarlet-and-violet-energy/grass-energy';
import { DoubleTurboEnergy } from '../sets/09-sword-and-shield/set-brilliant-stars/double-turbo-energy';
import { Exeggcute } from '../sets/11-mega-evolution/set-30th-celebration/exeggcute';
import { GrassEnergyArt } from '../sets/11-mega-evolution/set-30th-celebration/energy-art';
import { Decks, getValidFormatsForCardList } from '../backend/controllers/decks';
import { authMiddleware } from '../backend/socket/auth-middleware';
import { CoreSocket } from '../backend/socket/core-socket';
import { GameSocket } from '../backend/socket/game-socket';
import { MatchmakingService } from '../backend/services/matchmaking.service';
import { InvitePlayerPrompt } from '../game/store/prompts/invite-player-prompt';
import { GameMessage } from '../game/game-message';
import { generateToken } from '../backend/services/auth-token';
import { config } from '../config';
import { printingById } from './catalog';
import { checkDeckOwnership, playableStoredDeck, validateDeckOwnership } from './deck-ownership';

// No server, file database, shared output, or external API. Only synthetic in-memory SQLite.
describe('deck ownership and per-copy appearances', () => {
  let connection: Connection;
  let user: User;
  const grass = 'Grass Energy SVE';
  const grassArt = 'Grass Energy M6a'; // chs:21795 is this collectible rule printing, not SVE.
  const egg = 'Exeggcute 30C';
  const special = 'Double Turbo Energy BRS';
  const oldDuo = config.duo.enabled;
  const oldSecret = process.env.secret;
  const manager = CardManager.getInstance();
  const oldCards = manager.getAllCards().slice();
  const oldKnownCards = StateSerializer.knownCards;
  const deckController = new Decks('/decks', {} as any, {} as any, {} as any);
  const copies = (n: number, name = grass) => Array.from({ length: n }, () => name);
  const save = async (body: any) => {
    let result: any;
    let status = 200;
    const req = { body, ip: 'energy-isolated-test', secure: false, header: () => generateToken(user.id), headers: {}, protocol: 'http' };
    const res: any = { status: (n: number) => { status = n; return res; }, send: (value: any) => { result = value; }, cookie: () => undefined };
    await deckController.onSave(req as any, res);
    return { status, result };
  };
  beforeAll(async () => {
    void storageEntities; // Load all relation entities before constructing the isolated metadata.
    config.duo.enabled = false;
    process.env.secret = 'synthetic-deck-ownership-test';
    const cards: Card[] = [new GrassEnergy(), new GrassEnergyArt(), new DoubleTurboEnergy(), new Exeggcute()];
    manager.loadCardsInfo({ cards } as any);
    StateSerializer.setKnownCards(cards);
    connection = await createConnection({ type: 'sqlite', database: ':memory:', synchronize: true,
      entities: getMetadataArgsStorage().tables.map(t => t.target as Function), logging: false });
    user = await User.save(User.create({ name: 'energy-test-member' }));
  });
  beforeEach(async () => { config.duo.enabled = false; await Deck.clear(); await EconomyHolding.clear(); });
  afterAll(async () => {
    if (connection) await connection.close();
    manager.loadCardsInfo({ cards: oldCards } as any);
    StateSerializer.setKnownCards(oldKnownCards);
    config.duo.enabled = oldDuo;
    if (oldSecret === undefined) delete process.env.secret; else process.env.secret = oldSecret;
  });
  it('has exactly eight independent synthetic defaults; 60 free copies work but 61 do not', () => {
    expect(FREE_BASIC_ENERGIES.length).toBe(8);
    expect(FREE_BASIC_ENERGIES.every(p => !printingById.has(p.printingId))).toBe(true);
    expect(validateDeckOwnership(copies(60), undefined, []).printingIds).toEqual(copies(60, 'free:grass'));
    expect(() => validateDeckOwnership(copies(61), undefined, [])).toThrow();
  });
  it('treats the verified ordinary source printing as a free alias, not a collectible quota', () => {
    const result = validateDeckOwnership(copies(60), copies(60, 'chs:12651'), []);
    expect(result.printingIds).toEqual(copies(60, 'free:grass'));
    expect(() => validateDeckOwnership([grass], ['chs:12652'], [])).toThrow();
  });
  it('does not infer freedom or special-energy rules from rarity; collectible basics may exceed four', () => {
    expect(printingById.get('chs:21795')!.rarity).toBe('无标记');
    const holdings = [{ printingId: 'chs:21795', count: 5 }];
    expect(validateDeckOwnership(copies(5, grassArt), copies(5, 'chs:21795'), holdings).owned).toBe(true);
    expect(() => validateDeckOwnership(copies(6, grassArt), copies(6, 'chs:21795'), holdings)).toThrow();
    expect(() => validateDeckOwnership(copies(1, grassArt), ['chs:21795'], [])).toThrow();
    // Even owned art cannot be substituted for a different stored rule printing.
    expect(() => validateDeckOwnership(copies(1), ['chs:21795'], holdings)).toThrow();
  });
  it('cannot borrow another energy edition or forge a free/unknown/mismatched reference', () => {
    const holdings = [{ printingId: 'chs:12651', count: 20 }];
    expect(() => validateDeckOwnership([grass], ['chs:21795'], holdings)).toThrow();
    expect(() => validateDeckOwnership([grass], ['free:fire'], [])).toThrow();
    expect(() => validateDeckOwnership([special], ['free:grass'], [])).toThrow();
    expect(() => validateDeckOwnership([grass], ['missing'], [])).toThrow();
    expect(() => validateDeckOwnership([grass], [], [])).toThrow();
  });
  it('aggregates ordinary and special holdings by effect while enforcing special-energy four-copy rules', () => {
    const holdings = [{ printingId: 'chs:15139', count: 2 }, { printingId: 'chs:15229', count: 2 }];
    expect(validateDeckOwnership(copies(4, special), undefined, holdings).owned).toBe(true);
    expect(() => validateDeckOwnership(copies(5, special), undefined, holdings)).toThrow();
    expect(() => validateDeckOwnership([egg], undefined, [])).toThrow();
    expect(validateDeckOwnership([egg], undefined, [{ printingId: 'chs:21632', count: 1 }]).owned).toBe(true);
  });
  it('requires the exact special-energy printing when an appearance is explicitly chosen', () => {
    expect(() => validateDeckOwnership([special], ['chs:15229'], [{ printingId: 'chs:15139', count: 4 }])).toThrow();
    expect(validateDeckOwnership([special, special], ['chs:15139', 'chs:15229'],
      [{ printingId: 'chs:15139', count: 1 }, { printingId: 'chs:15229', count: 1 }]).owned).toBe(true);
  });
  it('saves aligned editions, reads them back and allows permanent holdings in multiple decks', async () => {
    await EconomyHolding.save(EconomyHolding.create({ userId: user.id, printingId: 'chs:21795', count: 2,
      printingJson: JSON.stringify(printingById.get('chs:21795')) }));
    const cards = [grassArt, grass, grassArt, ...copies(7)];
    const printingIds = ['chs:21795', 'free:grass', 'chs:21795', ...copies(7, 'free:grass')];
    const first = await save({ name: 'energy-first', cards, printingIds });
    expect(first.status).toBe(200);
    expect(first.result.deck.printingIds).toEqual(printingIds);
    const row = (await Deck.findOne(first.result.deck.id))!;
    expect(JSON.parse(row.printingIds!)).toEqual(printingIds);
    const second = await save({ name: 'energy-second', cards, printingIds });
    expect(second.status).toBe(200);
    expect((await EconomyHolding.findOne({ where: { userId: user.id, printingId: 'chs:21795' } }))!.count).toBe(2);
    const loaded = await checkDeckOwnership(user.id, JSON.parse(row.cards), JSON.parse(row.printingIds!));
    expect(loaded.appearances[0]!.image).toBe('/scans/duo/21795.png');
    expect(loaded.appearances[1]!.image).toBe('/scans/duo/12651.png');
  });
  it('leaves per-copy order unchanged during analyser/format analysis and returns independent rule-card clones', () => {
    const cards = [special, egg, grassArt, grass];
    const before = cards.slice();
    const analyser = new DeckAnalyser(cards);
    analyser.isValid(undefined, true);
    analyser.getDeckType();
    getValidFormatsForCardList(cards);
    expect(cards).toEqual(before);
    const card = manager.getCardByName(egg)!;
    card.name = 'mutated-clone-only';
    expect(manager.getCardByName(egg)!.fullName).toBe(egg);
    expect(cards).toEqual(before);
  });
  it('edits quantities, saves/loads/duplicates aligned editions and launches the saved deck without changing holdings', async () => {
    const holdings = [
      { printingId: 'chs:21632', count: 1 }, { printingId: 'chs:21795', count: 1 },
      { printingId: 'chs:15139', count: 2 }, { printingId: 'chs:15229', count: 1 },
    ];
    await EconomyHolding.save(holdings.map(h => EconomyHolding.create({ userId: user.id, ...h, printingJson: '{}' })));
    const cards = [special, egg, grassArt, special, ...copies(56)];
    const refs = ['chs:15139', 'chs:21632', 'chs:21795', 'chs:15229', ...copies(56, 'free:grass')];
    const initial = await save({ name: 'editable-editions', cards, printingIds: refs });
    expect(initial.status).toBe(200);
    const id = initial.result.deck.id;
    const reduced = await save({ id, name: 'editable-editions', cards: cards.slice(1), printingIds: refs.slice(1) });
    expect(reduced.status).toBe(200);
    expect(reduced.result.deck.isValid).toBe(false);
    const editedCards = [egg, special, grassArt, special, special, ...copies(55)];
    const editedRefs = ['chs:21632', 'chs:15229', 'chs:21795', 'chs:15139', 'chs:15139', ...copies(55, 'free:grass')];
    const increased = await save({ id, name: 'editable-editions', cards: editedCards, printingIds: editedRefs });
    expect(increased.status).toBe(200);
    expect(increased.result.deck.cards).toEqual(editedCards);
    expect(increased.result.deck.printingIds).toEqual(editedRefs);
    expect(increased.result.deck.isValid).toBe(true);
    // Full structure remains legal (four special energies), but this exact edition has only two copies.
    expect((await save({ id, name: 'editable-editions', cards: [...editedCards.slice(0, 5), special, ...copies(54)],
      printingIds: [...editedRefs.slice(0, 5), 'chs:15139', ...copies(54, 'free:grass')] })).status).toBe(400);
    const omitted = await save({ id, name: 'editable-editions', cards: editedCards });
    expect(omitted.result.deck.printingIds).toEqual(editedRefs);
    const row = (await Deck.findOne(id))!;
    expect(JSON.parse(row.cards)).toEqual(editedCards);
    expect(JSON.parse(row.printingIds!)).toEqual(editedRefs);
    let readback: any;
    const readRes: any = { send: (v: any) => { readback = v; }, cookie: () => undefined };
    await deckController.onGet({ body: {}, params: { id: String(id) }, ip: 'energy-isolated-test', secure: false,
      header: () => generateToken(user.id), headers: {}, protocol: 'http' } as any, readRes);
    expect(readback.deck.cards).toEqual(editedCards);
    expect(readback.deck.printingIds).toEqual(editedRefs);
    const playable = await playableStoredDeck(user.id, id);
    expect(playable.cards).toEqual(editedCards);
    expect(playable.printingIds).toEqual(editedRefs);
    let duplicate: any;
    const res: any = { status: () => res, send: (v: any) => { duplicate = v; }, cookie: () => undefined };
    await deckController.onDuplicate({ body: { id, name: 'editions-duplicate' }, ip: 'energy-isolated-test', secure: false,
      header: () => generateToken(user.id), headers: {}, protocol: 'http' } as any, res);
    expect(duplicate.ok).toBe(true);
    expect(duplicate.deck.cards).toEqual(editedCards);
    expect(duplicate.deck.printingIds).toEqual(editedRefs);
    const client: any = { id: 1, user };
    const core: any = { clients: [client], games: [], createGame: jasmine.createSpy('createGame').and.returnValue({}) };
    spyOn(CoreSocket, 'buildGameState').and.returnValue({} as any);
    const reply = jasmine.createSpy('reply');
    await (new CoreSocket(client, { addListener: () => undefined } as any, core, {} as any) as any)
      .createGame({ deckId: id, gameSettings: new GameSettings() }, reply);
    expect(reply.calls.mostRecent().args[0]).toBe('ok');
    expect(core.createGame.calls.mostRecent().args[1]).toEqual(editedCards);
    expect(core.createGame.calls.mostRecent().args[7].map((a: any) => a?.printingId)).toEqual(editedRefs);
    for (const h of holdings) expect((await EconomyHolding.findOne({ where: { userId: user.id, printingId: h.printingId } }))!.count).toBe(h.count);
  });
  it('login migration and list-format backfill do not rotate cards or their refs', async () => {
    const cards = [egg, grassArt, ...copies(58)];
    const refs = ['chs:21632', 'chs:21795', ...copies(58, 'free:grass')];
    await EconomyHolding.save([
      EconomyHolding.create({ userId: user.id, printingId: 'chs:21632', count: 1, printingJson: '{}' }),
      EconomyHolding.create({ userId: user.id, printingId: 'chs:21795', count: 1, printingJson: '{}' }),
    ]);
    const row = await Deck.save(Deck.create({ user, name: 'migration-per-copy', cards: JSON.stringify(cards),
      printingIds: JSON.stringify(refs), isValid: false, formats: '' }));
    const originalSave = Deck.prototype.save;
    let finished: () => void;
    const completion = new Promise<void>(resolve => { finished = resolve; });
    spyOn(Deck.prototype, 'save').and.callFake(function(this: Deck) {
      return originalSave.call(this).then(saved => { finished(); return saved; });
    });
    const next = jasmine.createSpy('next');
    spyOn(console, 'log');
    await authMiddleware({ handshake: { query: { token: generateToken(user.id) }, headers: {} },
      request: { socket: { remoteAddress: 'migration-isolated-test' } } } as any, next);
    expect(next).toHaveBeenCalledWith();
    await completion;
    const migrated = (await Deck.findOne(row.id))!;
    expect(migrated.isValid).toBe(true);
    expect(JSON.parse(migrated.cards)).toEqual(cards);
    expect(JSON.parse(migrated.printingIds!)).toEqual(refs);
    await Deck.update(row.id, { formats: '' });
    let listed: any;
    const res: any = { send: (v: any) => { listed = v; }, cookie: () => undefined };
    await deckController.onList({ body: {}, query: {}, ip: 'energy-isolated-test', secure: false,
      header: () => generateToken(user.id), headers: {}, protocol: 'http' } as any, res);
    const entry = listed.decks.find((d: any) => d.id === row.id);
    expect(entry.cards).toEqual(cards);
    expect(entry.printingIds).toEqual(refs);
    const after = (await Deck.findOne(row.id))!;
    expect(JSON.parse(after.cards)).toEqual(cards);
    expect(JSON.parse(after.printingIds!)).toEqual(refs);
  });
  it('rejects direct save API overspending and excessive quantities', async () => {
    expect((await save({ name: 'forged-edition', cards: [grass], printingIds: ['chs:21795'] })).status).toBe(400);
    expect((await save({ name: 'too-many-cards', cards: copies(61) })).status).toBe(400);
    expect((await save({ name: 'unowned-ordinary', cards: [egg] })).status).toBe(400);
    expect((await save({ name: 'too-many-special', cards: copies(5, special) })).status).toBe(400);
  });
  it('keeps old practice decks as drafts without granting cards, but cannot launch or increase them', async () => {
    const cards = [egg, ...copies(59)];
    const row = await Deck.save(Deck.create({ user, name: 'legacy-practice', cards: JSON.stringify(cards), isValid: true }));
    const saved = await save({ id: row.id, name: row.name, cards });
    expect(saved.status).toBe(200);
    expect(saved.result.deck.isValid).toBe(false);
    expect(await EconomyHolding.count()).toBe(0);
    let rejected = false;
    try { await playableStoredDeck(user.id, row.id); } catch { rejected = true; }
    expect(rejected).toBe(true);
    expect((await save({ id: row.id, name: row.name, cards: [egg, egg, ...copies(58)] })).status).toBe(400);
    expect(await Deck.count()).toBe(1);
  });
  it('actual create and join entry points reject forged inventory even if a stored deck was marked valid', async () => {
    const row = await Deck.save(Deck.create({ user, name: 'forged-valid', cards: JSON.stringify([egg, ...copies(59)]), isValid: true }));
    const client: any = { id: 1, user, name: user.name };
    const invited: any = { id: 2, user: { id: 999, roleId: 2 } };
    const core: any = { clients: [client, invited], games: [], createGame: jasmine.createSpy('createGame') };
    const socket: any = { addListener: () => undefined };
    const reply = jasmine.createSpy('reply');
    config.duo.enabled = true;
    await (new CoreSocket(client, socket, core, {} as any) as any).createGame({ deckId: row.id, clientId: 2, gameSettings: new GameSettings() }, reply);
    expect(reply.calls.mostRecent().args[0]).toBe('error');
    expect(core.createGame).not.toHaveBeenCalled();
    config.duo.enabled = false;
    const joinReply = jasmine.createSpy('joinReply');
    await (new GameSocket(client, socket, core, {} as any) as any).playGame({ gameId: 7, deck: [grass], printingIds: ['chs:21795'] }, joinReply);
    expect(joinReply.calls.mostRecent().args[0]).toBe('error');
  });
  it('omitting a printing reference only yields explicit free art, never the owned-looking collectible', async () => {
    const saved = await save({ name: 'legacy-basic', cards: [grass] });
    expect(saved.status).toBe(200);
    expect(saved.result.deck.printingIds).toEqual(['free:grass']);
    const checked = await checkDeckOwnership(user.id, [grass]);
    expect(checked.appearances).toEqual([{ printingId: 'free:grass', image: '/scans/duo/12651.png' }]);
  });
  it('valid stored create uses stored per-copy appearances despite omitted or forged client references', async () => {
    await EconomyHolding.save([
      EconomyHolding.create({ userId: user.id, printingId: 'chs:21632', count: 1, printingJson: '{}' }),
      EconomyHolding.create({ userId: user.id, printingId: 'chs:21795', count: 1, printingJson: '{}' }),
    ]);
    const cards = [egg, grassArt, ...copies(58)];
    const refs = [null, 'chs:21795', ...copies(58, 'free:grass')];
    const saved = await save({ name: 'stored-appearance', cards, printingIds: refs });
    const target = await User.save(User.create({ name: 'energy-target-ready', roleId: 2 }));
    const targetDeck = await Deck.save(Deck.create({ user: target, name: 'target starter', cards: JSON.stringify(cards), isValid: true }));
    await User.update(target.id, { duoDeckId: targetDeck.id });
    await EconomyHolding.save(EconomyHolding.create({ userId: target.id, printingId: 'chs:21632', count: 1, printingJson: '{}' }));
    const client: any = { id: 1, user };
    const invited: any = { id: 2, user: target };
    const core: any = { clients: [client, invited], games: [], createGame: jasmine.createSpy('createGame').and.returnValue({}) };
    const socket: any = { addListener: () => undefined };
    spyOn(CoreSocket, 'buildGameState').and.returnValue({} as any);
    config.duo.enabled = true;
    const reply = jasmine.createSpy('reply');
    await (new CoreSocket(client, socket, core, {} as any) as any).createGame({ deckId: saved.result.deck.id, clientId: 2,
      deck: [special], printingIds: ['free:fire'], gameSettings: new GameSettings() }, reply);
    expect(reply.calls.mostRecent().args[0]).toBe('ok');
    expect(core.createGame.calls.mostRecent().args[1]).toEqual(cards);
    expect(core.createGame.calls.mostRecent().args[7][1]).toEqual({ printingId: 'chs:21795', image: '/scans/duo/21795.png' });
  });
  it('does not invite a structurally valid opponent deck whose inventory is missing', async () => {
    const cards = [egg, ...copies(59)];
    await EconomyHolding.save(EconomyHolding.create({ userId: user.id, printingId: 'chs:21632', count: 1, printingJson: '{}' }));
    const mine = await Deck.save(Deck.create({ user, name: 'caller starter', cards: JSON.stringify(cards), isValid: true }));
    const target = await User.save(User.create({ name: 'energy-target-unowned', roleId: 2 }));
    const targetDeck = await Deck.save(Deck.create({ user: target, name: 'unowned target starter', cards: JSON.stringify(cards), isValid: true }));
    await User.update(target.id, { duoDeckId: targetDeck.id });
    const client: any = { id: 1, user }, invited: any = { id: 2, user: target };
    const core: any = { clients: [client, invited], games: [], createGame: jasmine.createSpy('createGame') };
    config.duo.enabled = true;
    const reply = jasmine.createSpy('reply');
    await (new CoreSocket(client, { addListener: () => undefined } as any, core, {} as any) as any)
      .createGame({ deckId: mine.id, clientId: invited.id, gameSettings: new GameSettings() }, reply);
    expect(reply.calls.mostRecent().args[0]).toBe('error');
    expect(core.createGame).not.toHaveBeenCalled();
  });
  it('invitation acceptance revalidates ordinary inventory with references omitted', async () => {
    const client: any = { id: 1, user };
    const prompt = new InvitePlayerPrompt(1, GameMessage.INVITATION_MESSAGE);
    const game: any = { id: 7, gameSettings: {}, state: { prompts: [prompt] }, expireInvitationIfNeeded: () => false,
      dispatch: jasmine.createSpy('dispatch') };
    const core: any = { clients: [client], games: [game] };
    const socket: any = { addListener: () => undefined };
    const reply = jasmine.createSpy('reply');
    await (new GameSocket(client, socket, core, {} as any) as any).resolvePrompt({ gameId: 7, id: prompt.id, result: [egg, ...copies(59)] }, reply);
    expect(reply.calls.mostRecent().args[0]).toBe('error');
    expect(game.dispatch).not.toHaveBeenCalled();
  });
  it('self-play validates both decks and cannot bypass inventory through its second deck', async () => {
    await EconomyHolding.save(EconomyHolding.create({ userId: user.id, printingId: 'chs:21632', count: 1, printingJson: '{}' }));
    const client: any = { id: 1, user };
    const core: any = { clients: [client], games: [], createSelfPlayGame: jasmine.createSpy('createSelfPlayGame') };
    const socket: any = { addListener: () => undefined };
    const reply = jasmine.createSpy('reply');
    await (new CoreSocket(client, socket, core, {} as any) as any).createSelfPlayGame({ deck: [egg, ...copies(59)], secondDeck: [egg, egg, ...copies(58)],
      gameSettings: new GameSettings() }, reply);
    expect(reply.calls.mostRecent().args[0]).toBe('error');
    expect(core.createSelfPlayGame).not.toHaveBeenCalled();
  });
  it('raw create/play refuse incomplete decks before the engine can terminate an existing game', async () => {
    const client: any = { id: 1, user };
    const core: any = { clients: [client], games: [], createGame: jasmine.createSpy('createGame') };
    const socket: any = { addListener: () => undefined };
    const reply = jasmine.createSpy('reply');
    await (new CoreSocket(client, socket, core, {} as any) as any).createGame({ deck: copies(59), gameSettings: new GameSettings() }, reply);
    expect(reply.calls.mostRecent().args[0]).toBe('error');
    expect(core.createGame).not.toHaveBeenCalled();
    const gameSocket: any = new GameSocket(client, socket, core, {} as any);
    gameSocket.dispatch = jasmine.createSpy('dispatch');
    await gameSocket.playGame({ gameId: 7, deck: copies(60) }, reply); // Full count, but no basic Pokémon.
    expect(reply.calls.mostRecent().args[0]).toBe('error');
    expect(gameSocket.dispatch).not.toHaveBeenCalled();
  });
  it('actual matchmaking rejects effect-only unowned cards before creating the game', async () => {
    const client: any = { id: 1, user };
    const opponent: any = { id: 2, user: { id: 999 } };
    const core: any = { clients: [client, opponent], createGameWithDecks: jasmine.createSpy('createGameWithDecks') };
    // Do not construct the service: its constructor starts an unrelated polling timer.
    const service: any = Object.create(MatchmakingService.prototype);
    service.core = core;
    service.queue = [client, opponent].map(c => ({ client: c, socketWrapper: { socket: { connected: true } },
      format: new GameSettings().format, deck: [egg, ...copies(59)], joinedAt: 0 }));
    service.buildArtworksMap = async () => ({});
    service.removeFromQueue = jasmine.createSpy('removeFromQueue');
    spyOn(console, 'log'); spyOn(console, 'error');
    await service.checkMatches();
    expect(core.createGameWithDecks).not.toHaveBeenCalled();
    expect(service.removeFromQueue.calls.count()).toBe(2);
  });
  it('per-copy art survives engine setup, moves, state serialization and persisted replay', () => {
    const cards = [egg, grassArt, ...copies(58)];
    const ids = [null, 'chs:21795', ...copies(58, 'free:grass')];
    const checked = validateDeckOwnership(cards, ids, [{ printingId: 'chs:21632', count: 1 }, { printingId: 'chs:21795', count: 1 }]);
    const state = setupPhaseReducer({ log: () => undefined } as any, new State(),
      new AddPlayerAction(1, 'appearance-player', checked.cards, undefined, 1, undefined, checked.appearances));
    const player = state.players[0];
    const hidden = StateSanitizer.sanitizeForViewer(state, { playerId: 1, roleId: 2 });
    // New per-copy fields must not leak the hidden deck edition on the wire.
    expect(new StateSerializer().serialize(hidden)).not.toContain('chs:21795');
    expect(new StateSerializer().serialize(hidden)).not.toContain('free:grass');
    const collector = player.deck.cards[1];
    const free = player.deck.cards[2];
    expect(collector.fullName).toBe(grassArt);
    expect(free.fullName).toBe(grass);
    player.hand.cards.push(...player.deck.cards.splice(1, 1));
    const serializer = new StateSerializer();
    const restored = serializer.deserialize(serializer.serialize(state));
    expect(restored.players[0].hand.cards[0].printingId).toBe('chs:21795');
    expect(restored.players[0].hand.cards[0].printingImage).toBe('/scans/duo/21795.png');
    const replay = new Replay(); replay.appendState(state);
    player.active.energies.cards.push(...player.hand.cards.splice(0, 1));
    replay.appendState(state);
    const replayFromDisk = new Replay(); replayFromDisk.deserialize(replay.serialize());
    expect(replayFromDisk.getState(0).players[0].hand.cards[0].printingImage).toBe('/scans/duo/21795.png');
    expect(replayFromDisk.getState(0).players[0].deck.cards[1].printingImage).toBe('/scans/duo/12651.png');
    expect(replayFromDisk.getState(1).players[0].active.energies.cards[0].printingId).toBe('chs:21795');
    expect(replayFromDisk.getState(1).players[0].active.energies.cards[0].printingImage).toBe('/scans/duo/21795.png');
  });
});
