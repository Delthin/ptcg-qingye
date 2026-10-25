import { cn } from '../utils/cn';
import styles from './HoverHighlight.module.css';

export function HoverHighlight({ enabled, children, onClick, className, kind, label }: {
  enabled: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  kind?: 'ability' | 'attack' | 'trainer' | 'retreat';
  label?: string;
}) {
  const canActivate = enabled && !!onClick;
  return <div className={cn(styles.root, kind && styles.action, canActivate && styles.enabled, className)}
    data-action-kind={kind} data-action-enabled={canActivate || undefined}
    onClick={canActivate ? onClick : undefined}
    onKeyDown={canActivate ? event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onClick?.(); }
    } : undefined}
    role={kind || canActivate ? 'button' : undefined}
    aria-label={label} aria-disabled={kind ? !canActivate : undefined} tabIndex={canActivate ? 0 : undefined}>
    {children}
    {kind ? <span className={styles.actionMark} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      {canActivate ? <path d="M5 12h14m-6-6 6 6-6 6" /> : <><rect x="6" y="10" width="12" height="10" rx="2" /><path d="M9 10V7a3 3 0 0 1 6 0v3" /></>}
    </svg></span> : null}
  </div>;
}
