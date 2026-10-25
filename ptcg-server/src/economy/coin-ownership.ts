import { EntityManager, In } from 'typeorm';
import { EconomyCoin, EconomyRecord } from '../storage/economy';
import { User } from '../storage/model/user';
import * as catalog from './coins.json';

export const DEFAULT_COIN_ID = catalog.defaultCoinId;
export const coins = catalog.coins;
export const coinSets = catalog.sets;
export const coinById = new Map(coins.map(coin => [coin.id, coin]));
export const productCoins = new Map(catalog.productCoins.map(gift => [gift.productId, gift.coinIds]));
export interface OwnedCoinState { ownedIds: string[]; equippedId: string; counts: Record<string, number>; }

/** Read-only entitlement: old deck purchases are a floor, never another increment. */
export async function ownedCoinState(manager: EntityManager, user: User): Promise<OwnedCoinState> {
  const rows = await manager.find(EconomyCoin, { where: { userId: user.id } });
  const counts: Record<string, number> = { [DEFAULT_COIN_ID]: 1 };
  for (const row of rows) {
    if (coinById.has(row.coinId)) counts[row.coinId] = Number.isSafeInteger(row.count) && row.count > 0 ? row.count : 1;
  }
  const purchases = await manager.find(EconomyRecord, {
    where: { userId: user.id, kind: 'purchase', productId: In([...productCoins.keys()]) },
  });
  const historical: Record<string, number> = {};
  for (const purchase of purchases) {
    if (!Number.isSafeInteger(purchase.quantity) || purchase.quantity < 1 || purchase.quantity > 10 ||
      !Number.isSafeInteger(purchase.amountMinor) || purchase.amountMinor >= 0) continue;
    for (const coinId of productCoins.get(purchase.productId!) || []) {
      const count = (historical[coinId] || 0) + purchase.quantity;
      if (!Number.isSafeInteger(count)) throw new Error('Invalid historical coin count');
      historical[coinId] = count;
    }
  }
  for (const [coinId, count] of Object.entries(historical)) counts[coinId] = Math.max(counts[coinId] || 0, count);
  const ownedIds = coins.filter(coin => counts[coin.id] > 0).map(coin => coin.id);
  const equippedId = coinById.has(user.equippedCoinId) && counts[user.equippedCoinId] > 0
    ? user.equippedCoinId : DEFAULT_COIN_ID;
  return { ownedIds, equippedId, counts };
}
