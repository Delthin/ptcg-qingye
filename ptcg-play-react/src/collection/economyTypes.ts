import { DEFAULT_COIN_ID, isCoinId } from './coinCatalog';

export interface OwnedPrinting {
  printingId: string;
  engineFullName: string | null;
  basicEnergy?: boolean;
  count: number;
  name: string;
  set: string;
  number: string;
  rarity?: string;
  /** 简中的印刷纹样（精灵球纹样 / 大师球纹样）；★ 只是工艺标记，不印在卡面。 */
  pattern?: string;
  /** Same-origin /scans path; versions remain distinct in the collection. */
  image?: string;
}
export interface ShopProduct {
  id: string;
  name: string;
  kind: 'booster' | 'starter' | 'party' | 'box' | 'coin';
  /** Random-coin candidates, or fixed gift coins when coinDrawCount is absent. */
  coinIds?: string[];
  coinDrawCount?: number;
  description: string;
  priceMinor: number;
  coverImage?: string;
  packCount?: number;
  cardsPerPack?: number;
  purchaseLimit: number | null;
  purchased: number;
  available: boolean;
  /** True when buying this product also leaves a ready-to-play deck in the deck box. */
  prebuiltDeck?: boolean;
  unavailableReason?: string;
  rulesNote: string;
}
/** `deck` 为真表示这是未拆封的预组：拆开才知道抽到的是哪一套。 */
export interface OwnedPack { id: string; productId: string; name: string; deck?: boolean; }
export interface WalletEntry { id: string; label: string; amountMinor: number; createdAt: string; }
/** Daily check-in state; `day`/`lastClaimDay` are Beijing-time YYYY-MM-DD strings from the server. */
export interface CheckInState {
  day: string;
  lastClaimDay: string | null;
  rewardMinor: number;
  claimed: boolean;
}
export interface EconomySnapshot {
  version: 1;
  userId: number;
  balanceMinor: number;
  holdings: OwnedPrinting[];
  basicEnergyPrintings?: Omit<OwnedPrinting, 'count'>[];
  /** Absent only on older servers; never infer ownership from local storage. */
  coins?: { ownedIds: string[]; equippedId: string; counts?: Record<string, number> };
  products: ShopProduct[];
  packs: OwnedPack[];
  transactions: WalletEntry[];
  checkIn: CheckInState;
  /** Server-authored coin payout for a settled match, in minor units. */
  battleReward?: BattleRewardTable;
}
export interface BattleRewardTable { win: number; draw: number; loss: number; }
export interface OpenedCard extends OwnedPrinting { ownedBefore: number; }
export interface PackOpening { id: string; kind?: 'pack'; cards: OpenedCard[]; }
/** 拆开一套未拆封预组的结果：卡组已入库，并在「卡组管理」里生成同名牌组。 */
export interface DeckOpening { id: string; kind: 'deck'; deckId: number | null; deckName: string;
  productId: string; productName: string; cover: string | null; cards: OpenedCard[]; }
export type EconomyOpening = PackOpening | DeckOpening;
export interface CoinReward { coinId: string; count: number; ownedBefore: number; }
export interface EconomyMutation { snapshot: EconomySnapshot; opening?: EconomyOpening; coinRewards?: CoinReward[]; }

export function formatGameMoney(minor: number): string {
  return (minor / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
/** Parse user-typed yuan text into exact minor units via string math; never float*100. */
export function parseGameMoneyToMinor(text: string): number | null {
  const match = /^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(text.trim());
  if (!match) return null;
  const cents = Number(`${match[1]}${(match[2] ?? '').padEnd(2, '0')}`);
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}
export function ownedByEffect(holdings: OwnedPrinting[]): Map<string, number> {
  const result = new Map<string, number>();
  for (const printing of holdings) if (printing.engineFullName) result.set(printing.engineFullName, (result.get(printing.engineFullName) ?? 0) + printing.count);
  return result;
}

const integer = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const nonempty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
function validPrinting(value: OwnedPrinting): boolean {
  return !!value && nonempty(value.printingId) && (value.engineFullName === null || nonempty(value.engineFullName)) && integer(value.count) &&
    nonempty(value.name) && typeof value.set === 'string' && typeof value.number === 'string' &&
    (value.rarity === undefined || typeof value.rarity === 'string') &&
    (value.pattern === undefined || typeof value.pattern === 'string') &&
    (value.image === undefined || typeof value.image === 'string' && /^\/scans\/[\w./%+-]+$/.test(value.image) && !value.image.includes('..'));
}
function validCoins(value: NonNullable<EconomySnapshot['coins']>): boolean {
  return !!value && Array.isArray(value.ownedIds) && value.ownedIds.every(isCoinId) &&
    new Set(value.ownedIds).size === value.ownedIds.length && value.ownedIds.includes(DEFAULT_COIN_ID) &&
    isCoinId(value.equippedId) && value.ownedIds.includes(value.equippedId) &&
    (value.counts === undefined || !!value.counts && typeof value.counts === 'object' && !Array.isArray(value.counts) &&
      Object.keys(value.counts).length === value.ownedIds.length && value.ownedIds.every(id =>
        Object.hasOwn(value.counts!, id) && integer(value.counts![id]) && value.counts![id] > 0));
}
const dayPattern = /^\d{4}-\d{2}-\d{2}$/;
function validCheckIn(value: CheckInState): boolean {
  return !!value && dayPattern.test(value.day) && (value.lastClaimDay === null || dayPattern.test(value.lastClaimDay)) &&
    integer(value.rewardMinor) && typeof value.claimed === 'boolean';
}
/** Validate a list of OwnedPrinting (e.g. the admin catalog) without assuming ownership counts. */
export function validatePrintings(value: unknown): OwnedPrinting[] {
  if (!Array.isArray(value) || !value.every(validPrinting)) throw new Error('卡牌目录返回的数据不完整，请重新搜索。');
  return value as OwnedPrinting[];
}
const battleReward = (value: unknown): value is BattleRewardTable =>
  !!value && typeof value === 'object' && integer((value as BattleRewardTable).win) &&
  integer((value as BattleRewardTable).draw) && integer((value as BattleRewardTable).loss);
/** Reject malformed/cross-account state rather than displaying invented balances or counts. */
export function validateEconomySnapshot(input: unknown, userId: number): EconomySnapshot {
  const value = input as EconomySnapshot | null | undefined;
  if (!value || typeof input !== 'object' || value.version !== 1 || value.userId !== userId || !integer(value.balanceMinor) ||
    !Array.isArray(value.holdings) || !value.holdings.every(validPrinting) ||
    (value.coins !== undefined && !validCoins(value.coins)) ||
    (value.basicEnergyPrintings !== undefined && (!Array.isArray(value.basicEnergyPrintings) ||
      !value.basicEnergyPrintings.every(p => validPrinting({ ...p, count: 0 }) && p.basicEnergy === true))) ||
    !Array.isArray(value.packs) || !value.packs.every(p => p && nonempty(p.id) && nonempty(p.productId) && nonempty(p.name) &&
      (p.deck === undefined || typeof p.deck === 'boolean')) ||
    !Array.isArray(value.products) || !value.products.every(p => p && nonempty(p.id) && nonempty(p.name) &&
      ['booster', 'starter', 'party', 'box', 'coin'].includes(p.kind) && integer(p.priceMinor) && integer(p.purchased) &&
      (p.coinIds === undefined || Array.isArray(p.coinIds) && p.coinIds.length > 0 && p.coinIds.every(isCoinId) &&
        new Set(p.coinIds).size === p.coinIds.length && !p.coinIds.includes(DEFAULT_COIN_ID)) &&
      (p.kind !== 'coin' || !!p.coinIds?.length) &&
      (p.coinDrawCount === undefined || p.kind === 'coin' && integer(p.coinDrawCount) && p.coinDrawCount >= 1 && p.coinDrawCount <= 20) &&
      (p.purchaseLimit === null || integer(p.purchaseLimit)) && typeof p.available === 'boolean' &&
      typeof p.description === 'string' && typeof p.rulesNote === 'string' &&
      (p.coverImage === undefined || typeof p.coverImage === 'string') &&
      (p.unavailableReason === undefined || typeof p.unavailableReason === 'string') &&
      (p.packCount === undefined || integer(p.packCount)) && (p.cardsPerPack === undefined || integer(p.cardsPerPack)) &&
      (p.prebuiltDeck === undefined || typeof p.prebuiltDeck === 'boolean')) ||
    !Array.isArray(value.transactions) || !value.transactions.every(t => t && nonempty(t.id) &&
      typeof t.label === 'string' && Number.isSafeInteger(t.amountMinor) && typeof t.createdAt === 'string') ||
    !validCheckIn(value.checkIn) ||
    (value.battleReward !== undefined && !battleReward(value.battleReward))) {
    throw new Error('收藏服务返回的数据不完整，请稍后刷新。');
  }
  if (new Set(value.holdings.map(p => p.printingId)).size !== value.holdings.length ||
      new Set(value.packs.map(p => p.id)).size !== value.packs.length ||
      new Set(value.products.map(p => p.id)).size !== value.products.length) throw new Error('收藏服务返回了重复记录，请刷新核对。');
  return value;
}
export function validateCoinRewards(value: CoinReward[] | undefined): CoinReward[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 20 || new Set(value.map(reward => reward?.coinId)).size !== value.length ||
      !value.every(reward => reward && isCoinId(reward.coinId) && integer(reward.count) && reward.count > 0 && reward.count <= 20 &&
        integer(reward.ownedBefore) && integer(reward.ownedBefore + reward.count)) ||
      value.reduce((total, reward) => total + reward.count, 0) > 20) {
    throw new Error('硬币结果尚未核实，请刷新收藏，不要重复购买。');
  }
  return value;
}
export function validateOpening(value: EconomyOpening | undefined): EconomyOpening {
  if (!value || !nonempty(value.id) || !Array.isArray(value.cards) || !value.cards.length ||
    !value.cards.every(c => validPrinting(c) && integer(c.ownedBefore))) throw new Error('拆封结果尚未核实，请刷新未拆封和收藏，不要重复提交。');
  if ('kind' in value && value.kind === 'deck') {
    if (!nonempty(value.deckName) || !nonempty(value.productId) || !nonempty(value.productName) ||
      (value.deckId !== null && !integer(value.deckId)) || (value.cover !== null && typeof value.cover !== 'string')) {
      throw new Error('拆封结果尚未核实，请刷新未拆封和收藏，不要重复提交。');
    }
  }
  return value;
}
