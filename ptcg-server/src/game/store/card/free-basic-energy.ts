import { Card } from './card';

/** Synthetic free defaults. These IDs are NOT economy printings; scans are reused only as art. */
export const FREE_BASIC_ENERGIES = [
  { printingId: 'free:grass', sourcePrintingId: 'chs:12651', engineFullName: 'Grass Energy SVE', name: '基本草能量', image: '/scans/duo/12651.png' },
  { printingId: 'free:fire', sourcePrintingId: 'chs:12652', engineFullName: 'Fire Energy SVE', name: '基本火能量', image: '/scans/duo/12652.png' },
  { printingId: 'free:water', sourcePrintingId: 'chs:12653', engineFullName: 'Water Energy SVE', name: '基本水能量', image: '/scans/duo/12653.png' },
  { printingId: 'free:lightning', sourcePrintingId: 'chs:12654', engineFullName: 'Lightning Energy SVE', name: '基本雷能量', image: '/scans/duo/12654.png' },
  { printingId: 'free:psychic', sourcePrintingId: 'chs:12655', engineFullName: 'Psychic Energy SVE', name: '基本超能量', image: '/scans/duo/12655.png' },
  { printingId: 'free:fighting', sourcePrintingId: 'chs:12656', engineFullName: 'Fighting Energy SVE', name: '基本斗能量', image: '/scans/duo/12656.png' },
  { printingId: 'free:darkness', sourcePrintingId: 'chs:12657', engineFullName: 'Darkness Energy SVE', name: '基本恶能量', image: '/scans/duo/12657.png' },
  { printingId: 'free:metal', sourcePrintingId: 'chs:12658', engineFullName: 'Metal Energy SVE', name: '基本钢能量', image: '/scans/duo/12658.png' },
];
export interface CardAppearance { printingId: string; image: string; }
/** The verified ordinary source editions are aliases, never inventory-gated collectibles. */
export function canonicalFreePrintingId(id?: string | null): string | undefined {
  return FREE_BASIC_ENERGIES.find(p => p.printingId === id || p.sourcePrintingId === id)?.printingId;
}
/** UI identity only; fullName always remains the rule identity. */
export function cardPrintingKey(card: Pick<Card, 'fullName' | 'printingId'>): string {
  const printingId = canonicalFreePrintingId(card.printingId) || card.printingId;
  return printingId ? `${card.fullName}::${printingId}` : card.fullName;
}
