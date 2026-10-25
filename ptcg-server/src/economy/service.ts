import { randomBytes } from 'crypto';
import { EntityManager, IsNull } from 'typeorm';
export { serializedTransaction as economyTransaction } from '../storage/transaction';
import { Deck, EconomyAccount, EconomyCoin, EconomyHolding, EconomyPack, EconomyRecord, User } from '../storage';
import { DeckAnalyser } from '../game';
import { FREE_BASIC_ENERGIES } from '../game/store/card/free-basic-energy';
import { checkDeckOwnership } from './deck-ownership';
import { BATTLE_REWARD_MINOR } from './battle-reward';
import { coinById, ownedCoinState } from './coin-ownership';
import { getValidFormatsForCardList } from '../backend/controllers/decks';
import { drawCoinRewards, drawPack, PackRecipe, Printing, printingById, printings, Product, productById, products, randomIndex } from './catalog';

export interface CoinReward { coinId: string; count: number; ownedBefore: number; }

export class EconomyError extends Error {
  constructor(public code: string, message: string, public status: number = 400) { super(message); }
}
const fail = (code: string, message: string, status = 400): never => { throw new EconomyError(`ECONOMY_${code}`, message, status); };
const id = () => randomBytes(16).toString('hex');
const MAX_BALANCE = 1000000000;
const MAX_HOLDING = 1000000;
export const checkInDay = (now: number = Date.now()) => new Date(now + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
export function integer(value: unknown, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) return fail('INVALID', '数量或金额无效。');
  return value;
}

export class EconomyService {
  constructor(private manager: EntityManager) { }

  public async user(userId: number, admin = false): Promise<User> {
    const user = await this.manager.findOne(User, userId);
    if (!user || user.roleId === 1 || admin && user.roleId !== 4) return fail('FORBIDDEN', '没有操作权限。', 403);
    return user;
  }
  private async account(userId: number): Promise<EconomyAccount> {
    let account = await this.manager.findOne(EconomyAccount, userId);
    // Existing users start at zero. Never convert saved free-practice decks into inventory.
    if (!account) account = await this.manager.save(this.manager.create(EconomyAccount, { userId, balanceMinor: 0, lastClaimDay: null }));
    return account;
  }
  private async record(userId: number, kind: string, label: string, amountMinor: number, detail: unknown,
    extra: Partial<EconomyRecord> = {}): Promise<EconomyRecord> {
    return this.manager.save(this.manager.create(EconomyRecord, { id: id(), userId, kind, label, amountMinor,
      detailJson: JSON.stringify(detail), createdAt: new Date().toISOString(), ...extra }));
  }
  private async addCards(userId: number, cards: { printing: Printing; count: number }[]) {
    const before = new Map<string, number>();
    const combined = new Map<string, { printing: Printing; count: number }>();
    for (const card of cards) {
      const row = combined.get(card.printing.printingId) || { printing: card.printing, count: 0 };
      row.count += card.count;
      combined.set(card.printing.printingId, row);
    }
    for (const [printingId, card] of combined) {
      let row = await this.manager.findOne(EconomyHolding, { where: { userId, printingId } });
      before.set(printingId, row?.count || 0);
      const next = (row?.count || 0) + card.count;
      if (!Number.isSafeInteger(next) || next > MAX_HOLDING) fail('LIMIT', '该卡持有数量已达上限。');
      if (!row) row = this.manager.create(EconomyHolding, { userId, printingId });
      row.count = next;
      row.printingJson = JSON.stringify(card.printing);
      await this.manager.save(row);
    }
    return before;
  }
  public async snapshot(userId: number) {
    const user = await this.user(userId);
    const coins = await ownedCoinState(this.manager, user);
    const account = await this.account(userId);
    const holdings = await this.manager.find(EconomyHolding, { where: { userId }, order: { printingId: 'ASC' } });
    const packs = await this.manager.find(EconomyPack, { where: { userId, openedAt: IsNull() }, order: { createdAt: 'ASC', id: 'ASC' } });
    const records = await this.manager.find(EconomyRecord, { where: { userId }, order: { createdAt: 'DESC', id: 'DESC' }, take: 30 });
    const purchases: { productId: string; quantity: string }[] = await this.manager.createQueryBuilder(EconomyRecord, 'r')
      .select('r.productId', 'productId').addSelect('SUM(r.quantity)', 'quantity')
      .where('r.userId = :userId AND r.kind = :kind', { userId, kind: 'purchase' }).groupBy('r.productId').getRawMany();
    const day = checkInDay();
    return { version: 1, userId, balanceMinor: account.balanceMinor, coins,
      checkIn: { day, lastClaimDay: account.lastClaimDay, rewardMinor: 2000, claimed: account.lastClaimDay === day },
      battleReward: { win: BATTLE_REWARD_MINOR.win, draw: BATTLE_REWARD_MINOR.draw, loss: BATTLE_REWARD_MINOR.loss },
      holdings: holdings.map(h => ({ ...JSON.parse(h.printingJson), ...(printingById.get(h.printingId) || {}), count: h.count })),
      basicEnergyPrintings: printings.filter(p => p.basicEnergy && !FREE_BASIC_ENERGIES.some(free => free.sourcePrintingId === p.printingId)),
      // 未拆封清单：卡包与预组都在这里，`deck` 决定客户端把它当卡包还是预组展示。
      // 预组已抽好但不透露是哪一套，所以这里只给包装上的商品名，不给卡组名。
      packs: packs.map(p => ({ id: p.id, productId: p.productId, name: p.name, deck: !!p.deckJson })),
      products: products.filter(p => !p.boxOnly).map(p => ({ id: p.id, name: p.name, kind: p.kind, description: p.description, priceMinor: p.priceMinor,
        packCount: p.packCount, cardsPerPack: p.cardsPerPack, purchaseLimit: p.purchaseLimit,
        ...(p.coinIds ? { coinIds: p.coinIds } : {}),
        ...(p.coinDraw ? { coinDrawCount: p.coinDraw.count } : {}),
        purchased: Number(purchases.find(r => r.productId === p.id)?.quantity || 0),
        available: true,
        prebuiltDeck: !!p.deckCards?.length || !!p.decks?.length,
        rulesNote: p.rulesNote, source: p.source, probabilitySource: p.probabilitySource, pricingSources: p.pricingSources,
        coverImage: p.coverImage })),
      transactions: records.map(r => ({ id: r.id, label: r.label, amountMinor: r.amountMinor, createdAt: r.createdAt })) };
  }
  public async equipCoin(userId: number, coinId: unknown) {
    const user = await this.user(userId);
    if (typeof coinId !== 'string' || !coinById.has(coinId)) return fail('COIN', '硬币不存在。');
    const coins = await ownedCoinState(this.manager, user);
    if (!coins.ownedIds.includes(coinId)) return fail('FORBIDDEN', '尚未拥有此硬币。', 403);
    await this.manager.update(User, userId, { equippedCoinId: coinId });
    return { snapshot: await this.snapshot(userId) };
  }
  public async checkIn(userId: number) {
    await this.user(userId);
    const account = await this.account(userId);
    const day = checkInDay();
    if (account.lastClaimDay !== day) {
      if (account.balanceMinor + 2000 > MAX_BALANCE) fail('LIMIT', '余额已达上限。');
      account.balanceMinor += 2000;
      account.lastClaimDay = day;
      await this.manager.save(account);
      await this.record(userId, 'check-in', '每日签到', 2000, { day });
    }
    return { snapshot: await this.snapshot(userId) };
  }
  private async givePacks(userId: number, product: Product, quantity: number): Promise<string[]> {
    const included = product.recipe ? [{ productId: product.id, count: 1 }] : product.includedPacks || [];
    const count = included.reduce((sum, p) => sum + p.count, 0) * quantity;
    const owned = await this.manager.count(EconomyPack, { where: { userId, openedAt: IsNull() } });
    if (owned + count > 1000) fail('LIMIT', '未拆封超过 1000 件，请先拆开。');
    const ids: string[] = [];
    for (const item of included) {
      const source = productById.get(item.productId)!;
      for (let n = 0; n < item.count * quantity; n++) {
        const packId = id(); ids.push(packId);
        await this.manager.save(this.manager.create(EconomyPack, { id: packId, userId, productId: source.id,
          name: source.name, recipeJson: JSON.stringify(source.recipe), createdAt: new Date().toISOString() }));
      }
    }
    return ids;
  }
  /**
   * 预组不直接入库：每套卡组先作为一件「未拆封」放进玩家的未拆封柜，
   * 拆开时才揭晓是哪一套，并把 60 张卡与卡组本体一起交给账号。
   */
  private async giveUnopenedDecks(userId: number, product: Product,
                                  decks: { name: string; cards: { printingId: string; count: number }[]; cover?: string }[]): Promise<string[]> {
    if (!decks.length) return [];
    const owned = await this.manager.count(EconomyPack, { where: { userId, openedAt: IsNull() } });
    if (owned + decks.length > 1000) fail('LIMIT', '未拆封超过 1000 件，请先拆开。');
    const ids: string[] = [];
    for (const deck of decks) {
      const entryId = id(); ids.push(entryId);
      await this.manager.save(this.manager.create(EconomyPack, { id: entryId, userId, productId: product.id,
        name: product.name, recipeJson: '', deckJson: JSON.stringify(deck), createdAt: new Date().toISOString() }));
    }
    return ids;
  }
  /** 一件未拆封预组里已经抽好的那套卡组；购买时抽定，不随卡表修订改变。 */
  private deckOf(product: Product, amount: number): { name: string; cards: { printingId: string; count: number }[]; cover?: string }[] {
    // 整盒不出随机：一盒就是 decks 里的全部卡组各 1 套。
    if (product.wholeBox && product.decks?.length) return Array.from({ length: amount }, () => product.decks!).flat();
    if (product.decks?.length) return Array.from({ length: amount }, () => this.drawDeck(product)!);
    if (product.deckCards?.length) return Array.from({ length: amount }, () => ({ name: product.deckName || product.name, cards: product.deckCards! }));
    return [];
  }
  /** A prebuilt-deck product also leaves a ready-to-play deck in the buyer's deck box. */
  private async createDeck(userId: number, deckName: string,
                          deckCards: { printingId: string; count: number }[]): Promise<{ id: number; name: string } | undefined> {
    if (!deckCards.length) return undefined;
    const cards = deckCards.reduce<string[]>((list, card) => {
      const engineFullName = printingById.get(card.printingId)!.engineFullName!;
      return list.concat(Array.from({ length: card.count }, () => engineFullName));
    }, []);
    const printingIds = deckCards.flatMap(card => Array.from({ length: card.count }, () => card.printingId));
    const ownership = await checkDeckOwnership(userId, cards, printingIds, undefined, this.manager);
    const analyser = new DeckAnalyser(cards);
    if (!analyser.isValid()) fail('DECK', '预组配方不完整，没有生成卡组，请向管理员反馈。');
    const base = deckName.slice(0, 80);
    let name = base;
    for (let n = 2; await this.manager.findOne(Deck, { where: { name, user: { id: userId } } }); n++) name = `${base} · ${n}`;
    const deck = this.manager.create(Deck, { user: { id: userId } as User, name, cards: JSON.stringify(cards),
      printingIds: JSON.stringify(ownership.printingIds), cardTypes: JSON.stringify(analyser.getDeckType()), formats: JSON.stringify(getValidFormatsForCardList(cards)), isValid: true });
    const saved = await this.manager.save(deck);
    return { id: saved.id, name: saved.name };
  }
  /** 官方随机预组：随机抽一套（嗨皮卡组／对战派对单副）。 */
  private drawDeck(product: Product): { name: string; cards: { printingId: string; count: number }[] } | undefined {
    if (!product.decks?.length) return undefined;
    return product.decks[randomIndex(product.decks.length)];
  }
  /**
   * 新手礼包：随机发一套官方嗨皮组合预组 + 一套官方对战派对预组，卡组与卡牌一起进账号。
   * 只在注册事务里调用，所以失败会让整个注册回滚。
   */
  public async giftRandomStarter(userId: number): Promise<{ id: number; name: string } | undefined> {
    const batches = ['giftStarter', 'giftParty'] as const;
    let first: { id: number; name: string } | undefined;
    for (const flag of batches) {
      const pool = products.filter(p => p[flag] && (p.decks?.length || p.deckCards?.length));
      if (!pool.length) continue;
      const product = pool[randomIndex(pool.length)];
      const drawn = this.drawDeck(product);
      const deckCards = drawn?.cards || product.deckCards || [];
      await this.addCards(userId, deckCards.map(card => ({ printing: printingById.get(card.printingId)!, count: card.count })));
      const deck = await this.createDeck(userId, drawn?.name || product.deckName || product.name, deckCards);
      await this.record(userId, 'gift', `新手礼包：${drawn ? `${product.name} - ${drawn.name}` : product.name}`, 0,
        { productId: product.id, deck });
      first = first || deck;
    }
    return first;
  }
  public async purchase(userId: number, productId: unknown, quantity: unknown) {
    await this.user(userId);
    const amount = integer(quantity, 1, 10);
    const product = typeof productId === 'string' ? productById.get(productId) : undefined;
    if (!product) return fail('PRODUCT', '商品不存在。');
    // 整盒附送的小包（改造包／奖赏包／收集啦151 活动包／嗨皮包）官方没有零售，只能随整盒获得。
    if (product.boxOnly) fail('PRODUCT', '这个包只在整盒或套装里附送，不单独出售。');
    const account = await this.account(userId);
    const purchases = await this.manager.find(EconomyRecord, { where: { userId, kind: 'purchase', productId: product.id } });
    if (product.purchaseLimit !== null && purchases.reduce((sum, p) => sum + p.quantity, 0) + amount > product.purchaseLimit) fail('LIMIT', '已超过该预组的限购次数。');
    const cost = product.priceMinor * amount;
    if (!Number.isSafeInteger(cost) || account.balanceMinor < cost) fail('BALANCE', '游戏元不足。');
    account.balanceMinor -= cost;
    await this.manager.save(account);
    // 预组本体（随机预组抽到的那套、整盒里的每套、固定预组的配方）不直接进收藏：
    // 它在购买时就抽定，但以「未拆封」交给玩家，拆开时才揭晓并入库。
    const decks = this.deckOf(product, amount);
    const deferred = new Map<string, number>();
    for (const deck of decks) for (const card of deck.cards) deferred.set(card.printingId, (deferred.get(card.printingId) || 0) + card.count);
    const cards: { printing: Printing; count: number }[] = [];
    for (const card of product.fixedCards || []) {
      // fixedCards 可能同时包含卡组本体与只进收藏的附件；只扣掉预组带走的那部分。
      const taken = Math.min(deferred.get(card.printingId) || 0, card.count);
      deferred.set(card.printingId, (deferred.get(card.printingId) || 0) - taken);
      if (card.count - taken > 0) cards.push({ printing: printingById.get(card.printingId)!, count: (card.count - taken) * amount });
    }
    await this.addCards(userId, cards);
    const packIds = await this.givePacks(userId, product, amount);
    const deckPackIds = await this.giveUnopenedDecks(userId, product, decks);
    // Read the prior entitlement before recording this purchase, including historical gifts.
    const drawnCoins = product.coinDraw ? drawCoinRewards(product.coinDraw, amount)
      : Array.from({ length: amount }, () => product.coinIds || []).flat();
    const coinRewards = await this.addCoins(userId, drawnCoins);
    // 抽到哪一套只写进明细记录，不写进流水标题：未拆封就不该提前透题。
    await this.record(userId, 'purchase', `购买 ${product.name} × ${amount}`,
      -cost, { product, packIds, cards, deckPackIds, decks: decks.map(d => d.name), coinRewards },
      { productId: product.id, quantity: amount });
    return { snapshot: await this.snapshot(userId), unopenedDecks: deckPackIds.length, coinRewards };
  }
  /** Called only inside the same serialized transaction as debit, cards, packs and ledger. */
  private async addCoins(userId: number, coinIds: string[]): Promise<CoinReward[]> {
    if (coinIds.length > 20) return fail('LIMIT', '每次购买最多获得 20 枚硬币。');
    if (!coinIds.length) return [];
    const before = await ownedCoinState(this.manager, await this.user(userId));
    const rewards = new Map<string, CoinReward>();
    for (const coinId of coinIds) {
      if (!coinById.has(coinId)) return fail('COIN', '硬币不存在。');
      const reward = rewards.get(coinId) || { coinId, count: 0, ownedBefore: before.counts[coinId] || 0 };
      reward.count++;
      rewards.set(coinId, reward);
    }
    for (const reward of rewards.values()) {
      const count = reward.ownedBefore + reward.count;
      if (!Number.isSafeInteger(count)) return fail('LIMIT', '该硬币持有数量已达上限。');
      await this.manager.save(this.manager.create(EconomyCoin, { userId, coinId: reward.coinId, count }));
    }
    return [...rewards.values()];
  }
  public async open(userId: number, packIds: unknown) {
    await this.user(userId);
    if (!Array.isArray(packIds) || packIds.length < 1 || packIds.length > 10 ||
      packIds.some(p => typeof p !== 'string' || !/^[a-f0-9]{32}$/.test(p)) || new Set(packIds).size !== packIds.length) return fail('INVALID', '请选择 1–10 件不同的未拆封。');
    const packs: EconomyPack[] = [];
    for (const packId of packIds) {
      const pack = await this.manager.findOne(EconomyPack, { where: { id: packId, userId } });
      if (!pack || pack.openedAt) return fail('PACK', '未拆封记录不存在、已拆或不属于此账号。请刷新核对。');
      packs.push(pack);
    }
    if (packs.some(p => !!p.deckJson)) return this.openDeck(userId, packs, packIds as string[]);
    const drawn = packs.flatMap(pack => {
      let recipe = JSON.parse(pack.recipeJson) as PackRecipe;
      // 早期 30 周年包把基本能量混进了 5 个随机卡位。仅修正这种旧未拆包，
      // 其他历史配方保持购买时的快照，已经打开的记录也不回写。
      const slots = recipe.slots;
      if (pack.productId === '30th-6' && slots?.length === 2 && slots[0].count === 1 && slots[1].count === 5 &&
        slots[1].groups.some(group => group.printingIds.some(id => printingById.get(id)?.basicEnergy))) {
        recipe = productById.get('30th-6')!.recipe!;
        pack.recipeJson = JSON.stringify(recipe);
      }
      return drawPack(recipe);
    });
    const before = await this.addCards(userId, drawn.map(printing => ({ printing, count: 1 })));
    const increments = new Map<string, number>();
    const totals = new Map<string, number>();
    drawn.forEach(p => totals.set(p.printingId, (totals.get(p.printingId) || 0) + 1));
    const openingId = id();
    const opening = { id: openingId, kind: 'pack' as const, cards: drawn.map(p => {
      const ownedBefore = before.get(p.printingId)! + (increments.get(p.printingId) || 0);
      increments.set(p.printingId, (increments.get(p.printingId) || 0) + 1);
      return { ...p, ownedBefore, count: before.get(p.printingId)! + totals.get(p.printingId)! };
    }) };
    const openedAt = new Date().toISOString();
    for (const pack of packs) { pack.openedAt = openedAt; pack.openingId = openingId; await this.manager.save(pack); }
    await this.record(userId, 'opening', `打开 ${packs.length} 包 · ${drawn.length} 张卡`, 0, { packIds, opening }, { id: openingId });
    return { snapshot: await this.snapshot(userId), opening };
  }
  /** 拆开一件未拆封预组：揭晓购买时已经抽好的那套卡组，卡牌进收藏并在卡组管理里生成它。 */
  private async openDeck(userId: number, packs: EconomyPack[], packIds: string[]) {
    // 一次只揭晓一套：卡组不是卡包，混着拆会让「抽到哪一套」说不清楚。
    if (packs.length !== 1) fail('INVALID', '一次只能拆开一件未拆封预组，请逐件拆。');
    const entry = packs[0];
    const recipe = JSON.parse(entry.deckJson!) as { name: string; cards: { printingId: string; count: number }[]; cover?: string };
    if (!recipe.cards?.length) fail('DECK', '未拆封预组的配方不完整，请向管理员反馈。');
    const before = await this.addCards(userId, recipe.cards.map(card => ({ printing: printingById.get(card.printingId)!, count: card.count })));
    const deck = await this.createDeck(userId, recipe.name, recipe.cards);
    const openingId = id();
    const opening = { id: openingId, kind: 'deck' as const, deckId: deck?.id ?? null, deckName: deck?.name ?? recipe.name,
      productId: entry.productId, productName: entry.name,
      cover: recipe.cover ?? printingById.get(recipe.cards[0].printingId)?.engineFullName ?? null,
      cards: recipe.cards.map(card => ({ ...printingById.get(card.printingId)!, count: card.count, ownedBefore: before.get(card.printingId)! })) };
    entry.openedAt = new Date().toISOString();
    entry.openingId = openingId;
    await this.manager.save(entry);
    await this.record(userId, 'opening', `拆开封套 · ${opening.deckName}`, 0, { packIds, opening }, { id: openingId });
    return { snapshot: await this.snapshot(userId), opening };
  }
  public async opening(userId: number, openingId: unknown) {
    await this.user(userId);
    if (typeof openingId !== 'string') return fail('INVALID', '开包记录无效。');
    const record = await this.manager.findOne(EconomyRecord, { where: { id: openingId, userId, kind: 'opening' } });
    if (!record) return fail('NOT_FOUND', '找不到此账号的开包记录。', 404);
    return { opening: JSON.parse(record.detailJson).opening };
  }
  public async adminUsers(actorId: number, query: unknown) {
    await this.user(actorId, true);
    const q = typeof query === 'string' ? query.trim().slice(0, 80).replace(/[\\%_]/g, '\\$&') : '';
    const users = await this.manager.createQueryBuilder(User, 'u').where("u.name LIKE :q ESCAPE '\\'", { q: `%${q}%` })
      .orderBy('u.id', 'ASC').limit(100).getMany();
    return { users: await Promise.all(users.map(async user => ({ userId: user.id, name: user.name, roleId: user.roleId,
      balanceMinor: (await this.manager.findOne(EconomyAccount, user.id))?.balanceMinor || 0,
      holdingCount: await this.manager.count(EconomyHolding, { where: { userId: user.id } }),
      packCount: await this.manager.count(EconomyPack, { where: { userId: user.id, openedAt: IsNull() } }), lastSeen: user.lastSeen }))) };
  }
  public async adminCatalog(actorId: number, query: unknown) {
    await this.user(actorId, true);
    const q = typeof query === 'string' ? query.trim().slice(0, 80).toLowerCase() : '';
    return { cards: printings.filter(p => `${p.name} ${p.set} ${p.number} ${p.rarity} ${p.printingId}`.toLowerCase().includes(q)).slice(0, 80).map(p => ({ ...p, count: 0 })) };
  }
  public async grant(actorId: number, targetUserId: unknown, amountMinor: unknown, cards: unknown, reason: unknown) {
    const actor = await this.user(actorId, true);
    const target = integer(targetUserId, 1, 999999999);
    await this.user(target);
    const money = amountMinor === undefined ? 0 : integer(amountMinor, 1, 100000000);
    if (typeof reason !== 'string' || !reason.trim() || reason.trim().length > 120) return fail('INVALID', '请填写 1–120 字的发放原因。');
    const entries = cards === undefined ? [] : cards;
    if (!Array.isArray(entries) || entries.length > 50) return fail('INVALID', '单次最多发放 50 种卡。');
    const items = entries.map(card => {
      if (!card || typeof card.printingId !== 'string') return fail('INVALID', '卡牌编号无效。');
      const printing = printingById.get(card.printingId);
      if (!printing) return fail('CARD', '卡牌不在已核对的收藏目录内。');
      return { printing, count: integer(card.count, 1, 10000) };
    });
    if (!money && !items.length) return fail('INVALID', '请指定金额或卡牌。');
    const account = await this.account(target);
    if (account.balanceMinor + money > MAX_BALANCE) return fail('LIMIT', '目标账号余额已达上限。');
    account.balanceMinor += money;
    await this.manager.save(account);
    await this.addCards(target, items);
    const cardCount = items.reduce((sum, c) => sum + c.count, 0);
    await this.record(target, 'grant', `管理员 ${actor.name} 发放${cardCount ? ` · ${cardCount} 张卡` : ''}：${reason.trim()}`,
      money, { reason: reason.trim(), actorName: actor.name, cards: items.map(c => ({ printingId: c.printing.printingId, count: c.count })) }, { actorId });
    return { snapshot: await this.snapshot(target) };
  }
}
