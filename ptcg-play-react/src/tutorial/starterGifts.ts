import type { EconomySnapshot } from '../collection/economyTypes';
import type { TutorialRewardGift } from './TutorialRewardScene';

const PREFIX = '新手礼包：';

/** Presentation of confirmed registration receipts only; never grants cards. */
export function starterGifts(snapshot: EconomySnapshot | null, userId: number, apiUrl: string): TutorialRewardGift[] {
  if (!snapshot || snapshot.userId !== userId) return [];
  return snapshot.transactions
    .filter(record => record.amountMinor === 0 && record.label.startsWith(PREFIX) && record.label.slice(PREFIX.length).trim())
    .slice(0, 2)
    .map(record => {
      const label = record.label.slice(PREFIX.length).trim();
      const product = snapshot.products
        .filter(item => (item.kind === 'starter' || item.kind === 'party') &&
          (label === item.name || label.startsWith(`${item.name} - `)))
        .sort((a, b) => b.name.length - a.name.length)[0];
      const name = product && label.startsWith(`${product.name} - `) ? label.slice(product.name.length + 3).trim() : label;
      const image = product?.coverImage;
      let coverImage: string | undefined;
      if (image && /^\/scans\/packs\/[\w.%+-]+$/.test(image) && !image.includes('..')) {
        try { coverImage = new URL(image, apiUrl).href; } catch { /* Show the generic package rather than an unverified URL. */ }
      }
      return { id: record.id, name, productName: product?.name, coverImage, cardCount: 60 };
    });
}

export function starterGiftSeenKey(userId: number, gifts: readonly Pick<TutorialRewardGift, 'id'>[]): string | null {
  return userId > 0 && gifts.length ? `ptcg.tutorial.gifts-seen:${userId}:${gifts.map(gift => gift.id).sort().join(',')}` : null;
}
