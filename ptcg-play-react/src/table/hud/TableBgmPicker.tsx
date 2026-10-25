import { useEffect, useId, useRef, useState } from 'react';
import { BGM_LIBRARY, bgmTrackFile, bgmTrackKey, findBgmLibraryTheme } from '../../bgm/bgmAssets';
import { getBgmState } from '../../bgm/bgmPlayer';
import { setBgmEnabled, setBgmTheme, setBgmTrack, setBgmVolume, useBgmPrefs } from '../../bgm/bgmSettings';
import styles from './TableBgmPicker.module.css';

/**
 * 牌桌顶栏的对战音乐开关。和桌布选择器同族：黄铜圆键 + 胡桃木浮层。
 * 先选主题，再选这个主题里放哪一首（默认随机）。
 * 没有音频素材时（公开源码或未下载素材）整体不渲染，不占 HUD 位置。
 */
export function TableBgmPicker() {
  const { enabled: bgmEnabled, volume: bgmVolume, theme: bgmTheme, track: bgmTrack } = useBgmPrefs();
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [nowPlaying, setNowPlaying] = useState(() => getBgmState().title);

  const theme = findBgmLibraryTheme(bgmTheme);
  const pinnedRef = bgmTrackFile(bgmTrack);
  const pinnedFile = pinnedRef && pinnedRef.themeId === bgmTheme ? pinnedRef.file : '';

  // 浮层打开时轻量轮询“正在播放”，关上就停，不影响对局性能。
  // 只在曲目真的换了才写状态，避免每秒重渲染。
  useEffect(() => {
    if (!open) {
      return;
    }
    setNowPlaying(getBgmState().title);
    const timer = window.setInterval(() => {
      const next = getBgmState().title;
      setNowPlaying(previous => (previous === next ? previous : next));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [open]);

  if (BGM_LIBRARY.length === 0) {
    return null;
  }

  return <>
    <button
      ref={trigger}
      type="button"
      className={styles.trigger}
      popoverTarget={id}
      aria-label="对战音乐"
      aria-haspopup="dialog"
      title="对战音乐"
      data-muted={!bgmEnabled || bgmVolume === 0 ? 'true' : undefined}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M9 18V6l10-2v12" />
        <circle cx="6.5" cy="18" r="2.5" />
        <circle cx="16.5" cy="16" r="2.5" />
        {bgmEnabled && bgmVolume > 0 ? null : <path d="M4 20 20 4" strokeWidth="1.8" />}
      </svg>
    </button>
    <div
      ref={panel}
      id={id}
      className={styles.panel}
      popover="auto"
      role="dialog"
      aria-label="选择对战音乐"
      onToggle={event => setOpen((event.nativeEvent as Event & { newState?: string }).newState === 'open')}
    >
      <div className={styles.head}>
        <h2 className={styles.title}>对战音乐</h2>
        <span className={styles.nowPlaying}>
          {bgmEnabled && nowPlaying ? `正在播放 · ${nowPlaying}` : '已静音'}
        </span>
      </div>

      <p className={styles.sectionLabel} id={`${id}-themes`}>主题</p>
      <div className={styles.themes} role="radiogroup" aria-labelledby={`${id}-themes`}>
        {BGM_LIBRARY.map(item => <button
          key={item.id}
          type="button"
          role="radio"
          className={styles.theme}
          aria-checked={bgmTheme === item.id}
          data-active={bgmTheme === item.id ? 'true' : undefined}
          onClick={() => setBgmTheme(item.id)}
        >
          <span className={styles.themeLabel}>{item.label}</span>
          <span className={styles.themeNote}>{item.note}</span>
          <span className={styles.themeCount}>{item.tracks.length} 首</span>
        </button>)}
      </div>

      <p className={styles.sectionLabel} id={`${id}-tracks`}>曲目</p>
      <div className={styles.tracks} role="group" aria-labelledby={`${id}-tracks`}>
        <button
          type="button"
          className={styles.track}
          aria-pressed={pinnedFile === ''}
          onClick={() => setBgmTrack('')}
        >
          <span className={styles.trackTitle}>随机播放</span>
          <span className={styles.trackNote}>这个主题里的曲子轮着放</span>
        </button>
        {theme?.tracks.map(item => <button
          key={item.file}
          type="button"
          className={styles.track}
          aria-pressed={pinnedFile === item.file}
          onClick={() => setBgmTrack(bgmTrackKey(theme.id, item.file))}
        >
          <span className={styles.trackTitle}>{item.title}</span>
          <span className={styles.trackNote}>{item.game}</span>
        </button>)}
      </div>

      <label className={styles.row}>
        <span className={styles.rowLabel}>开启音乐</span>
        <span className={styles.switch}>
          <input
            role="switch"
            type="checkbox"
            checked={bgmEnabled}
            onChange={event => setBgmEnabled(event.target.checked)}
          />
          <span className={styles.switchTrack} aria-hidden><span className={styles.switchKnob} /></span>
        </span>
      </label>

      <label className={styles.volume}>
        <span className={styles.rowLabel}>音量</span>
        <input
          className={styles.slider}
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={bgmVolume}
          onChange={event => setBgmVolume(Number(event.target.value))}
          aria-label="音乐音量"
        />
        <output className={styles.volumeValue}>{Math.round(bgmVolume * 100)}</output>
      </label>
    </div>
  </>;
}
