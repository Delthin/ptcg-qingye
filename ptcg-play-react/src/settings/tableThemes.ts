import { publicAssetUrl } from '../utils/publicAssetUrl';

/**
 * 桌垫主题表。两类：
 * - `mat`：整桌满版桌垫，图案或配色铺满整张桌垫（对应官方礼盒／周边卡垫的观感），桌垫印刷层由 CSS + MatPrint 绘制。
 * - `art`：角色插画桌布，左侧奶油底色承接卡位、右侧等比放角色插画。
 *
 * `art` 的插画来自 MapleRose 的 PokéWalls（1920×1080，未裁剪、未改色），仅作私人练习牌桌的桌布使用；
 * 署名与来源链接保留在图片左下角，并在桌布选择器里提供出处与素材使用说明链接，见
 * `public/assets/playmats/attribution.json`。
 */
export type TableTheme =
  | 'black-gold'
  | 'paper'
  | 'starlight'
  | 'monogram-amber'
  | 'monogram-aqua'
  | 'slowpoke'
  | 'psyduck'
  | 'gengar'
  | 'snorlax'
  | 'quagsire'
  | 'wobbuffet';

export type TableThemeFamily = 'mat' | 'art';

export interface TableThemeCredit {
  artist: string;
  source: string;
  terms: string;
}

export interface TableThemeOption {
  id: TableTheme;
  /** 选择器与设置页显示的名字。 */
  label: string;
  family: TableThemeFamily;
  /** 选择器分组标题（同组连续排列）。 */
  group: string;
  /** 一句话说明，用作 title 与辅助技术的补充描述。 */
  note: string;
  /** 相对 public/ 的插画路径；`mat` 家族没有插画。 */
  asset?: string;
  /** 小样底色／渐变，用作选择器与设置页的缩略背景。 */
  swatch: string;
  /** 是否绘制桌垫印刷层（中央徽记）。 */
  print?: boolean;
  credit?: TableThemeCredit;
}

export const DEFAULT_TABLE_THEME: TableTheme = 'black-gold';

const TERMS = 'https://pokewalls.wordpress.com/about/terms-of-use/';
const ARTIST = 'MapleRose / PokéWalls';

const art = (id: TableTheme, label: string, file: string, swatch: string, source: string): TableThemeOption => ({
  id, label, family: 'art', group: '角色插画桌布', note: `${label}插画桌布`,
  asset: `assets/playmats/${file}`,
  swatch,
  credit: { artist: ARTIST, source, terms: TERMS },
});

export const TABLE_THEMES: readonly TableThemeOption[] = [
  {
    id: 'black-gold', label: '黑金', family: 'mat', group: '整桌桌垫', print: true,
    note: '30 周年庆典双人卡垫配色', swatch: 'radial-gradient(ellipse at 42% 38%, #34362f, #1b1e1b 52%, #101312)',
  },
  {
    id: 'paper', label: '纸面印线', family: 'mat', group: '整桌桌垫', print: true,
    note: '纸面对战卡垫配色', swatch: 'linear-gradient(160deg, #f7f2e6, #ece3d0 60%, #e2d7bf)',
  },
  {
    id: 'starlight', label: '夜色星光', family: 'mat', group: '整桌桌垫', print: true,
    note: '夜幕星空配烫金徽记', swatch: 'radial-gradient(ellipse 90% 70% at 50% 22%, #22305a, #141d38 58%, #0a0f1e)',
  },
  {
    id: 'monogram-amber', label: '精灵球图腾 · 琥珀', family: 'mat', group: '整桌桌垫', print: true,
    note: '琥珀金精灵球满版图腾', swatch: 'radial-gradient(ellipse 85% 65% at 40% 18%, #2c2415, #1a1510 60%, #0f0c08)',
  },
  {
    id: 'monogram-aqua', label: '精灵球图腾 · 水蓝', family: 'mat', group: '整桌桌垫', print: true,
    note: '水蓝精灵球满版图腾', swatch: 'radial-gradient(ellipse 85% 65% at 40% 18%, #16363e, #0d1f26 60%, #071216)',
  },
  art('slowpoke', '呆呆兽', 'slowpoke.png', '#ff95aa', 'https://pokewalls.wordpress.com/2011/01/13/79-slowpoke/'),
  art('psyduck', '可达鸭', 'psyduck.png', '#ffd54b', 'https://pokewalls.wordpress.com/2011/08/02/54-psyduck/'),
  art('gengar', '耿鬼', 'gengar.png', '#826ab4', 'https://pokewalls.wordpress.com/2011/01/17/94-gengar/'),
  art('snorlax', '卡比兽', 'snorlax.png', '#538bac', 'https://pokewalls.wordpress.com/2011/01/26/143-snorlax/'),
  art('quagsire', '沼王', 'quagsire.png', '#82d5f5', 'https://pokewalls.wordpress.com/2011/03/08/195-quagsire/'),
  art('wobbuffet', '果然翁', 'wobbuffet.png', '#49ace7', 'https://pokewalls.wordpress.com/2012/05/31/202-wobbuffet/'),
];

export function tableThemeOption(theme: TableTheme): TableThemeOption {
  return TABLE_THEMES.find(option => option.id === theme) ?? TABLE_THEMES[0];
}

export function isTableTheme(value: string | null | undefined): value is TableTheme {
  return value != null && TABLE_THEMES.some(option => option.id === value);
}

/** 选择器与设置页小样的 CSS `background` 值：插画取右侧（角色所在处），满版取底色。 */
export function themeSwatchBackground(option: TableThemeOption): string {
  if (!option.asset) return option.swatch;
  return `url("${publicAssetUrl(option.asset)}") right center / cover no-repeat, ${option.swatch}`;
}
