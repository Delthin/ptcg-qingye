import type { ReactNode } from 'react';
import styles from './DuoSwitch.module.css';

export type DuoSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** 开关右侧的说明文字。 */
  children?: ReactNode;
  /** 拨片下方的一行补充说明。 */
  hint?: ReactNode;
  id?: string;
  className?: string;
  tone?: 'dark' | 'paper';
  /** 供导览锚点使用。 */
  'data-tour'?: string;
};

/**
 * 黄铜拨片开关：深绒凹槽 + 黄铜滑钮。
 * 大厅可见性、局内静音、偏好设置共用同一枚控件，避免各处出现系统默认勾选框。
 */
export function DuoSwitch({ checked, onChange, disabled = false, children, hint, id, className, tone = 'dark', 'data-tour': dataTour }: DuoSwitchProps) {
  return <div className={[tone === 'paper' ? styles.paper : '', className].filter(Boolean).join(' ')} data-tour={dataTour}>
    <label className={styles.switch}>
      <input
        id={id}
        type="checkbox"
        role="switch"
        className={styles.input}
        checked={checked}
        disabled={disabled}
        onChange={event => onChange(event.target.checked)}
      />
      <span className={styles.track} aria-hidden="true"><span className={styles.knob} /></span>
      {children !== undefined && <span className={styles.label}>{children}</span>}
    </label>
    {hint !== undefined && <p className={styles.hint}>{hint}</p>}
  </div>;
}
