import type { ReactNode, CSSProperties } from 'react';
import styles from './Panel.module.css';

interface PanelProps {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'glass' | 'dark';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  hoverable?: boolean;
}

export function Panel({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  style,
  onClick,
  hoverable = false,
}: PanelProps) {
  const classNames = [
    styles.panel,
    styles[variant],
    styles[`padding-${padding}`],
    (hoverable || onClick) && styles.hoverable,
    onClick && styles.clickable,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classNames}
      style={style}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
