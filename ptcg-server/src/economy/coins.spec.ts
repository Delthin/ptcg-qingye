import * as express from 'express';
import * as http from 'http';
import { mkdtempSync, unlinkSync, rmdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { createConnection } from 'typeorm';
import { Server as SocketServer, Socket } from 'socket.io';
import { WebSocketServer, Middleware } from '../backend/socket/websocket-server';
import { Storage, User, EconomyAccount, EconomyCoin, EconomyHolding, EconomyPack, EconomyRecord } from '../storage';
import { addPrelaunchColumns } from '../storage/prelaunch-schema';
import { Economy as EconomyController } from '../backend/controllers/economy';
import { generateToken } from '../backend/services/auth-token';
import { config } from '../config';
import { Core } from '../game/core/core';
import { Game } from '../game/core/game';
import { GameSettings } from '../game/core/game-settings';
import { Client } from '../game/client/client.interface';
import { StateSerializer } from '../game/serializer/state-serializer';
import { State } from '../game/store/state/state';
import { Player } from '../game/store/state/player';
import { AddPlayerAction } from '../game/store/actions/add-player-action';
import { CardManager } from '../game/cards/card-manager';
import { PokemonCard } from '../game/store/card/pokemon-card';
import { EnergyCard } from '../game/store/card/energy-card';
import { EconomyService, economyTransaction } from './service';
import * as catalog from './catalog';
import { drawCoinRewards, productById, printingById, printings, validateCatalog } from './catalog';
import { coins, coinSets, DEFAULT_COIN_ID } from './coin-ownership';

class CoinTestPokemon extends PokemonCard {
  public set = 'COIN-TEST'; public name = 'Coin test Pokémon'; public fullName = 'Coin test Pokémon COIN-TEST'; public hp = 100;
}
class CoinTestEnergy extends EnergyCard {
  public set = 'COIN-TEST'; public name = 'Coin test energy'; public fullName = 'Coin test energy COIN-TEST';
}

describe('coins (isolated SQLite, API and synchronous game creation)', () => {
  const storage = new Storage();
  const core = Object.create(Core.prototype) as Core; // No production scheduler/timers.
  const productId = 'coin-tera-eevee';
  const ids = ['pikachu-watercolor', 'eevee-silver', 'chansey-blue'];
  const run = <T>(task: (service: EconomyService) => Promise<T>) =>
    economyTransaction(storage.manager.connection, manager => task(new EconomyService(manager)));
  let member: User, other: User, banned: User;
  let server: http.Server, port: number, directory: string, database: string;
  const oldEnv = { type: process.env.STORAGE_TYPE, database: process.env.STORAGE_DATABASE, secret: process.env.secret };
  const previousDuo = config.duo.enabled;
  const games: Game[] = [];
  const request = (path: string, user?: User, body?: unknown): Promise<{ status: number; body: any }> => new Promise((resolve, reject) => {
    const data = body === undefined ? '' : JSON.stringify(body);
    const headers: Record<string, string | number> = { 'Content-Type': 'application/json' };
    if (user) headers['Auth-Token'] = generateToken(user.id);
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    const req = http.request({ hostname: '127.0.0.1', port, path: `/v1/duo/economy${path}`,
      method: body === undefined ? 'GET' : 'POST', headers }, res => {
      let text = ''; res.on('data', chunk => text += chunk);
      res.on('end', () => resolve({ status: res.statusCode!, body: JSON.parse(text) }));
    });
    req.on('error', reject); req.end(data);
  });
  const clientFor = (user: User): Client => ({ id: 0, name: user.name, user: User.create({ ...user }), games: [],
    onStateChange: () => undefined } as unknown as Client);
  // Mirrors the two socket middlewares: authenticate User, hydrate, then synchronously register.
  const connect = async (client: Client) => { await core.prepareUserCoins(client.user); return core.connect(client); };
  const settings = () => { const result = new GameSettings(); result.recordingEnabled = false; return result; };
  const deck = [...Array(4).fill('Coin test Pokémon COIN-TEST'), ...Array(56).fill('Coin test energy COIN-TEST')];
  const rejection = async (promise: Promise<unknown>): Promise<Error> => {
    let error: Error | undefined;
    try { await promise; } catch (caught) { error = caught as Error; }
    expect(error).toBeDefined();
    return error!;
  };
  const fund = async (balanceMinor = 10000) => {
    await run(s => s.snapshot(member.id)); await EconomyAccount.update(member.id, { balanceMinor });
  };
  // Legacy collectibles remain valid game selections, but are no longer sold.
  const unlockLegacy = () => EconomyCoin.insert(ids.map(coinId => ({ userId: member.id, coinId })));
  const fixedDraw = () => spyOn(catalog, 'drawCoinRewards').and.callFake((recipe: catalog.CoinDraw, quantity = 1) =>
    Array(recipe.count * quantity).fill(recipe.groups[0].coinIds[0]));
  beforeAll(async () => {
    directory = mkdtempSync(join(tmpdir(), 'ptcg-coins-'));
    database = join(directory, 'test.sq3');
    process.env.STORAGE_TYPE = 'sqlite'; process.env.STORAGE_DATABASE = database;
    process.env.secret = 'isolated-coin-test-secret';
    config.duo.enabled = false;
    await storage.connect();
    [member, other, banned] = await User.save([User.create({ name: 'coin-owner' }),
      User.create({ name: 'coin-other' }), User.create({ name: 'coin-banned', roleId: 1 })]);
    CardManager.getInstance().defineSet([new CoinTestPokemon(), new CoinTestEnergy()]);
    const app = express(); app.use(express.json());
    new EconomyController('/v1/duo/economy', app, storage, core).init();
    server = app.listen(0, '127.0.0.1');
    await new Promise<void>(resolve => server.on('listening', resolve));
    port = (server.address() as import('net').AddressInfo).port;
  });
  beforeEach(async () => {
    await EconomyRecord.clear(); await EconomyCoin.clear(); await EconomyPack.clear();
    await EconomyHolding.clear(); await EconomyAccount.clear();
    await User.update(member.id, { equippedCoinId: DEFAULT_COIN_ID });
    await User.update(other.id, { equippedCoinId: DEFAULT_COIN_ID });
    Object.assign(core, { clients: [], games: [], equippedCoins: new Map<number, string>(),
      lastClientId: 0, lastGameId: 0, duoPresenceTask: Promise.resolve(), duoFriends: new Map(), emit: () => undefined });
  });
  afterEach(() => { config.duo.enabled = false; games.splice(0).forEach(game => game.cleanup()); });
  afterAll(async () => {
    if (server) await new Promise<void>(resolve => server.close(() => resolve()));
    await storage.disconnect();
    unlinkSync(database); rmdirSync(directory);
    config.duo.enabled = previousDuo;
    for (const [key, value] of Object.entries({ STORAGE_TYPE: oldEnv.type, STORAGE_DATABASE: oldEnv.database, secret: oldEnv.secret })) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });

  it('keeps the implicit default and legacy coins, sells only ten official sets, and merges nine promo printings', async () => {
    validateCatalog();
    const snapshot = await run(s => s.snapshot(member.id));
    expect(snapshot.version).toBe(1);
    expect(snapshot.coins).toEqual({ ownedIds: ['twinleaf'], equippedId: 'twinleaf', counts: { twinleaf: 1 } });
    expect(await EconomyCoin.count()).toBe(0);
    expect(coins.length).toBe(225);
    expect(snapshot.products.filter(p => p.kind === 'coin').length).toBe(10);
    for (const id of ['coin-first-partners', 'coin-eevee-friends', 'coin-starry-night', 'coin-classic']) {
      expect(productById.has(id)).toBe(false);
    }
    const product = snapshot.products.find(p => p.id === productId)!;
    expect(product).toEqual(jasmine.objectContaining<typeof product>({ kind: 'coin', priceMinor: 3900,
      packCount: 1, purchaseLimit: null, available: true, coinDrawCount: 1,
      coverImage: '/assets/coins/tera-eevee-box.png' }));
    expect(product.coinIds!.length).toBe(10);
    expect('coinDraw' in product).toBe(false);
    expect(snapshot.products.find(p => p.id === 'coin-30th-pikachu')!.coinDrawCount).toBe(2);
    const promoEffects = ['Leafeon PRE', 'Flareon PRE', 'Vaporeon PRE', 'Glaceon TWM', 'Jolteon MEW',
      'Espeon OBF', 'Sylveon SFA', 'Umbreon OBF', 'Eevee SSP'];
    promoEffects.forEach((effect, index) => {
      const id = `chs:${21267 + index}`;
      expect(printings.filter(p => p.printingId === id).length).toBe(1);
      expect(printingById.get(id)!.engineFullName).toBe(effect);
    });
    expect(snapshot.products.find(p => p.id === 'glory-5')!.kind).toBe(productById.get('glory-5')!.kind);
    await User.update(member.id, { equippedCoinId: ids[0] });
    expect((await run(s => s.snapshot(member.id))).coins.equippedId).toBe('twinleaf');
  });
  it('selects ordinary/gold at the exact 98/99 boundary, then selects uniformly inside that group, with replacement', () => {
    const recipe = productById.get(productId)!.coinDraw!;
    for (const [draw, index, selected, groupLength] of [[0, 0, 'tera-eevee-colorless', 9], [98, 8, 'tera-eevee-water', 9],
      [99, 0, 'tera-eevee-secret', 1]] as [number, number, string, number][]) {
      const pools: number[] = [];
      expect(drawCoinRewards(recipe, 1, n => { pools.push(n); return pools.length === 1 ? draw : index; }))
        .toEqual([selected]);
      expect(pools).toEqual([100, groupLength]);
    }
    const anniversary = productById.get('coin-30th-pikachu')!.coinDraw!;
    expect(drawCoinRewards(anniversary, 10, () => 0)).toEqual(Array(20).fill('30th-pikachu-01-blue'));
    let call = 0;
    expect(drawCoinRewards(anniversary, 1, n => ++call % 2 ? 99 : n - 1))
      .toEqual(['30th-pikachu-30-gold', '30th-pikachu-30-gold']);
    for (const quantity of [0, -1, 0.5, 11]) expect(() => drawCoinRewards(recipe, quantity, () => 0)).toThrowError('Invalid coin draw count');
    expect(() => drawCoinRewards({ ...recipe, count: 3 }, 10, () => 0)).toThrowError('Invalid coin draw count');
  });
  it('ignores forged price, pool and weights, refreshes, equips all online sessions, and persists after reopen', async () => {
    await fund(); fixedDraw();
    const coinId = 'tera-eevee-colorless';
    const client = clientFor(member), second = clientFor(member);
    await connect(client); await connect(second);
    const bought = await request('/purchase', member, { productId, quantity: 1, priceMinor: 0, coinIds: ['forged'],
      coinDraw: { count: 20, groups: [{ weight: 100, coinIds: ['tera-eevee-secret'] }] } });
    expect(bought.status).toBe(200);
    expect(bought.body.snapshot.balanceMinor).toBe(6100);
    expect(bought.body.coinRewards).toEqual([{ coinId, count: 1, ownedBefore: 0 }]);
    expect(bought.body.snapshot.coins.ownedIds).toEqual(['twinleaf', coinId]);
    expect(bought.body.snapshot.holdings).toEqual([jasmine.objectContaining({ printingId: 'chs:21275', count: 1 })]);
    expect(bought.body.snapshot.packs).toEqual([jasmine.objectContaining({ productId: 'tera-10', deck: false })]);
    const refreshed = await request('', member);
    expect(refreshed.body.coins).toEqual(bought.body.snapshot.coins);
    expect(refreshed.body.products.find((p: any) => p.id === productId).available).toBe(true);
    const result = await request('/coins/equip', member, { coinId, frontImage: '/evil', userId: other.id });
    expect(result.status).toBe(200); expect(result.body.snapshot.coins.equippedId).toBe(coinId);
    expect(client.user.equippedCoinId).toBe(coinId); expect(second.user.equippedCoinId).toBe(coinId);
    expect(core.getEquippedCoin(client)).toBe(coinId);
    expect((await User.findOne(other.id))!.equippedCoinId).toBe('twinleaf');
    await storage.disconnect(); await storage.connect();
    const reconnected = clientFor(member); await connect(reconnected);
    expect(reconnected.user.equippedCoinId).toBe(coinId); expect(core.getEquippedCoin(reconnected)).toBe(coinId);
    expect((await request('', member)).body.coins.counts[coinId]).toBe(1);
    expect(await EconomyCoin.count({ where: { userId: member.id } })).toBe(1);
    const record = (await EconomyRecord.findOne({ where: { userId: member.id, kind: 'purchase' } }))!;
    expect(JSON.parse(record.detailJson).coinRewards).toEqual(bought.body.coinRewards);
  });
  it('rejects anonymous, banned, missing-account and cross-account ownership attempts and unknown IDs', async () => {
    await fund(); await unlockLegacy();
    expect((await request('/coins/equip', undefined, { coinId: 'twinleaf' })).status).toBe(403);
    expect((await request('/purchase', banned, { productId, quantity: 1 })).status).toBe(403);
    expect((await request('/coins/equip', banned, { coinId: 'twinleaf' })).status).toBe(403);
    expect((await request('/coins/equip', other, { userId: member.id, coinId: ids[0] })).status).toBe(403);
    for (const coinId of ['unknown', '../assets/evil.png', null, 12, {}]) {
      expect((await request('/coins/equip', member, { coinId })).status).toBe(400);
    }
    await rejection(run(s => s.equipCoin(987654321, 'twinleaf')));
    expect((await request('/coins/equip', other, { coinId: 'twinleaf' })).status).toBe(200);
    expect((await User.findOne(member.id))!.equippedCoinId).toBe('twinleaf');
  });
  it('serializes concurrent repeated rewards without lost counts or duplicate debit, and recovers after balance rejection', async () => {
    await fund(15600); fixedDraw();
    const attempts = await Promise.all(Array.from({ length: 4 }, () => request('/purchase', member, { productId, quantity: 1 })));
    expect(attempts.map(r => r.status)).toEqual([200, 200, 200, 200]);
    expect(attempts.map(r => r.body.coinRewards[0].ownedBefore).sort()).toEqual([0, 1, 2, 3]);
    const after = await run(s => s.snapshot(member.id));
    expect(after.balanceMinor).toBe(0); expect(after.coins.counts['tera-eevee-colorless']).toBe(4);
    expect(after.packs.length).toBe(4); expect(after.holdings[0].count).toBe(4);
    expect(await EconomyCoin.count()).toBe(1); expect(await EconomyRecord.count()).toBe(4);
    expect((await request('/purchase', member, { productId, quantity: 1 })).status).toBe(400);
    expect((await request('/coins/equip', member, { coinId: 'tera-eevee-colorless' })).status).toBe(200);
    expect(await EconomyRecord.count()).toBe(4);
  });
  it('aggregates multiple actual reward IDs with independent previous quantities in both response and ledger', async () => {
    await fund(20000);
    const blue = '30th-pikachu-01-blue', gold = '30th-pikachu-30-gold';
    await EconomyCoin.insert({ userId: member.id, coinId: gold, count: 2 });
    spyOn(catalog, 'drawCoinRewards').and.returnValue([blue, gold, blue, gold]);
    const result = await request('/purchase', member, { productId: 'coin-30th-pikachu', quantity: 2 });
    expect(result.status).toBe(200);
    expect(result.body.coinRewards).toEqual([{ coinId: blue, count: 2, ownedBefore: 0 }, { coinId: gold, count: 2, ownedBefore: 2 }]);
    expect(result.body.snapshot.coins.counts).toEqual({ twinleaf: 1, [blue]: 2, [gold]: 4 });
    expect(result.body.snapshot.balanceMinor).toBe(6400); expect(result.body.snapshot.packs.length).toBe(6);
    const record = (await EconomyRecord.findOne({ where: { userId: member.id, kind: 'purchase' } }))!;
    expect(JSON.parse(record.detailJson).coinRewards).toEqual(result.body.coinRewards);
  });
  it('rejects invalid quantities and insufficient balances without side effects', async () => {
    await fund(3899);
    for (const quantity of [-1, 0, 0.5, 11, '1', null]) {
      expect((await request('/purchase', member, { productId, quantity })).status).toBe(400);
    }
    expect((await request('/purchase', member, { productId, quantity: 1 })).status).toBe(400);
    expect((await run(s => s.snapshot(member.id))).balanceMinor).toBe(3899);
    expect(await EconomyCoin.count()).toBe(0); expect(await EconomyRecord.count()).toBe(0);
    expect(await EconomyHolding.count()).toBe(0); expect(await EconomyPack.count()).toBe(0);
  });
  it('still sells fully owned sets and increments an existing coin count', async () => {
    await fund(); fixedDraw();
    await EconomyCoin.insert(productById.get(productId)!.coinIds!.map(coinId => ({ userId: member.id, coinId })));
    const product = (await run(s => s.snapshot(member.id))).products.find(p => p.id === productId)!;
    expect(product.available).toBe(true); expect('unavailableReason' in product).toBe(false);
    const result = await request('/purchase', member, { productId, quantity: 2 });
    expect(result.status).toBe(200); expect(result.body.snapshot.balanceMinor).toBe(2200);
    expect(result.body.coinRewards).toEqual([{ coinId: 'tera-eevee-colorless', count: 2, ownedBefore: 1 }]);
    expect(result.body.snapshot.coins.counts['tera-eevee-colorless']).toBe(3);
  });
  for (const [table, operation, condition] of [
    ['economy_holding', 'INSERT', '1'], ['economy_pack', 'INSERT', '1'],
    ['economy_coin', 'INSERT', '1'], ['economy_record', 'INSERT', "NEW.kind = 'purchase'"],
    ['economy_coin', 'UPDATE', '1'],
  ]) {
    it(`atomically rolls back debit, cards, packs, coins and ledger when ${table} ${operation} fails`, async () => {
      await fund(); fixedDraw();
      if (operation === 'UPDATE') await EconomyCoin.insert({ userId: member.id, coinId: 'tera-eevee-colorless', count: 7 });
      const before = await run(s => s.snapshot(member.id));
      await storage.manager.query(`CREATE TRIGGER fail_coin_write BEFORE ${operation} ON ${table} WHEN ${condition}
        BEGIN SELECT RAISE(ABORT, 'coin atomic rollback probe'); END`);
      try {
        const failed = await request('/purchase', member, { productId, quantity: 2 });
        expect(failed.status).toBe(500); expect(failed.body.error).toBe('ECONOMY_FAILED');
      } finally { await storage.manager.query('DROP TRIGGER fail_coin_write'); }
      const after = await run(s => s.snapshot(member.id));
      expect(after.balanceMinor).toBe(10000); expect(after.coins).toEqual(before.coins);
      expect(after.packs).toEqual([]); expect(after.holdings).toEqual([]);
      expect(await EconomyRecord.count()).toBe(0);
      expect(await EconomyCoin.count()).toBe(operation === 'UPDATE' ? 1 : 0);
      expect((await request('/purchase', member, { productId, quantity: 1 })).status).toBe(200);
    });
  }
  for (const set of coinSets) {
    for (const quantity of set.id === 'coin-tera-eevee' || set.id === 'coin-30th-pikachu' ? [1, 10] : [1]) {
      it(`delivers official contents and charges the exact price for ${set.id} × ${quantity}`, async () => {
        await fund(100000); fixedDraw();
        const result = await request('/purchase', member, { productId: set.id, quantity });
        expect(result.status).toBe(200);
        const anniversary = set.id === 'coin-30th-pikachu';
        expect(result.body.snapshot.balanceMinor).toBe(100000 - (anniversary ? 6800 : 3900) * quantity);
        expect(result.body.unopenedDecks).toBe(0);
        expect(result.body.coinRewards).toEqual([{ coinId: set.coinDraw.groups[0].coinIds[0],
          count: (anniversary ? 2 : 1) * quantity, ownedBefore: 0 }]);
        expect(result.body.snapshot.coins.counts[set.coinDraw.groups[0].coinIds[0]]).toBe((anniversary ? 2 : 1) * quantity);
        expect(result.body.snapshot.packs.length).toBe((anniversary ? 3 : 1) * quantity);
        expect(result.body.snapshot.packs.every((p: any) => p.productId === (anniversary ? '30th-6' : 'tera-10') && !p.deck)).toBe(true);
        expect(result.body.snapshot.holdings).toEqual(anniversary ? [] : [jasmine.objectContaining({
          printingId: set.fixedCards[0].printingId, count: quantity,
          engineFullName: printingById.get(set.fixedCards[0].printingId)!.engineFullName,
        })]);
        const record = (await EconomyRecord.findOne({ where: { productId: set.id, userId: member.id } }))!;
        expect(record.amountMinor).toBe(-(anniversary ? 6800 : 3900) * quantity);
        expect(record.quantity).toBe(quantity);
        expect(JSON.parse(record.detailJson).coinRewards).toEqual(result.body.coinRewards);
        expect(result.body.snapshot.products.find((p: any) => p.id === set.id).available).toBe(true);
      });
    }
  }
  for (const suffix of ['espeon', 'umbreon']) {
    const giftProduct = `30th-deck-${suffix}`, giftCoin = `30th-deluxe-${suffix}`;
    it(`derives historical ${giftProduct} quantity without snapshot writes, permits equip, and uses max with stored count`, async () => {
      await fund(100000);
      const record = (id: string, quantity: number, extra: Partial<EconomyRecord> = {}) => EconomyRecord.create({
        id, userId: member.id, kind: 'purchase', label: 'historical purchase', amountMinor: -100, productId: giftProduct,
        quantity, detailJson: '{}', createdAt: '2026-01-01T00:00:00Z', ...extra,
      });
      await EconomyRecord.save([record('old-1', 2), record('old-2', 3), record('not-a-purchase', 8, { kind: 'gift' }),
        record('invalid-zero', 0), record('invalid-negative', -2), record('invalid-fraction', 1.5),
        record('invalid-free', 4, { amountMinor: 0 }), record('another-user', 9, { userId: other.id })]);
      for (let n = 0; n < 3; n++) expect((await request('', member)).body.coins.counts[giftCoin]).toBe(5);
      expect(await EconomyCoin.count({ where: { userId: member.id } })).toBe(0);
      expect((await request('/coins/equip', member, { coinId: giftCoin })).status).toBe(200);
      const client = clientFor(member); await connect(client);
      expect(core.getEquippedCoin(client)).toBe(giftCoin);
      await EconomyCoin.insert({ userId: member.id, coinId: giftCoin, count: 3 });
      expect((await request('', member)).body.coins.counts[giftCoin]).toBe(5);
      const fromHistory = await request('/purchase', member, { productId: giftProduct, quantity: 2 });
      expect(fromHistory.status).toBe(200);
      expect(fromHistory.body.coinRewards).toEqual([{ coinId: giftCoin, count: 2, ownedBefore: 5 }]);
      expect(fromHistory.body.snapshot.coins.counts[giftCoin]).toBe(7);
      expect((await request('', member)).body.coins.counts[giftCoin]).toBe(7);
      await EconomyCoin.update({ userId: member.id, coinId: giftCoin }, { count: 8 });
      expect((await request('', member)).body.coins.counts[giftCoin]).toBe(8);
      const bought = await request('/purchase', member, { productId: giftProduct, quantity: 2 });
      expect(bought.status).toBe(200);
      expect(bought.body.coinRewards).toEqual([{ coinId: giftCoin, count: 2, ownedBefore: 8 }]);
      expect(bought.body.snapshot.coins.counts[giftCoin]).toBe(10);
      expect((await request('', member)).body.coins.counts[giftCoin]).toBe(10);
      expect((await EconomyCoin.findOne({ where: { userId: member.id, coinId: giftCoin } }))!.count).toBe(10);
    });
    it(`awards a new ${giftProduct} gift once per unit, alongside unopened decks and two packs each`, async () => {
      await fund(1000000);
      for (const quantity of [1, 10]) {
        const before = quantity === 1 ? 0 : 1;
        const result = await request('/purchase', member, { productId: giftProduct, quantity });
        expect(result.status).toBe(200);
        expect(result.body.coinRewards).toEqual([{ coinId: giftCoin, count: quantity, ownedBefore: before }]);
        expect(result.body.snapshot.coins.counts[giftCoin]).toBe(before + quantity);
        expect(result.body.unopenedDecks).toBe(quantity);
        expect(result.body.snapshot.packs.filter((p: any) => p.deck && p.productId === giftProduct).length).toBe(before + quantity);
        expect(result.body.snapshot.packs.filter((p: any) => !p.deck && p.productId === '30th-6').length).toBe(2 * (before + quantity));
        expect(result.body.snapshot.holdings).toEqual([]);
        expect(result.body.snapshot.balanceMinor).toBe(1000000 - productById.get(giftProduct)!.priceMinor * (before + quantity));
        const product = result.body.snapshot.products.find((p: any) => p.id === giftProduct);
        expect(product.coinIds).toEqual([giftCoin]); expect(product.coinDrawCount || 0).toBe(0);
        expect(product.description).toContain('硬币');
      }
      expect((await request('', member)).body.coins.counts[giftCoin]).toBe(11);
      expect((await EconomyCoin.findOne({ where: { userId: member.id, coinId: giftCoin } }))!.count).toBe(11);
      const records = await EconomyRecord.find({ where: { userId: member.id, kind: 'purchase' }, order: { quantity: 'ASC' } });
      expect(records.map(r => JSON.parse(r.detailJson).coinRewards)).toEqual([
        [{ coinId: giftCoin, count: 1, ownedBefore: 0 }], [{ coinId: giftCoin, count: 10, ownedBefore: 1 }],
      ]);
    });
  }
  it('rolls back a failed equip without updating online sessions', async () => {
    await fund(); await unlockLegacy();
    const client = clientFor(member); await connect(client);
    await storage.manager.query(`CREATE TRIGGER fail_coin_equip BEFORE UPDATE OF equippedCoinId ON user
      BEGIN SELECT RAISE(ABORT, 'coin equip rollback probe'); END`);
    try { expect((await request('/coins/equip', member, { coinId: ids[0] })).status).toBe(500); }
    finally { await storage.manager.query('DROP TRIGGER fail_coin_equip'); }
    expect(client.user.equippedCoinId).toBe('twinleaf'); expect(core.getEquippedCoin(client)).toBe('twinleaf');
    expect((await User.findOne(member.id))!.equippedCoinId).toBe('twinleaf');
  });
  it('freezes server-owned selections for creation, invitation and direct join, ignoring forged action fields', async () => {
    await fund(); await unlockLegacy();
    await request('/coins/equip', member, { coinId: ids[0] });
    const owner = clientFor(member), guest = clientFor(other);
    await connect(owner); await connect(guest);
    config.duo.enabled = true;
    const game = core.createGame(owner, deck, settings(), guest); games.push(game);
    config.duo.enabled = false;
    expect(game.state.players.map(p => p.coinId)).toEqual([ids[0], 'twinleaf']);
    await request('/coins/equip', member, { coinId: ids[1] });
    expect(game.state.players[0].coinId).toBe(ids[0]);
    const next = core.createGame(owner, deck, settings()); games.push(next);
    expect(next.state.players[0].coinId).toBe(ids[1]);
    const join = Object.assign(new AddPlayerAction(guest.id, guest.name, deck), { coinId: ids[2] });
    next.dispatch(guest, join);
    expect(next.state.players[1].coinId).toBe('twinleaf');
    const matched = core.createGameWithDecks(owner, deck, settings(), guest, deck); games.push(matched);
    expect(matched.state.players.map(p => p.coinId)).toEqual([ids[1], 'twinleaf']);
    const selfPlay = core.createSelfPlayGame(owner, deck, deck, settings()); games.push(selfPlay);
    expect(selfPlay.state.players.map(p => p.coinId)).toEqual([ids[1], ids[1]]);
  });
  it('does not share another real account\'s owned coin even if settings claim self-play', async () => {
    await fund(); await unlockLegacy();
    await request('/coins/equip', member, { coinId: ids[0] });
    const owner = clientFor(member), guest = clientFor(other);
    await connect(owner); await connect(guest);
    const claimed = settings(); claimed.selfPlay = true;
    const game = core.createGameWithDecks(owner, deck, claimed, guest, deck); games.push(game);
    expect(game.state.players.map(player => player.coinId)).toEqual([ids[0], 'twinleaf']);
  });
  it('keeps validated online selections when an older presence query resolves after equip', async () => {
    await fund(); await unlockLegacy();
    const client = clientFor(member); await connect(client);
    const stale = (await User.findOne(member.id))!;
    let resolveUsers!: (users: User[]) => void, markStarted!: () => void;
    const pending = new Promise<User[]>(resolve => resolveUsers = resolve);
    const started = new Promise<void>(resolve => markStarted = resolve);
    spyOn(User, 'findByIds').and.callFake(() => { markStarted(); return pending; });
    config.duo.enabled = true;
    const refresh = core.refreshDuoPresence(); await started;
    expect((await request('/coins/equip', member, { coinId: ids[0] })).status).toBe(200);
    resolveUsers([stale]); await refresh;
    expect(client.user.equippedCoinId).toBe(ids[0]); expect(core.getEquippedCoin(client)).toBe(ids[0]);
  });
  it('reserves distinct client IDs across concurrent asynchronous coin hydration', async () => {
    const first = clientFor(member), second = clientFor(other); first.id = 7; second.id = 7;
    await Promise.all([connect(first), connect(second)]);
    expect(first.id).not.toBe(second.id); expect(core.clients.length).toBe(2);
  });
  it('falls back for unowned/tampered persisted choices, bots and legacy serialized Players', async () => {
    await User.update(member.id, { equippedCoinId: ids[0] });
    const owner = clientFor(member); owner.user.equippedCoinId = ids[1]; await connect(owner);
    expect(core.getEquippedCoin(owner)).toBe('twinleaf');
    await User.update(other.id, { equippedCoinId: 'unknown' });
    const invalid = clientFor(other); await connect(invalid);
    expect(core.getEquippedCoin(invalid)).toBe('twinleaf');
    const bot = Object.assign(clientFor(member), { isFormatAllowed: () => true, getAllowedFormats: () => [] });
    core.updateEquippedCoin(member.id, ids[0]); expect(core.getEquippedCoin(bot)).toBe('twinleaf');
    const state = new State(); const player = new Player(); player.coinId = ids[2]; state.players.push(player);
    const serializer = new StateSerializer(); const serialized = serializer.serialize(state);
    expect(serializer.deserialize(serialized).players[0].coinId).toBe(ids[2]);
    const legacy = serialized.replace(/,"coinId":"chansey-blue"/g, '');
    expect(legacy).not.toContain('coinId');
    expect(serializer.deserialize(legacy).players[0].coinId).toBe('twinleaf');
  });
  it('waits for validated coin hydration before accepting a socket and forwards hydration failures', async () => {
    const middlewares: Middleware[] = [];
    spyOn(SocketServer.prototype, 'use').and.callFake(function (this: SocketServer, middleware: Middleware) {
      middlewares.push(middleware); return this;
    });
    const sockets = new WebSocketServer(core); const httpServer = http.createServer();
    try {
      await sockets.listen(httpServer);
      expect(middlewares.length).toBe(2); // Authentication still precedes appearance hydration.
      let ready!: () => void;
      const pending = new Promise<void>(resolve => ready = resolve);
      const prepare = spyOn(core, 'prepareUserCoins').and.returnValue(pending);
      const next = jasmine.createSpy('next'); const socket = { user: member } as unknown as Socket;
      const completion = middlewares[1](socket, next);
      expect(prepare).toHaveBeenCalledWith(member); expect(next).not.toHaveBeenCalled();
      ready(); await completion;
      expect(next.calls.count()).toBe(1); expect(next.calls.mostRecent().args).toEqual([]);
      const error = new Error('coin hydration failed'); prepare.and.returnValue(Promise.reject(error));
      await middlewares[1](socket, next);
      expect(next.calls.count()).toBe(2); expect(next.calls.mostRecent().args).toEqual([error]);
      expect(core.clients.length).toBe(0);
    } finally { sockets.dispose(); }
  });
  it('adds the column in place, preserves legacy rows and is idempotent on repeated startup', async () => {
    const legacyPath = join(directory, 'legacy.sq3');
    const legacy = await createConnection({ name: 'coin-legacy', type: 'sqlite', database: legacyPath, entities: [], synchronize: false });
    try {
      await legacy.query('CREATE TABLE user (id integer PRIMARY KEY, name varchar NOT NULL)');
      await legacy.query("INSERT INTO user (id, name) VALUES (41, 'retained account')");
      await legacy.query('CREATE TABLE economy_coin (userId integer NOT NULL, coinId varchar NOT NULL, PRIMARY KEY (userId, coinId))');
      await legacy.query("INSERT INTO economy_coin (userId, coinId) VALUES (41, 'eevee-silver')");
      await addPrelaunchColumns(legacy); await addPrelaunchColumns(legacy);
      expect(await legacy.query('SELECT userId, coinId, count FROM economy_coin'))
        .toEqual([{ userId: 41, coinId: 'eevee-silver', count: 1 }]);
      await legacy.query("UPDATE economy_coin SET count = 5 WHERE userId = 41");
      await addPrelaunchColumns(legacy);
      expect((await legacy.query('SELECT count FROM economy_coin'))[0].count).toBe(5);
      expect((await legacy.query('PRAGMA table_info(economy_coin)')).filter((c: { name: string }) => c.name === 'count').length).toBe(1);
      expect(await legacy.query('SELECT id, name, equippedCoinId FROM user'))
        .toEqual([{ id: 41, name: 'retained account', equippedCoinId: 'twinleaf' }]);
      const columns: { name: string }[] = await legacy.query('PRAGMA table_info(user)');
      expect(columns.filter(column => column.name === 'equippedCoinId').length).toBe(1);
    } finally { await legacy.close(); unlinkSync(legacyPath); }
  });
});
