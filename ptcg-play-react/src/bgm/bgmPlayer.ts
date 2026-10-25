import { BGM_AVAILABLE, resolveBgmTheme, bgmTrackFile, bgmTrackInTheme, type ResolvedBgmTheme, type ResolvedBgmTrack } from './bgmAssets';

/**
 * 对战背景音乐播放器。
 *
 * 与 `sfx/playSfx.ts` 同一风格的单例：组件只负责“进入对局时开、离开时关”，
 * 开关和音量由 `SettingsProvider` 通过 `configureBgm` 推进来。两条音轨轮流担任
 * 主副，换主题或换曲时做 0.9 秒淡入淡出交叉过渡，衔接处没有空隙。
 *
 * `sessionActive`（对局进行中）与 `settings.enabled`（用户是否要听）是两件事：
 * 关掉音乐再打开时，只要还在对局里就会接着放，不会等到下一局。
 *
 * 浏览器限制：没有用户交互前 `play()` 会被拒绝。此时挂一次性的交互监听，用户点
 * 一下页面就继续播放，不报错、不弹提示。
 */

const FADE_MS = 900;
/** 比这个还短的曲目不做交叉过渡，直接顺序播放，避免两首叠在一起。 */
const MIN_CROSSFADE_DURATION = (FADE_MS / 1000) * 3;

type BgmSettings = {
  enabled: boolean;
  volume: number;
};

type Slot = {
  el: HTMLAudioElement;
  /** 0–1 的淡入淡出包络；实际音量 = envelope * settings.volume。 */
  envelope: number;
  raf: number | null;
  /** 当前这首的来源 URL，用来判断能否复用同一个元素。 */
  src: string;
};

const slots: Slot[] = [];
let settings: BgmSettings = { enabled: true, volume: 0.4 };
let theme: ResolvedBgmTheme | null = null;
let order: number[] = [];
let cursor = -1;
/** 固定播放某一首时它在 `order` 里的下标；null 表示随机。 */
let pinnedIndex: number | null = null;
/** 当前队列的标识（主题 + 固定曲目），用来判断偏好变化后要不要重排。 */
let queueKey = '';
/** 牌桌里有一局正在进行（组件已挂载）。 */
let sessionActive = false;
let switching = false;
let unlockBound = false;
let active = 0;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function ensureSlots(): Slot[] {
  if (slots.length === 0) {
    for (let index = 0; index < 2; index += 1) {
      const el = new Audio();
      el.preload = 'auto';
      el.addEventListener('error', () => {
        console.warn('BGM failed to load', el.currentSrc || el.src);
      });
      el.addEventListener('timeupdate', () => {
        maybeCrossfade(el);
      });
      el.addEventListener('ended', () => {
        if (sessionActive && slots[active]?.el === el) {
          playNext(FADE_MS);
        }
      });
      slots.push({ el, envelope: 0, raf: null, src: '' });
    }
  }
  return slots;
}

function applyVolume(slot: Slot): void {
  slot.el.volume = clamp01(slot.envelope * settings.volume);
}

function stopFade(slot: Slot): void {
  if (slot.raf != null) {
    cancelAnimationFrame(slot.raf);
    slot.raf = null;
  }
}

function fade(slot: Slot, target: number, ms: number, onArrive?: () => void): void {
  stopFade(slot);
  const from = slot.envelope;
  const to = clamp01(target);
  if (ms <= 0 || Math.abs(to - from) < 0.001) {
    slot.envelope = to;
    applyVolume(slot);
    onArrive?.();
    return;
  }
  const startedAt = performance.now();
  const step = (now: number) => {
    const progress = Math.min(1, (now - startedAt) / ms);
    // 平方曲线：起音比线性自然，收尾更干净。
    slot.envelope = from + (to - from) * (progress * progress);
    applyVolume(slot);
    if (progress < 1) {
      slot.raf = requestAnimationFrame(step);
    } else {
      slot.raf = null;
      onArrive?.();
    }
  };
  slot.raf = requestAnimationFrame(step);
}

function shuffled(count: number): number[] {
  const indices = Array.from({ length: count }, (_, index) => index);
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

function currentTrack(): ResolvedBgmTrack | null {
  if (!theme || cursor < 0) {
    return null;
  }
  return theme.tracks[order[cursor]] ?? null;
}

function wantsSound(): boolean {
  return sessionActive && settings.enabled && settings.volume > 0 && BGM_AVAILABLE;
}

function recoverOnGesture(): void {
  if (unlockBound) {
    return;
  }
  unlockBound = true;
  const retry = () => {
    unlockBound = false;
    document.removeEventListener('pointerdown', retry, true);
    document.removeEventListener('keydown', retry, true);
    if (wantsSound()) {
      resumeActive();
    }
  };
  document.addEventListener('pointerdown', retry, true);
  document.addEventListener('keydown', retry, true);
}

/** 让当前这条音轨接着响，不改变曲目位置；隐藏标签页恢复时也走这里。 */
function resumeActive(): void {
  if (!wantsSound()) {
    return;
  }
  const all = ensureSlots();
  const slot = all[active];
  if (!slot || !slot.src) {
    playNext(FADE_MS);
    return;
  }
  if (!slot.el.paused) {
    applyVolume(slot);
    return;
  }
  const started = slot.el.play();
  if (started) {
    started.catch(() => {
      recoverOnGesture();
    });
  }
  fade(slot, 1, FADE_MS / 2);
}

/** 淡出后停掉所有音轨，保留曲目位置。 */
function silence(): void {
  slots.forEach(slot => {
    fade(slot, 0, FADE_MS / 2, () => {
      slot.el.pause();
    });
  });
}

/** 从曲目表的当前游标处开始播放一首新曲。 */
function playCurrent(fadeMs: number, restart: boolean): void {
  const track = currentTrack();
  if (!track || !wantsSound()) {
    return;
  }
  const all = ensureSlots();
  const nextIndex = (active + 1) % all.length;
  const next = all[nextIndex];
  const previous = all[active];

  stopFade(next);
  if (next.src !== track.url) {
    next.el.src = track.url;
    next.src = track.url;
    restart = true;
  }
  if (restart) {
    next.el.currentTime = 0;
  }
  next.envelope = 0;
  applyVolume(next);
  switching = false;

  const started = next.el.play();
  if (started) {
    started.catch(() => {
      recoverOnGesture();
    });
  }

  active = nextIndex;
  fade(next, 1, fadeMs);
  if (previous !== next) {
    fade(previous, 0, fadeMs, () => {
      previous.el.pause();
    });
  }
}

function advanceCursor(): void {
  if (!theme || theme.tracks.length === 0) {
    return;
  }
  cursor += 1;
  if (cursor >= order.length) {
    // 固定曲目时队列就只有这一首，放完回到它自己。
    order = pinnedIndex == null ? shuffled(theme.tracks.length) : [pinnedIndex];
    cursor = 0;
  }
}

function playNext(fadeMs: number): void {
  if (!wantsSound()) {
    return;
  }
  advanceCursor();
  playCurrent(fadeMs, true);
}

/** 主音轨快放完时提前把下一首推进来，做成真正的交叉过渡。 */
function maybeCrossfade(el: HTMLAudioElement): void {
  // 队列只有一首（固定曲目）时不提前换曲，否则会把同一首叠到自己身上。
  if (!wantsSound() || switching || !theme || order.length < 2) {
    return;
  }
  if (slots[active]?.el !== el || !Number.isFinite(el.duration) || el.duration < MIN_CROSSFADE_DURATION) {
    return;
  }
  if (el.duration - el.currentTime > FADE_MS / 1000) {
    return;
  }
  switching = true;
  advanceCursor();
  playCurrent(FADE_MS, true);
}

/** 由 `SettingsProvider` 调用：开关与音量变化即时生效。 */
export function configureBgm(next: Partial<BgmSettings>): void {
  const wasAudible = wantsSound();
  if (next.volume !== undefined) {
    settings.volume = clamp01(next.volume);
    slots.forEach(applyVolume);
  }
  if (next.enabled !== undefined) {
    settings.enabled = next.enabled;
  }
  if (!wantsSound()) {
    // 音量归零或关掉开关都只是静音，不结束这一局。
    silence();
    return;
  }
  if (!wasAudible) {
    resumeActive();
  }
}

/** 牌桌挂载或有正在进行的对局时调用；`trackKey` 为空就是随机。 */
export function startBgm(themeId: string, trackKey?: string | null): void {
  sessionActive = true;
  applySelection(themeId, trackKey, true);
}

/** 设置里改主题或改曲目时调用：正在对局就直接换，否则只记下偏好。 */
export function switchBgmTheme(themeId: string, trackKey?: string | null): void {
  applySelection(themeId, trackKey, sessionActive);
}

function applySelection(themeId: string, trackKey: string | null | undefined, play: boolean): void {
  const resolved = resolveBgmTheme(themeId);
  if (!resolved) {
    theme = null;
    pinnedIndex = null;
    order = [];
    cursor = -1;
    queueKey = '';
    silence();
    return;
  }
  // 固定曲目不属于当前主题（或素材缺失）时当作随机。
  const file = bgmTrackInTheme(resolved.id, bgmTrackFile(trackKey)?.file)?.file ?? null;
  const nextKey = `${resolved.id}|${file ?? 'random'}`;
  const changed = nextKey !== queueKey;
  theme = resolved;
  if (changed) {
    pinnedIndex = file == null ? null : resolved.tracks.findIndex(track => track.file === file);
    order = pinnedIndex == null ? shuffled(resolved.tracks.length) : [pinnedIndex];
    cursor = -1;
    queueKey = nextKey;
  }
  if (!play || !wantsSound()) {
    return;
  }
  if (changed) {
    playNext(FADE_MS);
  } else {
    resumeActive();
  }
}

/** 离开牌桌或对局结束时调用：淡出后彻底停掉。 */
export function stopBgm(): void {
  sessionActive = false;
  switching = false;
  silence();
}

export function isBgmPlaying(): boolean {
  return slots.some(slot => !slot.el.paused);
}

/** 供联调与验收读取的实时状态。 */
export function getBgmState(): {
  themeId: string | null;
  sessionActive: boolean;
  playing: boolean;
  title: string | null;
  /** 当前固定播放的曲目文件名；随机播放时为 null。 */
  trackFile: string | null;
  currentTime: number;
  volume: number;
  /** 音轨元素上的实际音量（包络 × 主音量），用来确认音量真的落在播放器上。 */
  outputVolume: number;
} {
  const slot = slots[active];
  return {
    themeId: theme?.id ?? null,
    sessionActive,
    playing: isBgmPlaying(),
    title: currentTrack()?.title ?? null,
    trackFile: currentTrack()?.file ?? null,
    currentTime: slot ? Number(slot.el.currentTime.toFixed(2)) : 0,
    volume: settings.volume,
    outputVolume: slot ? Number(slot.el.volume.toFixed(3)) : 0,
  };
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (slots.length === 0 || !sessionActive) {
      return;
    }
    if (document.hidden) {
      slots.forEach(slot => slot.el.pause());
    } else {
      resumeActive();
    }
  });
}
