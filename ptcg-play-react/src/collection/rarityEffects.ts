/** Visual treatments, not new rarity labels or probability claims. Unknown metadata stays neutral. */
export type RarityEffect = 'standard' | 'foil' | 'prism' | 'crown';
export function rarityEffect(rarity?: string, pattern?: string): RarityEffect {
  const value = rarity?.trim().toUpperCase();
  const tier = rarityTier(value);
  // 精灵球纹样 / 大师球纹样本身就是闪卡工艺，底档再低也不该按普通卡展示。
  return pattern && tier === 'standard' ? 'foil' : tier;
}
function rarityTier(value?: string): RarityEffect {
  if (!value) return 'standard';
  if (['SAR', 'UR', 'FUR', 'HR', '★★★'].includes(value)) return 'crown';
  if (['SR', 'SSR', 'AR', 'CHR', 'CSR', 'RGB', '★★'].includes(value)) return 'prism';
  if (['R', 'RR', 'RRR', 'ACE', 'S', '经典卡', '皮卡丘', '★'].includes(value) || /^(C|U|R)★{1,2}$/.test(value)) return 'foil';
  return 'standard';
}
export const rarityEffectRank: Record<RarityEffect, number> = { standard: 0, foil: 1, prism: 2, crown: 3 };
