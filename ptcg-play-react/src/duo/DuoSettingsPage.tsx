import { DuoVisibilityToggle } from './DuoVisibilityToggle';
import { DuoTutorialSettings } from './DuoTutorialSettings';
import { useSettings } from '../context/SettingsContext';
import { TABLE_THEMES, themeSwatchBackground } from '../settings/tableThemes';
import { BGM_LIBRARY, bgmTrackFile, bgmTrackKey, findBgmLibraryTheme, setBgmEnabled, setBgmTheme, setBgmTrack, setBgmVolume, useBgmPrefs } from '../bgm';
import styles from './DuoUtilityPages.module.css';

export function DuoSettingsPage() {
  const settings = useSettings();
  const bgm = useBgmPrefs();
  const bgmTheme = findBgmLibraryTheme(bgm.theme);
  const pinnedRef = bgmTrackFile(bgm.track);
  /** 固定曲目属于别的主题（或为空）时，下拉框回到「随机播放」。 */
  const pinnedTrack = pinnedRef && pinnedRef.themeId === bgm.theme ? bgm.track : '';
  function update(change: Partial<{ use3dBoardDefault: boolean; holoEnabled: boolean; sfxEnabled: boolean }>) {
    settings.commitFromSave({ ...settings, sfxVolumePercent: settings.sfxVolume * 100, ...change });
  }
  return (
    <div className="a-page">
      <div className="a-wrap-narrow">
        <header className="a-section" style={{ marginBottom: 28 }}>
          <h1 className="a-section-title" style={{ fontSize: 'clamp(26px, 3.4vw, 40px)' }}>偏好设置</h1>
          <span className="a-section-meta">自动保存 · 可见性随账号，其余仅此设备</span>
        </header>

        <div className={styles.console}>
          <DuoTutorialSettings />
          <section className={styles.block}>
            <div className={styles.blockHead}><h2 className={styles.blockTitle}>大厅可见性</h2></div>
            <DuoVisibilityToggle />
          </section>
          {/* 桌垫主题 */}
          <section className={styles.block}>
            <div className={styles.blockHead}>
              <span className={styles.blockIndex}>01</span>
              <h2 className={styles.blockTitle}>桌垫</h2>
            </div>
            <div className={styles.matRow} role="group" aria-label="桌布主题">
              {TABLE_THEMES.map(option => (
                <button
                  key={option.id}
                  type="button"
                  className={`${styles.mat} ${settings.tableTheme === option.id ? styles.matOn : ''}`}
                  aria-pressed={settings.tableTheme === option.id}
                  onClick={() => settings.setTableTheme(option.id)}
                >
                  <span
                    className={option.family === 'mat' ? styles.matSwatch : styles.matSwatchArt}
                    aria-hidden
                    style={{ background: themeSwatchBackground(option) }}
                  >
                    {option.family === 'mat' ? <><i /><i /></> : null}
                  </span>
                  <strong>{option.label}</strong>
                  <span className={styles.matState}>{settings.tableTheme === option.id ? '使用中' : '选用'}</span>
                </button>
              ))}
            </div>
          </section>

          {/* 显示 */}
          <section className={styles.block}>
            <div className={styles.blockHead}>
              <span className={styles.blockIndex}>02</span>
              <h2 className={styles.blockTitle}>显示</h2>
            </div>
            <label className={styles.row}>
              <span className={styles.rowLabel}>
                <strong>立体视角</strong>
                <small>桌面轻微倾角</small>
              </span>
              <span className={styles.switch}>
                <input
                  role="switch"
                  type="checkbox"
                  checked={settings.use3dBoardDefault}
                  onChange={event => update({ use3dBoardDefault: event.target.checked })}
                />
                <span className={styles.switchTrack} aria-hidden><span className={styles.switchKnob} /></span>
              </span>
            </label>
            <label className={styles.row}>
              <span className={styles.rowLabel}>
                <strong>闪卡光泽</strong>
                <small>全息反光与箔面</small>
              </span>
              <span className={styles.switch}>
                <input
                  role="switch"
                  type="checkbox"
                  checked={settings.holoEnabled}
                  onChange={event => update({ holoEnabled: event.target.checked })}
                />
                <span className={styles.switchTrack} aria-hidden><span className={styles.switchKnob} /></span>
              </span>
            </label>
          </section>

          {/* 声音 */}
          <section className={styles.block}>
            <div className={styles.blockHead}>
              <span className={styles.blockIndex}>03</span>
              <h2 className={styles.blockTitle}>声音</h2>
            </div>
            <label className={styles.row}>
              <span className={styles.rowLabel}>
                <strong>对战音效</strong>
                <small>发牌、进化与行动反馈</small>
              </span>
              <span className={styles.switch}>
                <input
                  role="switch"
                  type="checkbox"
                  checked={settings.sfxEnabled}
                  onChange={event => update({ sfxEnabled: event.target.checked })}
                />
                <span className={styles.switchTrack} aria-hidden><span className={styles.switchKnob} /></span>
              </span>
            </label>
            <label className={styles.volume}>
              <span className={styles.rowLabel}>
                <strong>音量</strong>
              </span>
              <input
                className={styles.slider}
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={event => settings.setSfxVolume(Number(event.target.value))}
                aria-label="音量"
              />
              <output className={styles.volumeValue}>{Math.round(settings.sfxVolume * 100)}</output>
            </label>
          </section>

          {/* 对战音乐：与桌垫同一种切换方式，主题就是一套曲目 */}
          {BGM_LIBRARY.length > 0 ? <section className={styles.block}>
            <div className={styles.blockHead}>
              <span className={styles.blockIndex}>04</span>
              <h2 className={styles.blockTitle}>对战音乐</h2>
            </div>
            <div className={styles.matRow} role="radiogroup" aria-label="对战音乐主题">
              {BGM_LIBRARY.map(theme => (
                <button
                  key={theme.id}
                  type="button"
                  role="radio"
                  className={`${styles.mat} ${bgm.theme === theme.id ? styles.matOn : ''}`}
                  aria-checked={bgm.theme === theme.id}
                  onClick={() => setBgmTheme(theme.id)}
                >
                  <span className={styles.matSwatchNote} aria-hidden>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 18V6l10-2v12" />
                      <circle cx="6.5" cy="18" r="2.5" />
                      <circle cx="16.5" cy="16" r="2.5" />
                    </svg>
                  </span>
                  <strong>{theme.label}</strong>
                  <span className={styles.matState}>{theme.tracks.length} 首 · {theme.note}</span>
                </button>
              ))}
            </div>
            <label className={styles.row}>
              <span className={styles.rowLabel}>
                <strong>播放曲目</strong>
                <small>默认在这个主题里轮着放</small>
              </span>
              <select
                className={styles.select}
                value={pinnedTrack}
                onChange={event => setBgmTrack(event.target.value)}
                aria-label="播放曲目"
              >
                <option value="">随机播放</option>
                {bgmTheme?.tracks.map(item => (
                  <option key={item.file} value={bgmTrackKey(bgmTheme.id, item.file)}>
                    {item.title}（{item.game}）
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.row}>
              <span className={styles.rowLabel}>
                <strong>播放对战背景音乐</strong>
                <small>进入对局自动开始，离开或结算后淡出</small>
              </span>
              <span className={styles.switch}>
                <input
                  role="switch"
                  type="checkbox"
                  checked={bgm.enabled}
                  onChange={event => setBgmEnabled(event.target.checked)}
                />
                <span className={styles.switchTrack} aria-hidden><span className={styles.switchKnob} /></span>
              </span>
            </label>
            <label className={styles.volume}>
              <span className={styles.rowLabel}>
                <strong>音乐音量</strong>
              </span>
              <input
                className={styles.slider}
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={bgm.volume}
                onChange={event => setBgmVolume(Number(event.target.value))}
                aria-label="音乐音量"
              />
              <output className={styles.volumeValue}>{Math.round(bgm.volume * 100)}</output>
            </label>
          </section> : null}
        </div>
      </div>
    </div>
  );
}
