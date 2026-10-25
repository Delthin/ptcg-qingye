import { useSyncExternalStore } from 'react';
import { DEFAULT_BGM_THEME } from './bgmCatalog';
import { BGM_LIBRARY, bgmTrackFile, bgmTrackInTheme, resolveBgmTheme } from './bgmAssets';
import { configureBgm, switchBgmTheme } from './bgmPlayer';

/**
 * 对战音乐的偏好（开关 / 音量 / 主题）。
 *
 * 声音是独立的收听偏好，不进 `SettingsContext` 那张跨客户端兼容的大表：这里用
 * `useSyncExternalStore` 做一个最小的全局小仓库，牌桌浮层与设置页共用同一份状态，
 * 改动即时生效并写入 localStorage。键名与其他设置同风格，方便以后需要时并入。
 */
export const BGM_SETTINGS_KEYS = {
  enabled: 'bgmEnabled',
  volume: 'bgmVolume',
  theme: 'bgmTheme',
  /** `<主题 id>/<文件名>`；空字符串表示随机播放。 */
  track: 'bgmTrack',
} as const;

export type BgmPrefs = {
  enabled: boolean;
  volume: number;
  /** 主题 id；素材缺失时读取阶段就回落到可用主题。 */
  theme: string;
  /** 固定播放的曲目；空字符串为随机。 */
  track: string;
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function readPrefs(): BgmPrefs {
  const enabledRaw = localStorage.getItem(BGM_SETTINGS_KEYS.enabled);
  const enabled = enabledRaw == null ? true : enabledRaw === 'true';
  const volumeRaw = parseFloat(localStorage.getItem(BGM_SETTINGS_KEYS.volume) ?? '');
  const storedTheme = localStorage.getItem(BGM_SETTINGS_KEYS.theme);
  const theme = resolveBgmTheme(storedTheme)?.id ?? DEFAULT_BGM_THEME;
  const storedTrack = localStorage.getItem(BGM_SETTINGS_KEYS.track) ?? '';
  const ref = bgmTrackFile(storedTrack);
  const valid = ref != null && bgmTrackInTheme(ref.themeId, ref.file) != null;
  return {
    enabled,
    volume: Number.isFinite(volumeRaw) ? clamp01(volumeRaw) : 0.4,
    theme,
    track: valid ? storedTrack : '',
  };
}

let prefs: BgmPrefs = readPrefs();
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(): void {
  listeners.forEach(listener => listener());
}

function commit(next: Partial<BgmPrefs>): void {
  const merged: BgmPrefs = { ...prefs, ...next };
  merged.volume = clamp01(merged.volume);
  if (!resolveBgmTheme(merged.theme)) {
    merged.theme = resolveBgmTheme(null)?.id ?? DEFAULT_BGM_THEME;
  }
  if (merged.track) {
    const ref = bgmTrackFile(merged.track);
    if (ref == null || bgmTrackInTheme(ref.themeId, ref.file) == null) {
      merged.track = '';
    }
  }
  if (merged.enabled === prefs.enabled && merged.volume === prefs.volume
      && merged.theme === prefs.theme && merged.track === prefs.track) {
    return;
  }
  prefs = merged;
  localStorage.setItem(BGM_SETTINGS_KEYS.enabled, String(prefs.enabled));
  localStorage.setItem(BGM_SETTINGS_KEYS.volume, String(prefs.volume));
  localStorage.setItem(BGM_SETTINGS_KEYS.theme, prefs.theme);
  localStorage.setItem(BGM_SETTINGS_KEYS.track, prefs.track);
  configureBgm({ enabled: prefs.enabled, volume: prefs.volume });
  switchBgmTheme(prefs.theme, prefs.track);
  emit();
}

export function getBgmPrefs(): BgmPrefs {
  return prefs;
}

export function setBgmEnabled(enabled: boolean): void {
  commit({ enabled });
}

/** 设置页给的是 0–100 的百分比，这里统一收成 0–1。 */
export function setBgmVolumePercent(percent: number): void {
  commit({ volume: percent / 100 });
}

export function setBgmVolume(volume: number): void {
  commit({ volume });
}

export function setBgmTheme(theme: string): void {
  if (!BGM_LIBRARY.some(item => item.id === theme)) {
    return;
  }
  // 换主题时清掉固定曲目：它是属于上一个主题的（想要回去再选一次即可）。
  commit({ theme, track: '' });
}

/** 固定播放某一首；传空字符串恢复随机。 */
export function setBgmTrack(track: string): void {
  commit({ track });
}

export function useBgmPrefs(): BgmPrefs {
  return useSyncExternalStore(subscribe, getBgmPrefs, getBgmPrefs);
}

// 启动即把已保存的偏好推给播放器，避免首局开始时才应用音量。
configureBgm({ enabled: prefs.enabled, volume: prefs.volume });
