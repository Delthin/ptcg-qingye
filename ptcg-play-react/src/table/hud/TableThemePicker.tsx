import { useId, useRef } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { TABLE_THEMES, tableThemeOption, themeSwatchBackground, type TableTheme } from '../../settings/tableThemes';
import styles from './TableThemePicker.module.css';

const GROUPS = TABLE_THEMES.reduce<string[]>((groups, option) => {
  if (!groups.includes(option.group)) groups.push(option.group);
  return groups;
}, []);

export function TableThemePicker() {
  const { tableTheme, setTableTheme } = useSettings();
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const choose = (theme: TableTheme) => {
    setTableTheme(theme);
    panel.current?.hidePopover();
    trigger.current?.focus({ preventScroll: true });
  };
  const current = tableThemeOption(tableTheme);
  return <>
    <button ref={trigger} type="button" className={styles.trigger} popoverTarget={id} aria-label="切换桌布" aria-haspopup="dialog" title="切换桌布">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M12 3a9 9 0 1 0 0 18h1c2 0 3-2 2-3l-1-1c-1-1 0-3 2-3h2c2 0 3-2 3-4 0-4-4-7-9-7Z" />
        <circle cx="7" cy="10" r="1" /><circle cx="11" cy="7" r="1" /><circle cx="16" cy="8" r="1" />
      </svg>
    </button>
    <div ref={panel} id={id} className={styles.panel} popover="auto" role="dialog" aria-label="选择桌布">
      {GROUPS.map(group => <div key={group} className={styles.group} role="group" aria-label={group}>
        <span className={styles.groupLabel}>{group}</span>
        <div className={styles.choices}>
          {TABLE_THEMES.filter(option => option.group === group).map(option => <button key={option.id} type="button"
            className={styles.choice} data-theme={option.id} data-family={option.family}
            aria-label={`${option.label}桌布`} aria-pressed={tableTheme === option.id} title={`${option.label} · ${option.note}`}
            style={{ background: themeSwatchBackground(option) }}
            onClick={() => choose(option.id)}>
            {option.family === 'mat' ? <svg className={styles.matSymbol} viewBox="0 0 100 64" aria-hidden="true" fill="none" stroke="currentColor">
              <circle cx="50" cy="32" r="23" /><circle cx="50" cy="32" r="18" /><path d="M27 32h46" /><circle cx="50" cy="32" r="5" fill="currentColor" />
            </svg> : null}
            {tableTheme === option.id ? <svg className={styles.check} viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4 10-10" /></svg> : null}
          </button>)}
        </div>
      </div>)}
      {current.credit ? <div className={styles.credit}>
        <a href={current.credit.source} target="_blank" rel="noreferrer">{current.label} · {current.credit.artist}</a>
        <a href={current.credit.terms} target="_blank" rel="noreferrer">素材使用说明</a>
      </div> : null}
    </div>
  </>;
}
