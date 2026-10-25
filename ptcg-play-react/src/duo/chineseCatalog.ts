import type { Attack, Card, Power } from 'ptcg-server';
import { apiGet } from '../api/client';
import rarityFallback from '../collection/rarityFallback.json';

export type ChineseCard = {
  name: string; set: string; number: string; regulationMark: string; image: string;
  text: string; hp: number | null;
  rarity?: string;
  /** 简中的印刷纹样：精灵球纹样 / 大师球纹样（★ 只代表工艺，不印在卡面）。 */
  pattern?: string;
  printingId?: string;
  attacks: { id: string; name: string; text: string; damage?: string }[];
  powers: { id: string; name: string; text: string }[];
};
let catalog: Record<string, ChineseCard> = {};
let names = new Map<string, string>();
let actions = new Map<string, string>();
let generation = 0;

/** Card text/images are fetched only after login, not bundled into the public SPA. */
export async function loadChineseCatalog(cards: Card[]): Promise<void> {
  const version = ++generation;
  const data = await apiGet<Record<string, ChineseCard>>('/scans/duo/catalog.json');
  if (version !== generation) throw new Error('Card catalog request superseded');
  catalog = data;
  names = new Map();
  actions = new Map();
  for (const card of cards) {
    const zh = catalog[card.fullName];
    if (!zh) continue;
    names.set(card.name, zh.name);
    names.set(card.fullName, zh.name);
    for (const action of [...zh.attacks, ...zh.powers]) actions.set(action.id, action.name);
  }
}
export function clearChineseCatalog(): void {
  generation++;
  catalog = {};
  names.clear();
  actions.clear();
}
export function chineseCard(card: Pick<Card, 'fullName'>): ChineseCard | undefined {
  return catalog[card.fullName];
}
export function isChineseCard(card: Card): boolean { return !!catalog[card.fullName]; }
/** Exact mapped printings only. Unknown rarity is not inferred from an ex name or effect. */
export function cardRarity(card: Pick<Card, 'fullName' | 'printingRarity'>): string | undefined {
  if (card.printingRarity !== undefined) return card.printingRarity;
  return catalog[card.fullName]?.rarity ?? (rarityFallback as Record<string, string>)[card.fullName];
}
/** 简中卡面只印底档稀有度；★/★★ 是印刷纹样，显示时合成「C · 精灵球纹样」。
 * 宝石包自己的 ● / ◆ / ★ / ★★ / ★★★ 是简中独占的稀有度标记，原样显示。 */
export function rarityLabel(rarity?: string, pattern?: string): string | undefined {
  const value = rarity?.trim();
  if (!value) return pattern;
  const legacy = /^([^★]+)(★|★★)$/.exec(value);
  if (!legacy) return pattern ? `${value} · ${pattern}` : value;
  return `${legacy[1]} · ${legacy[2] === '★' ? '精灵球纹样' : '大师球纹样'}`;
}
export function cardPattern(card: Pick<Card, 'fullName'>): string | undefined {
  return catalog[card.fullName]?.pattern;
}
export function cardDisplayName(card: Pick<Card, 'fullName' | 'name' | 'printingName'>): string {
  if (card.printingName) return card.printingName;
  if (card.name === 'Unknown') return '背面卡牌';
  return catalog[card.fullName]?.name ?? names.get(card.name) ?? card.name;
}
export function trainerDisplayName(name: string): string {
  return ({ red: '赤红', leaf: '叶子' } as Record<string, string>)[name] ?? name;
}
export function localizeGameValue(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const draw = /^Draw (\d+) card\(s\)$/.exec(value);
  if (draw) return `额外抽取 ${draw[1]} 张卡牌`;
  return names.get(value) ?? actions.get(value) ?? trainerDisplayName(value);
}
export function cardSearchFields(card: Card): string[] {
  const zh = catalog[card.fullName];
  const edition = [card.printingName, card.printingSet, card.printingNumber, card.printingRarity].filter((s): s is string => !!s);
  return zh ? [...edition, zh.name, zh.set, zh.number, zh.text, ...zh.attacks.flatMap(a => [a.name, a.text]),
    ...zh.powers.flatMap(a => [a.name, a.text])] : [];
}
export function displayAttack(card: Card, attack: Attack): { name: string; text: string; damage: string } {
  const zh = catalog[card.fullName]?.attacks.find(a => a.id === attack.name);
  return { name: zh?.name ?? actions.get(attack.name) ?? attack.name,
    text: zh?.text ?? attack.text ?? '',
    damage: zh?.damage ?? (attack.damage > 0 ? `${attack.damage}${attack.damageCalculation ?? ''}` : '') };
}
export function displayPower(card: Card, power: Power): { name: string; text: string } {
  const zh = catalog[card.fullName]?.powers.find(a => a.id === power.name);
  return { name: zh?.name ?? actions.get(power.name) ?? power.name, text: zh?.text ?? power.text ?? '' };
}
export function chineseName(name: string): string { return names.get(name) ?? name; }

/** Only exact CHS set/number/name matches; never guess between same-name effects. */
export function resolveChineseCardLine(line: string): string | undefined {
  const normalized = line.trim().replace(/\s+/g, ' ');
  return Object.keys(catalog).find(fullName => {
    const meta = catalog[fullName];
    return normalized === `${meta.name} ${meta.set} ${meta.number}` ||
      normalized === `${meta.name} ${meta.set} ${meta.number.split('/')[0]}`;
  });
}
