import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
      {icon && (
        <div className={styles.icon}>
          {icon}
        </div>
      )}
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        {description && (
          <p className={styles.description}>{description}</p>
        )}
      </div>
      {action && (
        <div className={styles.action}>
          {action}
        </div>
      )}
    </div>
  );
}

// 预设图标
export const EmptyIcons = {
  Cards: (
    <svg viewBox="0 0 64 64" fill="none">
      <rect x="12" y="8" width="40" height="48" rx="4" fill="currentColor" opacity="0.1" />
      <rect x="12" y="8" width="40" height="48" rx="4" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20h24M20 28h24M20 36h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Deck: (
    <svg viewBox="0 0 64 64" fill="none">
      <rect x="16" y="12" width="32" height="40" rx="2" fill="currentColor" opacity="0.1" transform="rotate(-5 32 32)" />
      <rect x="16" y="12" width="32" height="40" rx="2" fill="currentColor" opacity="0.2" transform="rotate(-2 32 32)" />
      <rect x="16" y="12" width="32" height="40" rx="2" fill="white" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  Battle: (
    <svg viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="20" fill="currentColor" opacity="0.1" />
      <path d="M22 32l8 8 12-16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Shop: (
    <svg viewBox="0 0 64 64" fill="none">
      <rect x="12" y="20" width="40" height="32" rx="2" fill="currentColor" opacity="0.1" />
      <path d="M12 26h40M20 26v-6l4-6h16l4 6v6" stroke="currentColor" strokeWidth="2" />
      <circle cx="24" cy="38" r="2" fill="currentColor" />
      <circle cx="40" cy="38" r="2" fill="currentColor" />
    </svg>
  ),
};
