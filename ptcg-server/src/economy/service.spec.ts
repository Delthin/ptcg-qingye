import * as express from 'express';
import * as http from 'http';
import { existsSync, mkdtempSync, unlinkSync, rmdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { Storage, User, EconomyAccount, EconomyCoin, EconomyHolding, EconomyPack, EconomyRecord, Deck } from '../storage';
import { Economy as EconomyController } from '../backend/controllers/economy';
import { AuthToken, generateToken } from '../backend/services/auth-token';
import { privateDuoAsset } from '../backend/services/duo-session';
import { config } from '../config';
import { EconomyService, economyTransaction, checkInDay } from './service';
import { drawPack, productById, printingById, products, validateCatalog, Printing } from './catalog';
import { CardManager } from '../game/cards/card-manager';
import { DeckAnalyser } from '../game';
import { FREE_BASIC_ENERGIES } from '../game/store/card/free-basic-energy';
import { playableStoredDeck, validateDeckOwnership } from './deck-ownership';
import type { Card } from '../game';

// Some upstream trees ship a broken JS twin next to the real TS source. Only override
// that twin when both files exist; clean source trees and compiled output need no shim.
const expShareSource = join(__dirname, '../sets/10-scarlet-and-violet/set-scarlet-and-violet/exp-share.ts');
const staleCompiled = expShareSource.replace(/\.ts$/, '.js');
if (existsSync(expShareSource) && existsSync(staleCompiled)) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require.cache[staleCompiled] = {
    id: staleCompiled, filename: staleCompiled, loaded: true, exports: require(expShareSource),
  } as any;
}
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sets: { [key: string]: Card[] } = require('../sets');

describe('persistent duo economy (isolated SQLite)', () => {
  const storage = new Storage();
  let admin: User, member: User, other: User, banned: User;
  let server: http.Server;
  let port: number;
  let directory: string;
  let database: string;
  const previousDuoMode = config.duo.enabled;
  const run = <T>(task: (service: EconomyService) => Promise<T>) => economyTransaction(storage.manager.connection, manager => task(new EconomyService(manager)));
  const request = (path: string, user?: User, body?: unknown, cookie?: string): Promise<{ status: number; body: any }> => new Promise((resolve, reject) => {
    const data = body === undefined ? '' : JSON.stringify(body);
    const headers: { [key: string]: string | number } = { 'Content-Type': 'application/json' };
    if (user) headers['Auth-Token'] = generateToken(user.id);
    if (cookie) headers.Cookie = cookie;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    const req = http.request({ hostname: '127.0.0.1', port, path: `/v1/duo/economy${path}`, method: body === undefined ? 'GET' : 'POST', headers }, res => {
      let text = ''; res.on('data', c => text += c); res.on('end', () => resolve({ status: res.statusCode!, body: JSON.parse(text) }));
    });
    req.on('error', reject); req.end(data);
  });
  beforeAll(async () => {
    process.env.STORAGE_TYPE = 'sqlite';
    directory = mkdtempSync(join(tmpdir(), 'ptcg-economy-'));
    database = join(directory, 'test.sq3');
    process.env.STORAGE_DATABASE = database;
    process.env.secret = 'isolated-economy-test-signing-secret';
    // Buying a prebuilt deck runs the real deck analyser, so the card pool must be loaded.
    const cardManager = CardManager.getInstance();
    const unique = new Map<string, Card>();
    for (const [name, cards] of Object.entries(sets)) {
      if (!name.startsWith('set') || !Array.isArray(cards)) continue;
      for (const card of cards as Card[]) if (!unique.has(card.fullName)) unique.set(card.fullName, card);
    }
    cardManager.defineSet([...unique.values()]);
    await storage.connect();
    [admin, member, other, banned] = await User.save([
      User.create({ name: 'economy-admin', roleId: 4 }), User.create({ name: 'economy-member' }),
      User.create({ name: 'economy-other' }), User.create({ name: 'economy-banned', roleId: 1 }),
    ]);
    const app = express(); app.use(express.json());
    config.duo.enabled = true;
    app.get('/v1/duo/economy/asset-check', privateDuoAsset, (_req, res) => res.send({ ok: true }));
    const protectedHandler: PropertyDescriptor = { value: (_req: express.Request, res: express.Response) => res.send({ ok: true }) };
    AuthToken()({}, 'testHandler', protectedHandler);
    app.get('/v1/duo/economy/auth-check', protectedHandler.value);
    new EconomyController('/v1/duo/economy', app, storage, {} as any).init();
    server = app.listen(0, '127.0.0.1');
    await new Promise<void>(resolve => server.on('listening', resolve));
    port = (server.address() as import('net').AddressInfo).port;
  });
  beforeEach(async () => {
    await Deck.clear();
    await EconomyRecord.clear(); await EconomyCoin.clear(); await EconomyPack.clear(); await EconomyHolding.clear(); await EconomyAccount.clear();
  });
  afterAll(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
    await storage.disconnect();
    unlinkSync(database); rmdirSync(directory);
    config.duo.enabled = previousDuoMode;
  });

  const assertPlayableRecipe = async (row: Deck) => {
    const recipe = products.flatMap(p => [
      ...(p.decks || []), ...(p.deckCards ? [{ name: p.deckName || p.name, cards: p.deckCards }] : []),
    ]).find(d => row.name === d.name || row.name.startsWith(`${d.name} · `))!;
    expect(recipe).toBeDefined();
    const expectedCards = recipe.cards.flatMap(c => Array.from({ length: c.count }, () => printingById.get(c.printingId)!.engineFullName));
    const expectedRefs = recipe.cards.flatMap(c => Array.from({ length: c.count }, () =>
      FREE_BASIC_ENERGIES.find(p => p.sourcePrintingId === c.printingId)?.printingId || c.printingId));
    expect(JSON.parse(row.cards)).toEqual(expectedCards);
    expect(JSON.parse(row.printingIds!)).toEqual(expectedRefs);
    const playable = await playableStoredDeck(row.user.id, row.id);
    expect(playable.cards).toEqual(expectedCards as string[]);
    expect(playable.printingIds).toEqual(expectedRefs);
  };
  it('uses Beijing day boundaries, independent of the host timezone', () => {
    expect(checkInDay(Date.parse('2026-10-08T15:59:59Z'))).toBe('2026-10-08');
    expect(checkInDay(Date.parse('2026-10-08T16:00:00Z'))).toBe('2026-10-09');
  });
  it('rejects anonymous, banned and ordinary admin calls, and ignores forged body userId', async () => {
    expect((await request('')).status).toBe(403);
    expect((await request('', banned)).status).toBe(403);
    expect((await request('/admin/users', member)).status).toBe(403);
    expect((await request('/admin/catalog', member)).status).toBe(403);
    expect((await request('/admin/user?targetUserId=' + admin.id, member)).status).toBe(403);
    expect((await request('/admin/grant', member, { userId: admin.id, targetUserId: member.id, amountMinor: 100, reason: 'forged' })).status).toBe(403);
    const ordinary = await request('/check-in', member, { userId: admin.id });
    expect(ordinary.body.snapshot.userId).toBe(member.id);
    expect((await run(s => s.snapshot(admin.id))).balanceMinor).toBe(0);
  });
  it('revokes deleted-account tokens and cookies without signing out retained users', async () => {
    const removed = await User.save(User.create({ name: 'RetiredTokenProbe' }));
    const cookie = `ptcg_room=${encodeURIComponent(generateToken(removed.id))}`;
    expect((await request('/asset-check', undefined, undefined, cookie)).status).toBe(200);
    expect((await request('/auth-check', removed)).status).toBe(200);
    await User.delete(removed.id);
    expect((await request('/asset-check', undefined, undefined, cookie)).status).toBe(403);
    expect((await request('/auth-check', removed)).status).toBe(403);
    expect((await request('/auth-check', member)).status).toBe(200);
    expect((await request('/asset-check', member)).status).toBe(200);
  });
  it('initializes zero balance without gifting existing free-practice decks and claims at most once', async () => {
    const initial = await run(s => s.snapshot(other.id));
    expect(initial.balanceMinor).toBe(0); expect(initial.holdings.length).toBe(0);
    const claims = await Promise.all(Array.from({ length: 5 }, () => run(s => s.checkIn(other.id))));
    claims.forEach(c => expect(c.snapshot.balanceMinor).toBe(2000));
    expect(await EconomyRecord.count({ where: { userId: other.id, kind: 'check-in' } })).toBe(1);
    await EconomyAccount.update(other.id, { lastClaimDay: '2000-01-01' });
    expect((await run(s => s.checkIn(other.id))).snapshot.balanceMinor).toBe(4000);
  });
  it('grants money and exact printing quantities together, logs actor/reason and never leaks credentials', async () => {
    await run(s => s.checkIn(member.id));
    const printingId = 'chs:21632'; // 30thC 001/103, exact printing fixture.
    const result = await request('/admin/grant', admin, { targetUserId: member.id, amountMinor: 100000,
      cards: [{ printingId, count: 3 }], reason: '朋友测试资源' });
    expect(result.status).toBe(200);
    expect(result.body.snapshot.holdings.find((c: any) => c.printingId === printingId).count).toBe(3);
    expect(result.body.snapshot.balanceMinor).toBe(102000);
    const record = await EconomyRecord.findOne({ where: { userId: member.id, kind: 'grant' } });
    expect(record!.actorId).toBe(admin.id); expect(record!.label).toContain('朋友测试资源');
    const users = await request('/admin/users?q=economy-member', admin);
    expect(users.body.users.length).toBe(1);
    expect(Object.keys(users.body.users[0]).sort()).toEqual(['balanceMinor', 'holdingCount', 'lastSeen', 'name', 'packCount', 'roleId', 'userId'].sort());
    const before = result.body.snapshot.balanceMinor;
    const bad = await request('/admin/grant', admin, { targetUserId: member.id, amountMinor: 500, cards: [{ printingId: 'missing', count: 1 }], reason: 'bad' });
    expect(bad.status).toBe(400); expect((await run(s => s.snapshot(member.id))).balanceMinor).toBe(before);
    expect((await request('/admin/grant', admin, { targetUserId: member.id, amountMinor: -1, reason: 'bad' })).status).toBe(400);
  });
  it('purchases atomically, survives concurrent low-balance purchases and rejects altered price/quantity', async () => {
    await run(s => s.snapshot(other.id));
    await EconomyAccount.update(other.id, { balanceMinor: 1000 });
    const results = await Promise.all([request('/purchase', other, { productId: 'glory-5', quantity: 1, priceMinor: 0 }),
      request('/purchase', other, { productId: 'glory-5', quantity: 1 })]);
    expect(results.map(r => r.status).sort()).toEqual([200, 400]);
    const snapshot = await run(s => s.snapshot(other.id));
    expect(snapshot.balanceMinor).toBe(0); expect(snapshot.packs.length).toBe(1);
    expect((await request('/purchase', other, { productId: 'glory-5', quantity: 0.5 })).status).toBe(400);
    expect((await request('/purchase', other, { productId: 'missing', quantity: 1 })).status).toBe(400);
    expect((await run(s => s.snapshot(other.id))).packs.length).toBe(1);
  });
  it('rolls back the debit and partial inventory when pack creation fails', async () => {
    await run(s => s.grant(admin.id, member.id, 100000, undefined, '回滚测试'));
    const product = productById.get('master-CSVM2bC')!;
    const original = product.includedPacks;
    const before = await run(s => s.snapshot(member.id));
    product.includedPacks = [{ productId: 'missing-pack', count: 1 }];
    try {
      expect((await request('/purchase', member, { productId: product.id, quantity: 1 })).status).toBe(500);
    } finally { product.includedPacks = original; }
    const after = await run(s => s.snapshot(member.id));
    expect(after.balanceMinor).toBe(before.balanceMinor); expect(after.holdings).toEqual(before.holdings);
    expect(after.packs).toEqual(before.packs);
  });
  it('delivers a 60-card deck plus a 15-card upgrade pack and four fat packs, and enforces the per-user limit', async () => {
    await run(s => s.grant(admin.id, member.id, 100000, undefined, '预组测试'));
    const productId = 'master-CSVM2bC';
    const before = await run(s => s.snapshot(member.id));
    const result = await request('/purchase', member, { productId, quantity: 1 });
    if (result.status !== 200) console.log('PURCHASE-ERROR', JSON.stringify(result.body));
    expect(result.status).toBe(200);
    const snapshot = result.body.snapshot;
    expect(snapshot.balanceMinor).toBe(before.balanceMinor - 30900);
    // 卡组本体不再以成品入账：它是一件未拆封预组；改造包（15 张）与 4 包共逐荣光也是未拆封。
    expect(snapshot.holdings.reduce((sum: number, c: any) => sum + c.count, 0) - before.holdings.reduce((sum, c) => sum + c.count, 0)).toBe(0);
    expect(snapshot.packs.length - before.packs.length).toBe(6);
    const upgradePack = snapshot.packs.find((p: any) => p.productId === 'master-pack-CSVM2bC');
    expect(upgradePack).toBeDefined();
    expect(upgradePack.deck).toBe(false);
    const deckEntry = snapshot.packs.find((p: any) => p.productId === productId);
    expect(deckEntry.deck).toBe(true);
    // 未拆封清单里只有商品名：拆开前拿不到卡组名或配方。
    expect(Object.keys(deckEntry).sort().join()).toBe('deck,id,name,productId');
    const opened = await run(s => s.open(member.id, [upgradePack!.id]));
    expect(opened.opening.cards.length).toBe(15);
    expect(opened.opening.cards.every((c: any) => !!printingById.get(c.printingId)!.engineFullName)).toBe(true);
    // 商品仍标记 prebuiltDeck，但拆开前不会建卡组。
    expect(snapshot.products.find((p: any) => p.id === productId).prebuiltDeck).toBe(true);
    expect((await Deck.find({ where: { user: { id: member.id } } })).length).toBe(0);
    // 拆开封套：60 张卡进收藏，卡组本体进卡组管理。
    const beforeDeck = await run(s => s.snapshot(member.id));
    const revealed = await run(s => s.open(member.id, [deckEntry!.id])) as any;
    expect(revealed.opening.kind).toBe('deck');
    expect(revealed.opening.deckId).toBeTruthy();
    expect(revealed.opening.productId).toBe(productId);
    expect(revealed.opening.cards.reduce((n: number, c: any) => n + c.count, 0)).toBe(60);
    expect(revealed.snapshot.holdings.reduce((sum: number, c: any) => sum + c.count, 0) - beforeDeck.holdings.reduce((sum: number, c: any) => sum + c.count, 0)).toBe(60);
    // 同一件未拆封不能拆第二次。
    expect((await request('/open', member, { packIds: [deckEntry!.id] })).body.error).toBe('ECONOMY_PACK');
    const decks = await Deck.find({ where: { user: { id: member.id } } });
    expect(decks.length).toBe(1);
    expect(decks[0].isValid).toBe(true);
    expect(JSON.parse(decks[0].cards).length).toBe(60);
    decks[0].user = member;
    await assertPlayableRecipe(decks[0]);
    expect((await request('/purchase', member, { productId, quantity: 1 })).status).toBe(400);
    expect((await run(s => s.snapshot(member.id))).balanceMinor).toBe(revealed.snapshot.balanceMinor);
    expect((await Deck.find({ where: { user: { id: member.id } } })).length).toBe(1);
  });
  it('hands a new trainer one official prebuilt starter deck with its cards', async () => {
    const before = await run(s => s.snapshot(other.id));
    const decksBefore = (await Deck.find({ where: { user: { id: other.id } } })).length;
    const holdingsBefore = before.holdings.reduce((sum: number, c: any) => sum + c.count, 0);
    const giftTxBefore = before.transactions.filter((t: any) => t.label.startsWith('新手礼包')).length;
    const giftedBefore = (await Deck.find({ where: { user: { id: other.id } } }))
      .filter(r => r.name.startsWith('嗨皮预组 ·') || r.name.startsWith('对战派对预组 ·')).length;
    const deck = await run(s => s.giftRandomStarter(other.id));
    expect(deck).toBeTruthy();
    const after = await run(s => s.snapshot(other.id));
    expect(after.balanceMinor).toBe(before.balanceMinor);
    // 新手礼包 = 一套嗨皮组合预组 + 一套对战派对预组，两套 60 张卡组与卡牌一起进账号（各 60 张）。
    expect(after.holdings.reduce((sum: number, c: any) => sum + c.count, 0) - holdingsBefore).toBe(120);
    expect(after.transactions.filter((t: any) => t.label.startsWith('新手礼包')).length - giftTxBefore).toBe(2);
    const rows = await Deck.find({ where: { user: { id: other.id } } });
    const gifted = rows.filter(r => r.name.startsWith('嗨皮预组 ·') || r.name.startsWith('对战派对预组 ·'));
    expect(rows.length - decksBefore).toBe(2);
    expect(gifted.length - giftedBefore).toBe(2);
    for (const row of gifted) {
      expect(row.isValid).toBe(true);
      expect(JSON.parse(row.cards).length).toBe(60);
      row.user = other;
      await assertPlayableRecipe(row);
    }
  });
  it('sells official random prebuilt products unopened: one entry per purchase, repeatable, revealed on open', async () => {
    await run(s => s.grant(admin.id, other.id, 10000, undefined, '随机预组测试'));
    const happy = products.find(p => p.id.startsWith('happy-') && p.kind === 'starter' && !p.wholeBox && (p.decks?.length ?? 0) > 1)!;
    const party = products.find(p => p.id.startsWith('party-'))!;
    const before = await run(s => s.snapshot(other.id));
    const decksBefore = (await Deck.find({ where: { user: { id: other.id } } })).length;
    // 官方单品不限购，可以重复购买；每次购买多一件未拆封，抽到哪一套在拆开前不告诉玩家。
    for (let i = 0; i < 3; i++) {
      const result = await run(s => s.purchase(other.id, happy.id, 1)) as any;
      expect(result.unopenedDecks).toBe(1);
    }
    const afterBuy = await run(s => s.snapshot(other.id));
    expect(afterBuy.balanceMinor).toBe(before.balanceMinor - happy.priceMinor * 3);
    expect(afterBuy.transactions.filter((t: any) => t.label === `购买 ${happy.name} × 1`).length).toBe(3);
    const entries = afterBuy.packs.filter((p: any) => p.productId === happy.id);
    expect(entries.length).toBe(3);
    expect(entries.every((p: any) => p.deck === true)).toBe(true);
    // 未拆封不入收藏、不建卡组，清单里也没有卡组名。
    expect(afterBuy.holdings.reduce((sum, c: any) => sum + c.count, 0)).toBe(before.holdings.reduce((sum, c: any) => sum + c.count, 0));
    expect((await Deck.find({ where: { user: { id: other.id } } })).length).toBe(decksBefore);
    let revealedCards = 0;
    for (const entry of entries) {
      const revealed = await run(s => s.open(other.id, [entry.id])) as any;
      expect(revealed.opening.kind).toBe('deck');
      expect(revealed.opening.productId).toBe(happy.id);
      expect(revealed.opening.productName).toBe(happy.name);
      // 拆开才知道哪一套：抽到的必须是卡组池里的一款完整 60 张卡组。
      expect(happy.decks!.some(d => revealed.opening.deckName.startsWith(d.name))).toBe(true);
      expect(revealed.opening.cards.reduce((n: number, c: any) => n + c.count, 0)).toBe(60);
      revealedCards += 60;
    }
    const afterOpen = await run(s => s.snapshot(other.id));
    expect(afterOpen.holdings.reduce((sum, c: any) => sum + c.count, 0) - before.holdings.reduce((sum, c: any) => sum + c.count, 0)).toBe(revealedCards);
    expect((await Deck.find({ where: { user: { id: other.id } } })).length - decksBefore).toBe(3);
    const partyResult = await run(s => s.purchase(other.id, party.id, 1)) as any;
    expect(partyResult.unopenedDecks).toBe(1);
    const partyEntry = partyResult.snapshot.packs.find((p: any) => p.productId === party.id);
    const partyRevealed = await run(s => s.open(other.id, [partyEntry.id])) as any;
    expect(party.decks!.some(d => partyRevealed.opening.deckName.startsWith(d.name))).toBe(true);
    for (const row of await Deck.find({ where: { user: { id: other.id } } })) {
      expect(JSON.parse(row.cards).length).toBe(60);
      row.user = other;
      await assertPlayableRecipe(row);
    }
  });
  it('keeps every published prebuilt deck a legal 60-card deck for the engine', () => {
    const decks = products.flatMap(p => (p.decks || []).map(d => ({ product: p.id, ...d })));
    // 24 款嗨皮单品 + 同样的24款放在整盒里 + 19副对战派对。
    expect(decks.length).toBe(67);
    for (const deck of decks) {
      const cards = deck.cards.flatMap(c => {
        const printing = printingById.get(c.printingId)!;
        return Array.from({ length: c.count }, () => printing.engineFullName!);
      });
      expect(cards.length).toBe(60);
      // 引擎自己的合法性判定：牌组构成（数量上限、进化线、能量）必须真的能打，
      // 而不是只看 60 张能不能凑出来。
      expect({ deck: `${deck.product} ${deck.name}`, valid: new DeckAnalyser(cards).isValid() })
        .toEqual({ deck: `${deck.product} ${deck.name}`, valid: true });
    }
  });
  it('preserves per-copy refs through analysis for every gift/purchase recipe, including fixed master decks', () => {
    const recipes = products.flatMap(p => [...(p.decks || []).map(d => d.cards), ...(p.deckCards ? [p.deckCards] : [])]);
    for (const recipe of recipes) {
      const cards = recipe.flatMap(c => Array.from({ length: c.count }, () => printingById.get(c.printingId)!.engineFullName!));
      const refs = recipe.flatMap(c => Array.from({ length: c.count }, () => c.printingId));
      const before = cards.slice();
      const checked = validateDeckOwnership(cards, refs, recipe);
      const analyser = new DeckAnalyser(checked.cards);
      expect(analyser.isValid()).toBe(true);
      analyser.getDeckType();
      expect(cards).toEqual(before);
      expect(checked.cards).toEqual(before);
      checked.printingIds.forEach((ref, i) => {
        const effect = FREE_BASIC_ENERGIES.find(p => p.printingId === ref)?.engineFullName || printingById.get(ref!)?.engineFullName;
        expect(effect).toBe(before[i]);
      });
    }
  });
  it('sells the official whole box as one purchase with every deck unopened', async () => {
    await run(s => s.grant(admin.id, other.id, 40000, undefined, '整盒测试'));
    const box = products.find(p => p.wholeBox)!;
    expect(box.decks!.length).toBeGreaterThan(1);
    expect(box.priceMinor).toBe(8800);  // 官方整盒价 88 游戏元
    const before = await run(s => s.snapshot(other.id));
    const result = await run(s => s.purchase(other.id, box.id, 1)) as any;
    const after = await run(s => s.snapshot(other.id));
    // 整盒 = 池内全部卡组各一套，每套都是一件未拆封；另外 9 包附送包同样是未拆封。
    expect(after.balanceMinor).toBe(before.balanceMinor - box.priceMinor);
    const deckEntries = after.packs.filter((p: any) => p.productId === box.id);
    expect(deckEntries.length).toBe(box.decks!.length);
    expect(deckEntries.every((p: any) => p.deck === true)).toBe(true);
    expect(after.packs.length - before.packs.length).toBe(box.decks!.length + 9);
    expect(result.unopenedDecks).toBe(box.decks!.length);
    // 拆开前卡牌与卡组都不入账。
    expect(after.holdings).toEqual(before.holdings);
    expect((await Deck.find({ where: { user: { id: other.id } } })).length).toBe(0);
    let gained = 0;
    const names = new Set<string>();
    for (const entry of deckEntries) {
      const revealed = await run(s => s.open(other.id, [entry.id])) as any;
      gained += revealed.opening.cards.reduce((n: number, c: any) => n + c.count, 0);
      names.add(revealed.opening.deckName);
    }
    // 整套拆完正好是池内每一套各一份，卡牌数按盒内套数整数倍增加。
    expect(names.size).toBe(new Set(box.decks!.map(d => d.name)).size);
    expect(gained).toBe(box.decks!.reduce((n, d) => n + d.cards.reduce((m, c) => m + c.count, 0), 0));
    const settled = await run(s => s.snapshot(other.id));
    expect(settled.holdings.reduce((sum: number, c: any) => sum + c.count, 0) - before.holdings.reduce((sum: number, c: any) => sum + c.count, 0)).toBe(gained);
    expect((await Deck.find({ where: { user: { id: other.id } } })).length).toBe(box.decks!.length);
    for (const row of await Deck.find({ where: { user: { id: other.id } } })) {
      row.user = other;
      await assertPlayableRecipe(row);
    }
  });
  it('opens server-owned packs once, rejects foreign/duplicate packs and persists retrievable results', async () => {
    await run(s => s.grant(admin.id, other.id, 1000, undefined, '开包测试'));
    await run(s => s.purchase(other.id, 'glory-5', 1));
    const before = await run(s => s.snapshot(other.id));
    const packId = before.packs[0].id;
    expect((await request('/open', member, { packIds: [packId] })).status).toBe(400);
    expect((await request('/open', other, { packIds: [packId, packId] })).status).toBe(400);
    const result = await request('/open', other, { packIds: [packId] });
    expect(result.status).toBe(200); expect(result.body.opening.cards.length).toBe(5);
    expect(result.body.opening.kind).toBe('pack');
    expect(result.body.snapshot.holdings.reduce((sum: number, c: any) => sum + c.count, 0)).toBe(5);
    expect(result.body.snapshot.packs.length).toBe(0);
    expect((await request('/open', other, { packIds: [packId] })).status).toBe(400);
    const readback = await request('/opening?openingId=' + result.body.opening.id, other);
    expect(readback.body.opening).toEqual(result.body.opening);
    expect((await request('/opening?openingId=' + result.body.opening.id, member)).status).toBe(404);
    const persisted = await EconomyPack.findOne(packId);
    expect(persisted!.openingId).toBe(result.body.opening.id);
  });
  it('reserves exactly one 30th basic energy and one Pikachu without changing published group shares', () => {
    const recipe = productById.get('30th-6')!.recipe!;
    const slots = recipe.slots!;
    expect(slots.map(s => s.count)).toEqual([1, 1, 4]);
    expect(slots[0].groups.every(g => g.printingIds.every(id => printingById.get(id)!.rarity === '皮卡丘'))).toBe(true);
    expect(slots[1].groups.every(g => g.printingIds.every(id => printingById.get(id)!.basicEnergy))).toBe(true);
    expect(slots[1].groups.flatMap(g => g.printingIds).length).toBe(8);
    // 检查全部候选卡，而不是依赖随机抽样刚好没撞到能量。
    for (const group of slots[2].groups) for (const id of group.printingIds) {
      expect(printingById.get(id)!.basicEnergy).toBe(false);
      expect(printingById.get(id)!.rarity).not.toBe('皮卡丘');
    }
    const total = slots[2].groups.reduce((sum, g) => sum + g.weight, 0);
    const expectedShares = slots[2].groups.map((g, i) => ((i === 0 ? 2 : 0) + 4 * g.weight / total) / 6 * 100);
    expectedShares.forEach((share, i) => expect(share).toBeCloseTo([89.83, 9.17, 1][i], 8));
    for (const rng of [(n: number) => 0, (n: number) => n - 1]) {
      const cards = drawPack(recipe, rng);
      expect(cards.length).toBe(6);
      expect(cards.filter(c => c.basicEnergy).length).toBe(1);
      expect(cards.filter(c => c.rarity === '皮卡丘').length).toBe(1);
    }
  });
  it('repairs legacy unopened 30th recipes and keeps their revealed results immutable', async () => {
    await run(s => s.grant(admin.id, other.id, 10000, undefined, '旧周年包回归'));
    const purchased = await run(s => s.purchase(other.id, '30th-6', 1));
    const entry = purchased.snapshot.packs[0];
    const pikachu = [...printingById.values()].find(c => c.set === '30thC' && c.rarity === '皮卡丘')!;
    const energy = [...printingById.values()].find(c => c.set === '30thC' && c.basicEnergy)!;
    // 旧配方确实允许随机卡位连续抽出能量；这里让它必出五张，以免回归测试靠运气。
    const legacy = { slots: [
      { count: 1, groups: [{ weight: 1, printingIds: [pikachu.printingId] }] },
      { count: 5, groups: [{ weight: 1, printingIds: [energy.printingId] }] },
    ] };
    await EconomyPack.update(entry.id, { recipeJson: JSON.stringify(legacy) });
    await storage.disconnect(); await storage.connect();
    const opened = await run(s => s.open(other.id, [entry.id]));
    expect(opened.opening.cards.length).toBe(6);
    expect(opened.opening.cards.filter(c => c.basicEnergy).length).toBe(1);
    expect(opened.opening.cards.filter(c => c.rarity === '皮卡丘').length).toBe(1);
    expect(JSON.parse((await EconomyPack.findOne(entry.id))!.recipeJson)).toEqual(productById.get('30th-6')!.recipe);
    expect((await request('/open', other, { packIds: [entry.id] })).status).toBe(400);
    expect((await run(s => s.opening(other.id, opened.opening.id))).opening).toEqual(opened.opening);
  });
  it('delivers both official 30th Eevee decks at 99 yuan each with two unopened anniversary packs', async () => {
    await run(s => s.grant(admin.id, other.id, 100000, undefined, '周年预组测试'));
    const variants = [
      { id: '30th-deck-espeon', name: '太阳伊布ex', engine: 'Espeon ex 30C 014/040' },
      { id: '30th-deck-umbreon', name: '月亮伊布ex', engine: 'Umbreon ex 30C' },
    ];
    for (const variant of variants) {
      const product = productById.get(variant.id)!;
      expect(product.priceMinor).toBe(9900);
      expect(product.decks).toBeUndefined();
      expect(product.includedPacks).toEqual([{ productId: '30th-6', count: 2 }]);
      const cover = printingById.get(product.deckCards![0].printingId)!;
      expect(cover.name).toBe(variant.name);
      expect(cover.engineFullName).toBe(variant.engine);
      expect(product.deckCards![0].count).toBe(2);
      const purchase = await run(s => s.purchase(other.id, variant.id, 1));
      expect(purchase.unopenedDecks).toBe(1);
      const entry = purchase.snapshot.packs.find(p => p.productId === variant.id)!;
      const revealed = await run(s => s.open(other.id, [entry.id]));
      expect(revealed.opening.kind).toBe('deck');
      if (revealed.opening.kind !== 'deck') throw new Error('Expected an anniversary prebuilt deck');
      expect(revealed.opening.cards.reduce((sum, c) => sum + c.count, 0)).toBe(60);
      expect(revealed.opening.cards.filter(c => c.basicEnergy).reduce((sum, c) => sum + c.count, 0)).toBe(18);
      const deck = (await Deck.findOne(revealed.opening.deckId!))!;
      expect(deck.isValid).toBe(true);
      deck.user = other;
      await assertPlayableRecipe(deck);
    }
    const snapshot = await run(s => s.snapshot(other.id));
    expect(snapshot.balanceMinor).toBe(80200);
    expect(snapshot.holdings.reduce((sum, c) => sum + c.count, 0)).toBe(120);
    expect(snapshot.packs.length).toBe(4);
    expect(snapshot.packs.every(p => p.productId === '30th-6' && !p.deck)).toBe(true);
  });
  it('keeps unopened prebuilt decks separate from packs on open', async () => {
    await run(s => s.grant(admin.id, other.id, 10000, undefined, '未拆封规则测试'));
    const happy = products.find(p => p.id.startsWith('happy-') && p.kind === 'starter' && !p.wholeBox && (p.decks?.length ?? 0) > 1)!;
    const bought = await run(s => s.purchase(other.id, happy.id, 2)) as any;
    await run(s => s.purchase(other.id, 'glory-5', 1));
    const snapshot = await run(s => s.snapshot(other.id));
    const deckEntries = snapshot.packs.filter((p: any) => p.deck === true);
    const packEntry = snapshot.packs.find((p: any) => p.productId === 'glory-5')!;
    expect(bought.unopenedDecks).toBe(2);
    expect(deckEntries.length).toBe(2);
    // 预组与卡包不能混在一批里拆：一次只能揭晓一种结果。
    expect((await request('/open', other, { packIds: [deckEntries[0].id, packEntry.id] })).body.error).toBe('ECONOMY_INVALID');
    // 一次也只拆一件预组。
    expect((await request('/open', other, { packIds: [deckEntries[0].id, deckEntries[1].id] })).body.error).toBe('ECONOMY_INVALID');
    // 别人的未拆封拆不了，不存在的编号也不行。
    expect((await request('/open', member, { packIds: [deckEntries[0].id] })).status).toBe(400);
    expect((await request('/open', other, { packIds: ['0'.repeat(32)] })).status).toBe(400);
    const revealed = await run(s => s.open(other.id, [deckEntries[0].id])) as any;
    expect(revealed.opening.kind).toBe('deck');
    expect(revealed.opening.deckId).toBeGreaterThan(0);
    expect(revealed.opening.cover).toBeTruthy();
    // 拆封结果可回读，且与刚返回的一致。
    expect((await run(s => s.opening(other.id, revealed.opening.id))).opening).toEqual(revealed.opening);
    // 剩下那件预组仍然完好，卡包也没被牵连。
    const left = await run(s => s.snapshot(other.id));
    expect(left.packs.length).toBe(2);
    expect(left.packs.filter((p: any) => p.deck === true).length).toBe(1);
    expect((await request('/open', other, { packIds: [packEntry.id] })).status).toBe(200);
  });
  it('persists wallet, purchases, consumed packs and holdings across database reconnect without changing old users', async () => {
    await run(s => s.grant(admin.id, other.id, 5000, undefined, '持久化测试'));
    const purchase = await run(s => s.purchase(other.id, '30th-6', 1));
    const opened = await run(s => s.open(other.id, [purchase.snapshot.packs[0].id]));
    await storage.disconnect();
    await storage.connect();
    const readback = await run(s => s.snapshot(other.id));
    expect(readback.balanceMinor).toBe(3200);
    expect(readback.holdings.reduce((sum, c) => sum + c.count, 0)).toBe(6);
    expect(readback.packs.length).toBe(0);
    expect(readback.products.find(p => p.id === '30th-6')!.purchased).toBe(1);
    expect((await run(s => s.opening(other.id, opened.opening.id))).opening).toEqual(opened.opening);
    expect((await User.findOne(admin.id))!.roleId).toBe(4);
    expect((await User.findOne(other.id))!.name).toBe('economy-other');
  });
  it('persists an unopened prebuilt recipe across reconnect and delivers it exactly once on open', async () => {
    // Fixed master deck: no random draw can make the persistence expectation change.
    const product = productById.get('master-CSVM2bC')!;
    const recipe = { name: product.deckName || product.name, cards: product.deckCards! };
    expect(recipe.cards.reduce((n, card) => n + card.count, 0)).toBe(60);
    await run(s => s.grant(admin.id, other.id, 100000, undefined, '未拆封预组重连测试'));
    const purchased = await run(s => s.purchase(other.id, product.id, 1));
    const entry = purchased.snapshot.packs.find(p => p.productId === product.id)!;
    expect(entry.deck).toBe(true);
    expect(purchased.snapshot.balanceMinor).toBe(100000 - product.priceMinor);
    expect(purchased.snapshot.holdings).toEqual([]);
    expect(await Deck.count({ where: { user: { id: other.id } } })).toBe(0);
    const stored = (await EconomyPack.findOne(entry.id))!;
    expect(JSON.parse(stored.deckJson!)).toEqual(recipe);
    expect(stored.recipeJson).toBe('');
    expect(stored.openedAt).toBeNull();
    expect(stored.openingId).toBeNull();

    await storage.disconnect();
    await storage.connect();
    const column = (await storage.manager.query('PRAGMA table_info(economy_pack)'))
      .find((c: any) => c.name === 'deckJson');
    expect(column.type.toUpperCase()).toBe('TEXT');
    expect(column.notnull).toBe(0);
    const reconnected = (await EconomyPack.findOne(entry.id))!;
    expect(reconnected.deckJson).toBe(stored.deckJson);
    expect(JSON.parse(reconnected.deckJson!)).toEqual(recipe);
    expect(reconnected.recipeJson).toBe('');
    expect(reconnected.openedAt).toBeNull();
    expect(reconnected.openingId).toBeNull();
    const unopened = await run(s => s.snapshot(other.id));
    expect(unopened.balanceMinor).toBe(purchased.snapshot.balanceMinor);
    expect(unopened.packs).toEqual(purchased.snapshot.packs);
    expect(unopened.holdings).toEqual([]);
    expect(await EconomyHolding.count({ where: { userId: other.id } })).toBe(0);
    expect(await Deck.count({ where: { user: { id: other.id } } })).toBe(0);
    expect(await EconomyRecord.count({ where: { userId: other.id, kind: 'opening' } })).toBe(0);

    const opened = await run(s => s.open(other.id, [entry.id])) as any;
    expect(opened.opening.kind).toBe('deck');
    expect(opened.opening.productId).toBe(product.id);
    expect(opened.opening.deckName).toBe(recipe.name);
    expect(opened.opening.cards.map((c: any) => ({ printingId: c.printingId, count: c.count }))).toEqual(recipe.cards);
    expect(opened.opening.cards.every((c: any) => c.ownedBefore === 0)).toBe(true);
    expect(opened.snapshot.holdings.reduce((n: number, c: any) => n + c.count, 0)).toBe(60);
    expect(opened.snapshot.balanceMinor).toBe(unopened.balanceMinor);
    expect(opened.snapshot.packs).toEqual(unopened.packs.filter(p => p.id !== entry.id));
    const deck = (await Deck.findOne(opened.opening.deckId))!;
    expect(deck.isValid).toBe(true);
    deck.user = other;
    await assertPlayableRecipe(deck);

    // Consumed state and opening results must also survive a new connection.
    await storage.disconnect();
    await storage.connect();
    const consumed = (await EconomyPack.findOne(entry.id))!;
    expect(consumed.deckJson).toBe(stored.deckJson);
    expect(consumed.openedAt).toBeTruthy();
    expect(consumed.openingId).toBe(opened.opening.id);
    expect((await run(s => s.opening(other.id, opened.opening.id))).opening).toEqual(opened.opening);
    const duplicate = await request('/open', other, { packIds: [entry.id] });
    expect(duplicate.status).toBe(400);
    expect(duplicate.body.error).toBe('ECONOMY_PACK');
    const afterDuplicate = await run(s => s.snapshot(other.id));
    expect(afterDuplicate.holdings).toEqual(opened.snapshot.holdings);
    expect(afterDuplicate.packs).toEqual(opened.snapshot.packs);
    expect(afterDuplicate.balanceMinor).toBe(opened.snapshot.balanceMinor);
    expect(await Deck.count({ where: { user: { id: other.id } } })).toBe(1);
    expect(await EconomyRecord.count({ where: { userId: other.id, kind: 'opening' } })).toBe(1);
  });
  it('imports all happy-six printings without mistaking prebuilt finishes for ball patterns', () => {
    const h6 = Array.from(printingById.values()).filter(p => p.set.startsWith('CSVH6'));
    expect(h6.length).toBe(364);
    expect(h6.filter(p => p.engineFullName !== null).length).toBe(364);
    const manager = CardManager.getInstance();
    expect(h6.every(p => !!p.engineFullName && !!manager.getCardByName(p.engineFullName))).toBe(true);
    const newCards = sets['setHappyTrainers'];
    expect(newCards.length).toBe(39);
    expect(new Set(newCards.map(card => card.fullName)).size).toBe(39);
    expect(newCards.every(card => manager.getAllCards().includes(card))).toBe(true);
    for (const [set, count] of [['CSVH6C', 180], ['CSVH6eC', 147], ['CSVH6aC', 23], ['CSVH6pC', 14]] as const) {
      expect(h6.filter(p => p.set === set).length).toBe(count);
    }
    const prebuilt = h6.filter(p => p.set === 'CSVH6C');
    expect(new Set(prebuilt.map(p => p.specialShinyType)).size).toBe(10);
    expect(prebuilt.every(p => !('pattern' in p))).toBe(true);
    expect(prebuilt.every(p => !!p.engineFullName)).toBe(true);
    expect(productById.get('happy-CSVH6C')!.decks!.length).toBe(4);
    expect(productById.get('happy-box-CSVH6C')!.decks!.length).toBe(4);
  });
  it('publishes all four happy-six screenshot lists with their exact card counts', () => {
    // Independently transcribed from the four user-supplied 60-card screenshots; merge identical numbers.
    const expected: Record<string, Record<string, number>> = {
      '阿响的火暴兽卡组': { '001': 1, '004': 4, '007': 2, '005': 4, '008': 2, '006': 4, '015': 2,
        '036': 2, '032': 1, '034': 4, '035': 2, '037': 2, '042': 1, '040': 2, '044': 3,
        '045': 4, '046': 2, '047': 4, FIR: 14 },
      '竹兰的烈咬陆鲨ex卡组': { '020': 2, '019': 3, '018': 3, '021': 3, '022': 2, '023': 1,
        '024': 1, '027': 1, '030': 2, '032': 1, '034': 4, '035': 4, '036': 2, '037': 2,
        '042': 1, '044': 3, '045': 4, '046': 2, '048': 2, '041': 2, FIG: 15 },
      '火箭队的超梦ex卡组': { '016': 2, '002': 3, '003': 3, '017': 1, '025': 1, '026': 1,
        '028': 2, '029': 2, '031': 2, '032': 1, '035': 4, '036': 2, '037': 2, '038': 4,
        '039': 2, '045': 4, '052': 4, '050': 1, '051': 1, '053': 1, '049': 2, PSY: 4, GRA: 7, '054': 4 },
      '小霞的暴鲤龙卡组': { '013': 4, '012': 4, '010': 2, '011': 2, '009': 2, '014': 4,
        '032': 1, '033': 3, '034': 4, '035': 4, '036': 2, '037': 2, '045': 4, '042': 1,
        '043': 2, '044': 3, '046': 2, WAT: 14 },
    };
    const expectedCovers: Record<string, string> = {
      '阿响的火暴兽卡组': "Ethan's Typhlosion DRI", '竹兰的烈咬陆鲨ex卡组': "Cynthia's Garchomp ex DRI",
      '火箭队的超梦ex卡组': "Team Rocket's Mewtwo ex DRI", '小霞的暴鲤龙卡组': "Misty's Gyarados DRI",
    };
    const single = productById.get('happy-CSVH6C')!;
    const box = productById.get('happy-box-CSVH6C')!;
    expect(single.priceMinor).toBe(2000);
    expect(box.priceMinor).toBe(8800);
    expect(single.purchaseLimit).toBe(null);
    expect(box.wholeBox).toBe(true);
    expect(single.decks!.length).toBe(4);
    expect(box.decks).toEqual(single.decks);
    for (const deck of single.decks!) {
      const name = deck.name.replace('嗨皮预组 · ', '');
      const actual: Record<string, number> = {};
      for (const item of deck.cards) {
        const printing = printingById.get(item.printingId)!;
        expect(printing.set).toBe('CSVH6C');
        expect(printing.rarity).toBe('无标记');
        const number = printing.number.split('/')[0];
        actual[number] = (actual[number] || 0) + item.count;
      }
      expect({ name, counts: actual }).toEqual({ name, counts: expected[name] });
      expect(deck.cover).toBe(expectedCovers[name]);
      expect(printingById.get(deck.cards[0].printingId)!.engineFullName).toBe(expectedCovers[name]);
    }
    expect(box.includedPacks).toEqual([{ productId: 'happy-pack-CSVH6C', count: 7 },
      { productId: 'happy-upgrade-CSVH6C', count: 1 }, { productId: 'happy-reward-CSVH6C', count: 1 }]);
  });
  it('sells and opens happy-six singles and the 13-piece whole box with legal decks and all gifts', async () => {
    await run(s => s.grant(admin.id, other.id, 20000, undefined, '第六弹购拆测试'));
    const available = await request('', other);
    const visible = available.body.products.filter((p: any) => ['happy-CSVH6C', 'happy-box-CSVH6C'].includes(p.id));
    expect(visible.map((p: any) => p.id).sort()).toEqual(['happy-CSVH6C', 'happy-box-CSVH6C']);
    expect(visible.every((p: any) => p.available)).toBe(true);
    const boughtSingle = await request('/purchase', other, { productId: 'happy-CSVH6C', quantity: 1 });
    expect(boughtSingle.status).toBe(200);
    expect(boughtSingle.body.snapshot.balanceMinor).toBe(18000);
    expect(boughtSingle.body.snapshot.holdings.length).toBe(0);
    expect(await Deck.count()).toBe(0);
    const singleEntry = boughtSingle.body.snapshot.packs.find((p: any) => p.productId === 'happy-CSVH6C');
    expect(Object.keys(singleEntry).sort()).toEqual(['deck', 'id', 'name', 'productId']);
    const revealedSingle = await run(s => s.open(other.id, [singleEntry.id]));
    expect(revealedSingle.opening.kind).toBe('deck');
    expect(revealedSingle.snapshot.holdings.reduce((n, c) => n + c.count, 0)).toBe(60);
    const boughtBox = await request('/purchase', other, { productId: 'happy-box-CSVH6C', quantity: 1 });
    expect(boughtBox.status).toBe(200);
    expect(boughtBox.body.snapshot.balanceMinor).toBe(9200);
    expect(boughtBox.body.snapshot.holdings).toEqual(revealedSingle.snapshot.holdings);
    expect(boughtBox.body.snapshot.packs.length).toBe(13);
    const decks = boughtBox.body.snapshot.packs.filter((p: any) => p.productId === 'happy-box-CSVH6C');
    const packs = boughtBox.body.snapshot.packs.filter((p: any) => !p.deck);
    expect(decks.length).toBe(4);
    expect(packs.length).toBe(9);
    expect(packs.filter((p: any) => p.productId === 'happy-pack-CSVH6C').length).toBe(7);
    expect(packs.filter((p: any) => p.productId === 'happy-upgrade-CSVH6C').length).toBe(1);
    expect(packs.filter((p: any) => p.productId === 'happy-reward-CSVH6C').length).toBe(1);
    const names = new Set<string>();
    for (const entry of decks) {
      const opened = await run(s => s.open(other.id, [entry.id]));
      if (opened.opening.kind !== 'deck') throw new Error('Expected a happy-six prebuilt deck');
      // The earlier random single may share a name; stored duplicate decks receive a numeric suffix.
      names.add(opened.opening.deckName.replace(/ · \d+$/, ''));
      expect(opened.opening.cards.reduce((n, c) => n + c.count, 0)).toBe(60);
    }
    expect([...names].sort()).toEqual(productById.get('happy-CSVH6C')!.decks!.map(d => d.name).sort());
    const gifts = await run(s => s.open(other.id, packs.map((p: any) => p.id)));
    // Pack openings return one row per draw; count is the resulting owned quantity, not drawn quantity.
    expect(gifts.opening.cards.length).toBe(25);
    expect(gifts.snapshot.holdings.reduce((n, c) => n + c.count, 0)).toBe(325);
    expect(gifts.snapshot.packs.length).toBe(0);
    expect(gifts.snapshot.balanceMinor).toBe(9200);
    const stored = await Deck.find({ where: { user: { id: other.id } } });
    expect(stored.length).toBe(5);
    for (const deck of stored) {
      expect(deck.isValid).toBe(true);
      deck.user = other;
      await assertPlayableRecipe(deck);
    }
  });
  it('honors happy-six distinct upgrades, Snorlax odds, and the high-number pack limit', () => {
    const upgrade = productById.get('happy-upgrade-CSVH6C')!;
    const reward = productById.get('happy-reward-CSVH6C')!;
    const small = productById.get('happy-pack-CSVH6C')!;
    expect([upgrade, reward, small].every(p => p.boxOnly)).toBe(true);
    expect(upgrade.recipe!.layouts!.map(layout => layout.weight)).toEqual([310, 9690]);
    const number = (p: Printing) => Number(p.number.split('/')[0]);
    for (const layout of upgrade.recipe!.layouts!) {
      for (const rng of [(n: number) => 0, (n: number) => n - 1]) {
        const cards = drawPack({ slots: layout.slots }, rng);
        expect(cards.length).toBe(10);
        expect(new Set(cards.map(p => p.printingId)).size).toBe(10);
        expect(cards.filter(p => number(p) <= 6).length).toBe(2);
        expect(cards.filter(p => number(p) >= 18).length).toBe(3);
        expect(cards.filter(p => number(p) >= 7 && number(p) <= 12).length).toBe(3);
        expect(cards.filter(p => number(p) >= 13 && number(p) <= 17).length).toBe(2);
        expect(cards.filter(p => p.name === '卡比兽ex').length).toBe(layout.weight === 310 ? 1 : 0);
      }
    }
    expect(reward.recipe!.slots![0].groups.map(g => g.weight)).toEqual([8750, 1250]);
    expect(reward.recipe!.slots![0].groups[0].printingIds.length).toBe(8);
    expect(reward.recipe!.slots![0].groups[0].printingIds.every(id => printingById.get(id)!.basicEnergy)).toBe(true);
    expect(reward.recipe!.slots![0].groups[1].printingIds.length).toBe(6);
    expect(small.recipe!.layouts!.map(layout => layout.weight)).toEqual([6, 6, 37]);
    for (const layout of small.recipe!.layouts!) {
      let possibleHighCards = 0;
      for (const slot of layout.slots) {
        expect(slot.groups.map(g => g.weight)).toEqual([8845, 1050, 105]);
        const candidates = slot.groups.flatMap(g => g.printingIds).map(id => printingById.get(id)!);
        if (candidates.some(p => number(p) >= 44)) {
          expect(candidates.every(p => number(p) >= 44 && number(p) <= 49)).toBe(true);
          possibleHighCards += slot.count;
        }
      }
      expect(possibleHighCards).toBeLessThanOrEqual(1);
      for (const rng of [(n: number) => 0, (n: number) => n - 1]) {
        const cards = drawPack({ slots: layout.slots }, rng);
        expect(cards.length).toBe(2);
        expect(cards.filter(p => number(p) >= 44).length).toBeLessThanOrEqual(1);
      }
    }
  });
  it('keeps unsupported cards collectible without inventing a playable effect', async () => {
    const printing = Array.from(printingById.values()).find(p => p.engineFullName === null)!;
    expect(printing).toBeDefined();
    await run(s => s.grant(admin.id, other.id, undefined, [{ printingId: printing.printingId, count: 2 }], '未实现效果收藏'));
    const holding = await EconomyHolding.findOne({ where: { userId: other.id, printingId: printing.printingId } });
    expect(holding!.count).toBe(2); expect(JSON.parse(holding!.printingJson).engineFullName).toBe(null);
  });
  it('keeps box-only packs out of the shop while the box still hands them out', async () => {
    const boxOnly = products.filter(p => p.boxOnly === true);
    expect(boxOnly.length).toBe(22);
    const ids = new Set(boxOnly.map(p => p.id));
    const snapshot = await run(s => s.snapshot(other.id));
    expect(snapshot.products.some(p => ids.has(p.id))).toBe(false);
    expect(snapshot.products.length).toBe(products.length - boxOnly.length);
    for (const pack of boxOnly) {
      const denied = await request('/purchase', other, { productId: pack.id, quantity: 1 });
      expect(denied.status).toBe(400);
      expect(denied.body.error).toBe('ECONOMY_PRODUCT');
    }
    // 整盒只引用这些附送包，所以盒子照常把 9 包发进未开包。
    const box = productById.get('happy-box-CSVH4C')!;
    expect(box.includedPacks!.length).toBe(3);
    expect(box.includedPacks!.every(item => ids.has(item.productId))).toBe(true);
    expect(box.includedPacks!.reduce((n, item) => n + item.count, 0)).toBe(9);
  });
  it('validates complete pools, every published pack size and the guaranteed 30th Pikachu', () => {
    validateCatalog();
    expect(printingById.size).toBe(11847); // Includes 364 happy-six printings and nine coin-set promos.
    expect(products.filter(p => p.kind !== 'coin').length).toBe(88);
    // 官方预组按官方卖法：嗨皮卡组单品 20 元随机 1 套（整盒 88 元含 4 套）、对战派对 28 元随机 1 副。
    const starters = products.filter(p => p.id.startsWith('happy-') && p.kind === 'starter' && !p.wholeBox && !p.recipe);
    const partyDecks = products.filter(p => p.id.startsWith('party-'));
    expect(starters.length).toBe(6);
    expect(partyDecks.length).toBe(2);  // 耀梦 上（9 副）+ 耀梦 下（5 副）
    expect(starters.every(p => p.giftStarter === true && p.kind === 'starter' && p.priceMinor === 2000)).toBe(true);
    // 整盒商品：官方88元，包含该弹4套卡组及9个附包。
    const boxes = products.filter(p => p.wholeBox === true);
    expect(boxes.length).toBe(6);
    expect(boxes.every(p => p.kind === 'starter' && p.purchaseLimit === null && p.priceMinor === 8800)).toBe(true);
    expect(partyDecks.every(p => p.giftParty === true && p.kind === 'party' && p.priceMinor === 2800)).toBe(true);
    for (const product of [...starters, ...partyDecks]) {
      // 随机预组不限购（官方单品可重复购买），每项必须是一套完整可打的 60 张卡组。
      expect(product.purchaseLimit).toBe(null);
      expect(product.decks!.length).toBeGreaterThan(0);
      for (const deck of product.decks!) {
        expect(deck.name.length).toBeGreaterThan(0);
        expect(deck.cards.reduce((n, c) => n + c.count, 0)).toBe(60);
        expect(deck.cards.every(c => !!printingById.get(c.printingId)!.engineFullName)).toBe(true);
        // 封面卡必须在最前：卡组盒子取 cards 里第一只宝可梦做封面。
        expect(deck.cover).toBeDefined();
        expect(deck.cover ?? null).toBe(printingById.get(deck.cards[0].printingId)!.engineFullName);
      }
    }
    // 整盒附送的小包（改造包／奖赏包／收集啦151活动包／嗨皮包／大师战略改造包）只在盒子里发，商城不展示也不能单独买。
    const boxOnly = products.filter(p => p.boxOnly === true);
    expect(boxOnly.length).toBe(22);
    expect(boxOnly.every(p => !!p.recipe)).toBe(true);
    expect(boxes.every(p => (p.includedPacks ?? []).some(i => boxOnly.some(b => b.id === i.productId)))).toBe(true);
    // 大师战略卡组构筑套装（第一弹 3 款 + 第二弹 3 款）：卡组 60 张 + 改造包 15 张 + 同盒补充包 4 包。
    const masters = products.filter(p => p.id.startsWith('master-') && p.kind === 'starter');
    expect(masters.length).toBe(6);
    expect(masters.every(p => p.purchaseLimit === 1 && p.priceMinor === 30900)).toBe(true);
    for (const master of masters) {
      expect(master.fixedCards!.reduce((n, c) => n + c.count, 0)).toBe(60);
      const packId = master.includedPacks![0].productId;
      expect(packId).toBe(master.id.replace('master-', 'master-pack-'));
      const upgradePack = productById.get(packId)!;
      expect(upgradePack.boxOnly).toBe(true);
      expect(upgradePack.recipe!.slots!.reduce((n, s) => n + s.count, 0)).toBe(15);
      expect(master.includedPacks![1].count).toBe(4);
    }
    expect(starters.map(p => p.decks!.length).reduce((a, b) => a + b, 0)).toBe(24);
    expect(boxes.map(p => p.decks!.length).reduce((a, b) => a + b, 0)).toBe(24);
    expect(partyDecks.map(p => p.decks!.length).reduce((a, b) => a + b, 0)).toBe(19);
    expect(partyDecks.every(p => p.decks!.every(d => d.name.length > 0))).toBe(true);
    const small = productById.get('glory-5')!;
    expect(small.recipe!.slots![0].count).toBe(4);
    expect(small.recipe!.slots![1].groups.map(g => g.weight)).toEqual([1401, 526, 73]);
    const fat = productById.get('glory-20')!;
    expect(fat.recipe!.slots![0].count).toBe(14);
    expect(fat.recipe!.slots![1].groups.map(g => g.weight)).toEqual([2235, 665, 100]);
    // 第二批商品：5张装 / 20张装补充包与全闪宝石包的平闪构成和配比权重
    expect(productById.get('csv1-5')!.recipe!.slots!.map(s => s.count)).toEqual([4, 1]);
    expect(productById.get('csv1-5')!.recipe!.slots![1].groups.map(g => g.weight)).toEqual([1453, 474, 73]);
    expect(productById.get('csv7-20')!.recipe!.slots!.map(s => s.count)).toEqual([14, 6]);
    expect(productById.get('csv7-20')!.recipe!.slots![1].groups.map(g => g.weight)).toEqual([2211, 689, 100]);
    expect(productById.get('gem-1')!.recipe!.slots!.map(s => s.count)).toEqual([4]);
    expect(productById.get('gem-1')!.recipe!.slots![0].groups.map(g => g.weight)).toEqual([5000, 2500, 1790, 493, 217]);
    // 每个开包商品都必须恰好覆盖它所属系列的全部印刷池，且平卡占比加配比合计为 100%。
    // 例外：30th-6 固定皮卡丘和基本能量卡位，太晶盛聚用两种平闪布局，都不适用单布局的占比等式。
    // 官方按卡种或稀有度公布的固定张数包（整盒附送的改造包／奖赏包／收集啦151活动包／嗨皮包）：
    // 它们的卡池不覆盖整个系列（只取官方列出的卡种），也不适用「平卡 + 闪卡 = 100%」的补充包布局。
    const documentedMixes = products.filter(p => p.recipe).filter(p =>
      p.id === 'c151-2' || p.id.startsWith('happy-upgrade-') || p.id.startsWith('happy-reward-') ||
      p.id.startsWith('happy-pack-') || p.id.startsWith('master-pack-'));
    expect(documentedMixes.length).toBe(22);
    for (const product of products.filter(p => p.recipe).filter(p => !documentedMixes.includes(p))) {
      const slots = product.recipe!.layouts?.flatMap(l => l.slots) || product.recipe!.slots!;
      const groups = slots.flatMap(s => s.groups);
      const covered = new Set(groups.flatMap(g => g.printingIds));
      const set = printingById.get(groups[0].printingIds[0])!.set;
      const pool = [...printingById.values()].filter(p => p.set === set).map(p => p.printingId);
      expect(pool.filter(id => !covered.has(id))).toEqual([]);
      expect(covered.size).toBe(pool.length);
      if (product.id !== '30th-6' && !product.recipe!.layouts) {
        const flatShare = slots[0].count / product.cardsPerPack * 100;
        const foilShare = slots.slice(1).reduce((n, s) => n + s.groups.reduce((m, g) => m + g.weight, 0), 0) / 100;
        expect(Math.round(flatShare + foilShare)).toBe(100);
      }
    }
    for (const product of products.filter(p => p.recipe)) {
      for (const rng of [(n: number) => 0 % n, (n: number) => n - 1]) {
        const cards = drawPack(product.recipe!, rng);
        expect(cards.length).toBe(product.cardsPerPack);
        if (product.id === '30th-6') expect(cards[0].rarity).toBe('皮卡丘');
        cards.forEach(c => expect(printingById.has(c.printingId)).toBe(true));
      }
    }
    // 大师战略：卡组本体 60 张在 fixedCards，15 张改造包以未开包形式给出（官方商品内容是 1 包 15 张）。
    const master = productById.get('master-CSVM2cC')!;
    expect(master.fixedCards!.reduce((n, c) => n + c.count, 0)).toBe(60);
    expect(master.includedPacks!.map(i => i.productId)).toEqual(['master-pack-CSVM2cC', 'glory-20']);
    expect(productById.get('master-pack-CSVM2cC')!.recipe!.slots!.reduce((n, s) => n + s.count, 0)).toBe(15);
  });
});
