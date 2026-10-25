import { EntityManager, getManager } from 'typeorm';
import { CardManager } from '../game/cards/card-manager';
import { DeckAnalyser } from '../game/cards/deck-analyser';
import { EnergyType, SuperType } from '../game/store/card/card-types';
import { CardAppearance, FREE_BASIC_ENERGIES } from '../game/store/card/free-basic-energy';
import { Deck } from '../storage/model/deck';
import { EconomyHolding } from '../storage/economy';
import { printingById } from './catalog';

export class DeckOwnershipError extends Error {
  constructor(message: string) { super(message); this.name = 'DeckOwnershipError'; }
}
const invalid = (message: string): never => { throw new DeckOwnershipError(message); };
export interface DeckOwnershipResult {
  cards: string[];
  printingIds: (string | null)[];
  appearances: (CardAppearance | null)[];
  owned: boolean;
}

/** No mutations: collection is permanent and may be reused by other decks. */
export function validateDeckOwnership(cards: unknown, ids: unknown,
  holdings: { printingId: string; count: number }[], legacyDraftCards?: string[]): DeckOwnershipResult {
  if (!Array.isArray(cards) || cards.length > 60 || cards.some(c => typeof c !== 'string')) invalid('卡组最多 60 张，卡表无效。');
  const manager = CardManager.getInstance();
  const resolved = (cards as string[]).map(name => manager.getCardByName(name) || invalid('卡牌不存在。'));
  const names = resolved.map(c => c.fullName);
  if (!new DeckAnalyser(names).isValid(undefined, true)) invalid('卡组超过同名或特殊卡构筑上限。');
  if (ids !== undefined && ids !== null && (!Array.isArray(ids) || ids.length !== names.length ||
    ids.some(id => id !== null && typeof id !== 'string'))) invalid('印刷引用必须与每份卡对齐。');
  const supplied = (ids || names.map(() => null)) as (string | null)[];
  const ownedPrintings = new Map<string, number>();
  const ownedEffects = new Map<string, number>();
  for (const h of holdings) {
    if (!Number.isSafeInteger(h.count) || h.count < 0) continue;
    ownedPrintings.set(h.printingId, (ownedPrintings.get(h.printingId) || 0) + h.count);
    const effect = printingById.get(h.printingId)?.engineFullName;
    if (effect) ownedEffects.set(effect, (ownedEffects.get(effect) || 0) + h.count);
  }
  const usedPrintings = new Map<string, number>();
  const usedEffects = new Map<string, number>();
  const printingIds: (string | null)[] = [];
  const appearances: (CardAppearance | null)[] = [];
  resolved.forEach((card, i) => {
    const basic = card.superType === SuperType.ENERGY && card.energyType === EnergyType.BASIC;
    // Legacy basic energies map by their rule name to one of the explicit eight defaults.
    const fallback = FREE_BASIC_ENERGIES.find(p => p.engineFullName === card.fullName ||
      manager.getCardByName(p.engineFullName)?.name === card.name);
    const ref = supplied[i] || (basic ? fallback?.printingId : null);
    if (basic && !ref) invalid('该基础能量没有免费默认映射。');
    const free = FREE_BASIC_ENERGIES.find(p => p.printingId === ref || p.sourcePrintingId === ref);
    if (free) {
      if (!basic || !fallback || free.printingId !== fallback.printingId) invalid('免费能量引用与规则卡不匹配。');
      printingIds.push(free.printingId); appearances.push({ printingId: free.printingId, image: free.image });
      return;
    }
    const printing = ref ? printingById.get(ref) : undefined;
    if (ref && (!printing || printing.engineFullName !== card.fullName || !!printing.basicEnergy !== basic)) invalid('印刷引用与规则卡不匹配。');
    // An explicit collectible appearance requires that exact printing, for special
    // energy and other cards as well. Effect-only legacy copies still use the aggregate.
    if (printing) usedPrintings.set(printing.printingId, (usedPrintings.get(printing.printingId) || 0) + 1);
    if (!basic) usedEffects.set(card.fullName, (usedEffects.get(card.fullName) || 0) + 1);
    printingIds.push(ref || null);
    appearances.push(printing ? { printingId: printing.printingId, image: printing.image } : null);
  });
  for (const [ref, count] of usedPrintings) if (count > (ownedPrintings.get(ref) || 0)) invalid(`收藏版 ${ref} 持有不足。`);
  const legacy = new Map<string, number>();
  for (const name of legacyDraftCards || []) {
    const fullName = manager.getCardByName(name)?.fullName;
    if (fullName) legacy.set(fullName, (legacy.get(fullName) || 0) + 1);
  }
  let owned = true;
  for (const [effect, count] of usedEffects) if (count > (ownedEffects.get(effect) || 0)) {
    // Existing practice decks can remain drafts, but may not increase missing cards or launch a game.
    if (count > (legacy.get(effect) || 0)) invalid(`卡牌 ${effect} 持有不足。`);
    owned = false;
  }
  return { cards: names, printingIds, appearances, owned };
}

export function storedPrintingIds(deck: Deck): (string | null)[] | undefined {
  return deck.printingIds ? JSON.parse(deck.printingIds) : undefined;
}
export async function checkDeckOwnership(userId: number, cards: unknown, ids?: unknown,
  legacyDraftCards?: string[], manager: EntityManager = getManager()): Promise<DeckOwnershipResult> {
  const holdings = await manager.find(EconomyHolding, { where: { userId } });
  return validateDeckOwnership(cards, ids, holdings, legacyDraftCards);
}
/** Actual entry points reject incomplete/non-playable decks before mutating a game. */
export async function checkPlayableDeckOwnership(userId: number, cards: unknown, ids?: unknown): Promise<DeckOwnershipResult> {
  const result = await checkDeckOwnership(userId, cards, ids);
  if (!new DeckAnalyser(result.cards).isValid()) invalid('卡组不符合对战规则。');
  return result;
}
export async function playableStoredDeck(userId: number, deckId: unknown): Promise<DeckOwnershipResult & { deck: Deck }> {
  if (!Number.isSafeInteger(deckId) || (deckId as number) <= 0) invalid('请选择自己的卡组。');
  const deck = await Deck.findOne({ where: { id: deckId, user: { id: userId } } });
  if (!deck) return invalid('卡组不存在。');
  const result = await checkPlayableDeckOwnership(userId, JSON.parse(deck.cards), storedPrintingIds(deck));
  return { ...result, deck };
}
