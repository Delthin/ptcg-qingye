import { randomBytes } from 'crypto';
import * as printingData from './printings.json';
import * as productData from './products.json';
import * as coinPrintingData from './coin-printings.json';
import { coinById, coins, coinSets, DEFAULT_COIN_ID, productCoins } from './coin-ownership';

export interface Printing {
  printingId: string;
  engineFullName: string | null;
  name: string;
  set: string;
  number: string;
  rarity: string;
  /** 数据源加工编号；预组加工不按球纹解释。 */
  specialShinyType?: number;
  image: string;
  basicEnergy?: boolean;
}
export interface CoinDraw { count: number; groups: { weight: number; coinIds: string[] }[]; }
export interface DrawGroup { weight: number; printingIds: string[]; }
export interface DrawSlot { count: number; groups: DrawGroup[]; withoutReplacement?: boolean; }
export interface PackRecipe { slots?: DrawSlot[]; layouts?: { weight: number; slots: DrawSlot[] }[]; }
export interface Product {
  id: string; name: string; kind: string; description: string; priceMinor: number;
  packCount: number; cardsPerPack: number; purchaseLimit: number | null; rulesNote: string;
  /** 商品封面：简中官方卡包图（/scans/packs/<系列>.png）。 */
  coverImage?: string;
  /** Candidates for coinDraw; otherwise fixed gifts accompanying a non-coin product. */
  coinIds?: string[];
  coinDraw?: CoinDraw;
  source: string; probabilitySource?: string; recipeSource?: string; pricingSources?: string[];
  recipe?: PackRecipe;
  fixedCards?: { printingId: string; count: number }[];
  /** 60 张可对战卡组；购买时同时生成一份卡组，fixedCards 另外包含改造卡等仅收藏内容。 */
  deckCards?: { printingId: string; count: number }[];
  /**
   * 官方随机预组：每项是一套 60 张卡组，按官方规则随机封入其中一套
   * （嗨皮卡组 20 元随机 1 套、对战派对 28 元随机 1 副）。购买时抽取一套，卡牌与卡组一起进账号。
   */
  decks?: { name: string; cards: { printingId: string; count: number }[]; cover?: string }[];
  /** 整盒商品：一次购买发出 decks 里的全部卡组（用于官方 88 元整盒）。 */
  wholeBox?: boolean;
  deckName?: string;
  /** 新手礼包候选：注册时随机赠送的官方预组（嗨皮组合）。 */
  giftStarter?: boolean;
  /** 新手礼包候选：注册时随机赠送的官方预组（对战派对）。 */
  giftParty?: boolean;
  includedPacks?: { productId: string; count: number }[];
  /** 只随整盒/套装附送、不单独上架的小包（官方没有零售价）。商城不展示，也不能直接购买。 */
  boxOnly?: boolean;
}
// Explicit basic-energy names supply the four missing effect mappings; rarity is never economic eligibility.
const basicEffects: Record<string, string> = {
  '基本火能量': 'Fire Energy SVE', '基本水能量': 'Water Energy SVE',
  '基本斗能量': 'Fighting Energy SVE', '基本恶能量': 'Darkness Energy SVE',
};
export const printings = [...printingData as unknown as Printing[], ...coinPrintingData as unknown as Printing[]].map(p =>
  p.basicEnergy && !p.engineFullName ? { ...p, engineFullName: basicEffects[p.name] || null } : p);
export const products: Product[] = [
  ...(productData as unknown as Product[]).map(product => {
    const gift = productCoins.get(product.id);
    return gift ? { ...product, coinIds: gift,
      description: `${product.description} 另附赠对应主题硬币 1 枚，直接进入硬币收藏。` } : product;
  }),
  ...coinSets.map(set => ({ ...set, kind: 'coin',
    packCount: set.includedPacks.reduce((sum, pack) => sum + pack.count, 0),
    cardsPerPack: 0, purchaseLimit: null })),
];
export const printingById = new Map(printings.map(p => [p.printingId, p]));
export const productById = new Map(products.map(p => [p.id, p]));

// Node 12 compatible, rejection sampling: no modulo bias, and never Math.random.
export function randomIndex(length: number): number {
  if (!Number.isSafeInteger(length) || length < 1 || length > 0xffffffff) throw new Error('Invalid random pool');
  const ceiling = Math.floor(0x100000000 / length) * length;
  let value: number;
  do { value = randomBytes(4).readUInt32BE(0); } while (value >= ceiling);
  return value % length;
}
function weighted<T extends { weight: number }>(choices: T[], random: (n: number) => number): T {
  const total = choices.reduce((sum, item) => sum + item.weight, 0);
  let draw = random(total);
  for (const item of choices) { if (draw < item.weight) return item; draw -= item.weight; }
  throw new Error('Invalid draw weights');
}
export function drawPack(recipe: PackRecipe, random: (n: number) => number = randomIndex): Printing[] {
  const slots = recipe.layouts ? weighted(recipe.layouts, random).slots : recipe.slots!;
  const result: Printing[] = [];
  for (const slot of slots) {
    const selected = new Set<string>();
    for (let n = 0; n < slot.count; n++) {
      const groups = slot.withoutReplacement
        ? slot.groups.map(group => ({ ...group, printingIds: group.printingIds.filter(id => !selected.has(id)) }))
          .filter(group => group.printingIds.length > 0)
        : slot.groups;
      if (!groups.length) throw new Error('Not enough distinct printings in purchased pack recipe');
      const pool = weighted(groups, random).printingIds;
      const id = pool[random(pool.length)];
      const printing = printingById.get(id);
      if (!printing) throw new Error('Missing printing in purchased pack recipe');
      selected.add(id);
      result.push(printing);
    }
  }
  return result;
}

/** Independent draws with replacement; recipes never come from a purchase request. */
export function drawCoinRewards(recipe: CoinDraw, quantity = 1,
  random: (n: number) => number = randomIndex): string[] {
  const count = recipe.count * quantity;
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 10 ||
    !Number.isSafeInteger(recipe.count) || recipe.count < 1 || count > 20) throw new Error('Invalid coin draw count');
  const result: string[] = [];
  for (let n = 0; n < count; n++) {
    const pool = weighted(recipe.groups, random).coinIds;
    result.push(pool[random(pool.length)]);
  }
  return result;
}

export function validateCatalog(): void {
  const positive = (n: number) => Number.isSafeInteger(n) && n > 0;
  if (printingById.size !== printings.length || productById.size !== products.length) throw new Error('Duplicate economy IDs');
  if (coinById.size !== coins.length || !coinById.has(DEFAULT_COIN_ID)) throw new Error('Invalid coin catalog');
  for (const coin of coins) {
    if (!coin.id || !coin.name || [coin.frontImage, coin.backImage].some(path =>
      !/^\/assets\/coins\/[\w-]+\.png$/.test(path))) throw new Error('Invalid coin image');
  }
  for (const set of coinSets) {
    if (!set.coinIds.length || new Set(set.coinIds).size !== set.coinIds.length ||
      set.coinIds.some(id => id === DEFAULT_COIN_ID || !coinById.has(id))) throw new Error('Invalid coin set');
  }
  for (const p of printings) {
    if (!p.printingId || !p.name || !/^\/scans\/[\w./%+-]+$/.test(p.image) || p.image.includes('..')) throw new Error('Invalid economy printing');
  }
  for (const product of products) {
    if (!positive(product.priceMinor)) throw new Error('Invalid economy price');
    if (product.coinIds?.some(id => id === DEFAULT_COIN_ID || !coinById.has(id))) throw new Error('Invalid product coin');
    if (product.kind === 'coin' && (!product.coinDraw || product.purchaseLimit !== null)) throw new Error('Invalid coin product');
    if (product.coinDraw) {
      const draw = product.coinDraw;
      const candidates = draw.groups.flatMap(group => group.coinIds);
      const totalWeight = draw.groups.reduce((sum, group) => sum + group.weight, 0);
      if (!positive(draw.count) || draw.count * 10 > 20 || !draw.groups.length ||
        !positive(totalWeight) || totalWeight > 0xffffffff ||
        draw.groups.some(group => !positive(group.weight) || !group.coinIds.length) ||
        new Set(candidates).size !== candidates.length || candidates.some(id => !product.coinIds?.includes(id)) ||
        product.coinIds?.some(id => !candidates.includes(id))) throw new Error('Invalid coin draw');
    } else if ((product.coinIds?.length || 0) * 10 > 20) throw new Error('Too many coin gifts');
    const recipes = product.recipe?.layouts?.map(l => l.slots) || (product.recipe?.slots ? [product.recipe.slots] : []);
    for (const slots of recipes) {
      if (slots.reduce((sum, s) => sum + s.count, 0) !== product.cardsPerPack) throw new Error('Wrong pack size');
      for (const slot of slots) {
        if (!positive(slot.count) || !slot.groups.length) throw new Error('Invalid draw slot');
        if (slot.withoutReplacement !== undefined && typeof slot.withoutReplacement !== 'boolean') throw new Error('Invalid distinct draw flag');
        const candidates = slot.groups.flatMap(group => group.printingIds);
        if (slot.withoutReplacement && (new Set(candidates).size !== candidates.length || candidates.length < slot.count)) {
          throw new Error('Not enough distinct printings in draw slot');
        }
        for (const group of slot.groups) {
          if (!positive(group.weight) || !group.printingIds.length || group.printingIds.some(id => !printingById.has(id))) throw new Error('Invalid draw group');
        }
      }
    }
    if (product.recipe?.layouts?.some(l => !positive(l.weight))) throw new Error('Invalid layout weights');
    for (const card of product.fixedCards || []) {
      if (!positive(card.count) || !printingById.has(card.printingId)) throw new Error('Invalid fixed card');
    }
    if (product.deckCards) {
      // A deck that is handed to the player must be a complete, playable 60-card deck.
      if (product.deckCards.reduce((sum, card) => sum + card.count, 0) !== 60) throw new Error('Deck product must hold 60 cards');
      for (const card of product.deckCards) {
        if (!positive(card.count) || !printingById.has(card.printingId)) throw new Error('Invalid deck card');
        if (!printingById.get(card.printingId)!.engineFullName) throw new Error('Deck card without a playable effect');
      }
    }
    for (const deck of product.decks || []) {
      if (!deck.name || !deck.cards.length) throw new Error('Invalid random deck');
      if (deck.cards.reduce((sum, card) => sum + card.count, 0) !== 60) throw new Error('Random deck must hold 60 cards');
      for (const card of deck.cards) {
        if (!positive(card.count) || !printingById.has(card.printingId)) throw new Error('Invalid random deck card');
        if (!printingById.get(card.printingId)!.engineFullName) throw new Error('Random deck card without a playable effect');
      }
    }
    for (const pack of product.includedPacks || []) {
      if (!positive(pack.count) || !productById.get(pack.productId)?.recipe) throw new Error('Invalid included pack');
    }
    if (product.wholeBox && !product.decks?.length) throw new Error('Whole-box product needs its decks');
    if (product.boxOnly && !product.recipe) throw new Error('Box-only product needs a pack recipe');
  }
}
validateCatalog();
