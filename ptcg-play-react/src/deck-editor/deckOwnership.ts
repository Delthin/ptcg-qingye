import { cardPrintingKey, type Card } from 'ptcg-server';
import { cardDisplayName } from '../duo/chineseCatalog';
import { canAddOne, isBasicEnergy, maxCountForPrinting, type CanAddResult } from './deckRules';
import { isFreeBasicEnergy } from './energyPrintings';
import type { DeckSlot } from './types';

/** Effect totals and any explicitly selected printing are both checked; free defaults bypass stock. */
export function createDeckOwnership(ownedCounts: ReadonlyMap<string, number> | undefined, unavailableReason: string) {
  const ownershipKey = (card: Card) => isBasicEnergy(card) ? card.printingId || card.fullName : card.fullName;
  function limit(card: Card): number {
    return isFreeBasicEnergy(card) ? Infinity : (ownedCounts?.get(ownershipKey(card)) ?? 0);
  }
  function countReason(card: Card, count: number): string | undefined {
    if (count <= 0 || isFreeBasicEnergy(card)) return undefined;
    if (!ownedCounts) return unavailableReason;
    const held = Math.min(limit(card), card.printingId ? ownedCounts.get(card.printingId) ?? 0 : Infinity);
    if (held === 0) return `未持有，缺 ${count} 张。`;
    if (count > held) return `持有 ${held} 张，卡组使用 ${count} 张，缺 ${count - held} 张。`;
    return undefined;
  }
  function validate(slots: DeckSlot[]): CanAddResult {
    const counts = new Map<string, DeckSlot>();
    for (const slot of slots) {
      const key = ownershipKey(slot.card);
      const previous = counts.get(key);
      counts.set(key, { card: slot.card, count: (previous?.count ?? 0) + slot.count });
    }
    const missing = [...counts.values()].filter(slot => !isFreeBasicEnergy(slot.card) && (!ownedCounts || slot.count > limit(slot.card)));
    if (missing.length) {
      if (!ownedCounts) return { ok: false, reason: unavailableReason };
      const total = missing.reduce((sum, slot) => sum + slot.count - limit(slot.card), 0);
      const preview = missing.slice(0, 3).map(slot => `${cardDisplayName(slot.card)} 缺 ${slot.count - limit(slot.card)} 张`).join('；');
      return { ok: false, reason: `收藏不足，共缺 ${total} 张：${preview}${missing.length > 3 ? '…' : ''}。` };
    }
    const editions = new Map<string, DeckSlot>();
    for (const slot of slots) {
      if (!slot.card.printingId || isFreeBasicEnergy(slot.card)) continue;
      const previous = editions.get(slot.card.printingId);
      editions.set(slot.card.printingId, { card: slot.card, count: (previous?.count ?? 0) + slot.count });
    }
    const unavailable = [...editions.values()].find(slot => countReason(slot.card, slot.count));
    return unavailable ? { ok: false, reason: `${cardDisplayName(unavailable.card)}：${countReason(unavailable.card, unavailable.count)}` } : { ok: true };
  }
  function validateIncrease(slots: DeckSlot[], card: Card, count: number): CanAddResult {
    if (!ownedCounts && isFreeBasicEnergy(card)) return { ok: true };
    return validate([...slots.filter(slot => cardPrintingKey(slot.card) !== cardPrintingKey(card)), { card, count }]);
  }
  function maxCount(slots: DeckSlot[], card: Card): number {
    const without = slots.filter(slot => cardPrintingKey(slot.card) !== cardPrintingKey(card));
    const current = slots.filter(slot => cardPrintingKey(slot.card) === cardPrintingKey(card)).reduce((sum, slot) => sum + slot.count, 0);
    const canIncrease = validate(without).ok || (!ownedCounts && isFreeBasicEnergy(card));
    const borrowed = without.filter(s => ownershipKey(s.card) === ownershipKey(card)).reduce((sum, s) => sum + s.count, 0);
    const heldPrinting = card.printingId && !isFreeBasicEnergy(card)
      ? (ownedCounts?.get(card.printingId) ?? 0) - without.filter(s => s.card.printingId === card.printingId).reduce((sum, s) => sum + s.count, 0)
      : Infinity;
    const ceiling = Math.min(maxCountForPrinting(slots, card), limit(card) - borrowed, heldPrinting, canIncrease ? Infinity : current);
    let result = 0;
    while (result < ceiling && canAddOne([...without, { card, count: result }], card).ok) result++;
    return result;
  }
  function canAdd(slots: DeckSlot[], card: Card): CanAddResult {
    const current = slots.filter(slot => cardPrintingKey(slot.card) === cardPrintingKey(card)).reduce((sum, slot) => sum + slot.count, 0);
    const ownership = validateIncrease(slots, card, current + 1);
    if (!ownership.ok) return ownership;
    const rules = canAddOne(slots, card);
    if (!rules.ok) return rules;
    if (current >= maxCount(slots, card)) return { ok: false, reason: '已达构筑上限。' };
    return { ok: true };
  }
  return { limit, countReason, validate, validateIncrease, maxCount, canAdd };
}
