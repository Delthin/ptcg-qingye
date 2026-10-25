import { BGM_THEMES, type BgmTheme } from './bgmCatalog';

/**
 * 对战 BGM 素材索引。
 *
 * 音频放在 `src/assets/bgm/<主题>/`，属于可选私人素材（版权归官方，仅本机私下
 * 对局使用）。用 glob 而不是固定 import，缺文件时整首曲目直接从库里消失，前端
 * 按“没有 BGM”静默降级，构建和运行都不受影响 —— 与 `sfxAssets.ts` 同一套做法。
 */
const audioUrls = import.meta.glob<string>('../assets/bgm/*/*.mp3', {
  eager: true, query: '?url', import: 'default',
});

export type ResolvedBgmTrack = {
  url: string;
  title: string;
  game: string;
  /** 主题内的文件名，用来记住“固定放哪一首”。 */
  file: string;
};

export type ResolvedBgmTheme = {
  id: string;
  label: string;
  note: string;
  tracks: ResolvedBgmTrack[];
};

function urlFor(themeId: string, file: string): string {
  return audioUrls[`../assets/bgm/${themeId}/${file}`] ?? '';
}

function resolve(theme: BgmTheme): ResolvedBgmTheme {
  const tracks: ResolvedBgmTrack[] = [];
  for (const track of theme.tracks) {
    const url = urlFor(theme.id, track.file);
    if (url) {
      tracks.push({ url, title: track.title, game: track.game, file: track.file });
    }
  }
  return { id: theme.id, label: theme.label, note: theme.note, tracks };
}

/** 只保留音频确实存在的主题，顺序与 `bgmCatalog.ts` 一致。 */
export const BGM_LIBRARY: ResolvedBgmTheme[] = BGM_THEMES
  .map(resolve)
  .filter(theme => theme.tracks.length > 0);

export const BGM_AVAILABLE = BGM_LIBRARY.length > 0;

export function findBgmLibraryTheme(id: string | null | undefined): ResolvedBgmTheme | null {
  return BGM_LIBRARY.find(theme => theme.id === id) ?? null;
}

/** 已保存的主题没有素材时，回落到第一个可用主题。 */
export function resolveBgmTheme(id: string | null | undefined): ResolvedBgmTheme | null {
  return findBgmLibraryTheme(id) ?? BGM_LIBRARY[0] ?? null;
}

/** 固定曲目的标识：`<主题 id>/<文件名>`，自带主题归属。 */
export function bgmTrackKey(themeId: string, file: string): string {
  return `${themeId}/${file}`;
}

export function bgmTrackFile(key: string | null | undefined): { themeId: string; file: string } | null {
  if (!key) {
    return null;
  }
  const cut = key.indexOf('/');
  if (cut <= 0 || cut === key.length - 1) {
    return null;
  }
  return { themeId: key.slice(0, cut), file: key.slice(cut + 1) };
}

/** 该主题里是否存在这首曲目；不在库里（素材缺失或手改过）就当随机。 */
export function bgmTrackInTheme(themeId: string, file: string | null | undefined): ResolvedBgmTrack | null {
  const theme = findBgmLibraryTheme(themeId);
  if (!theme || !file) {
    return null;
  }
  return theme.tracks.find(track => track.file === file) ?? null;
}
