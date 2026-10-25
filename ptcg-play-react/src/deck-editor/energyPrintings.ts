import { FREE_BASIC_ENERGIES, canonicalFreePrintingId, cardPrintingKey, type Card } from 'ptcg-server';
import type { OwnedPrinting } from '../collection/economyTypes';
import { isBasicEnergy } from './deckRules';

export { cardPrintingKey };
export function isFreeBasicEnergy(card: Card): boolean {
  return isBasicEnergy(card) && (!card.printingId || !!canonicalFreePrintingId(card.printingId));
}
export function withEnergyPrinting(card: Card, printing: Omit<OwnedPrinting, 'count'>): Card {
  const free = isBasicEnergy(card) ? FREE_BASIC_ENERGIES.find(p => p.printingId === canonicalFreePrintingId(printing.printingId)) : undefined;
  return Object.assign(Object.create(Object.getPrototypeOf(card)), card, {
    printingId: free?.printingId || printing.printingId, printingImage: free?.image || printing.image, printingName: printing.name,
    printingSet: printing.set, printingNumber: printing.number, printingRarity: printing.rarity,
  });
}
export function defaultEnergyCard(card: Card): Card {
  if (!isBasicEnergy(card) || card.printingId) return card;
  const free = FREE_BASIC_ENERGIES.find(p => p.engineFullName === card.fullName || p.engineFullName.replace(/ SVE$/, '') === card.name);
  return free ? withEnergyPrinting(card, { ...free, set: '免费默认', number: '', rarity: '' }) : card;
}
export function energyEditionLabel(card: Card): string | undefined {
  if (!isBasicEnergy(card)) return undefined;
  return isFreeBasicEnergy(card) ? '免费默认 · ∞' : `收藏版 · ${card.printingSet || card.printingId} ${card.printingNumber || ''}`;
}
