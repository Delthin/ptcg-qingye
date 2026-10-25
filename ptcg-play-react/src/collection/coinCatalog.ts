import catalog from '../../../ptcg-server/src/economy/coins.json';

/** Shared, versioned catalogue: paths are bundled locally, never supplied by another player. */
export interface CoinDefinition {
  id: string;
  name: string;
  frontImage: string;
  backImage: string;
  finish: string;
  source: string;
  seriesId: string;
  pokemon?: string;
  designNumber?: number;
  secret?: boolean;
}
export const DEFAULT_COIN_ID = catalog.defaultCoinId;
export const COINS: readonly CoinDefinition[] = catalog.coins;
export const COIN_SETS = catalog.sets;
export const COIN_COLLECTIONS = catalog.collections;
const index = new Map(COINS.map(coin => [coin.id, coin]));
export const isCoinId = (id: unknown): id is string => typeof id === 'string' && index.has(id);
export const coinById = (id?: string): CoinDefinition => index.get(id ?? '') ?? index.get(DEFAULT_COIN_ID)!;
/** A missing image stays an explicit two-sided coin, not a broken-image glyph. */
export function coinImageFallback(event: { currentTarget: HTMLImageElement }, back = false): void {
  const image = event.currentTarget;
  const fallback = back ? coinById().backImage : coinById().frontImage;
  if (image.getAttribute('src') !== fallback) image.src = fallback;
}
