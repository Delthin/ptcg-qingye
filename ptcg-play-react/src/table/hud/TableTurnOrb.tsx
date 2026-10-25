import { useId, useRef, useState, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import styles from './TableTurnOrb.module.css';

export type TableOrbState = 'turn' | 'choose' | 'ready' | 'waiting' | 'pending' | 'finished';

type Props = {
  active: boolean;
  state?: TableOrbState;
  label?: string;
  disabled?: boolean;
  className?: string;
  onActivate?: () => void | Promise<void>;
  children?: ReactNode;
};

/** An actual game action, not a client-side turn toggle. */
export function TableTurnOrb({ active, state = 'turn', label, disabled = false, className, onActivate, children }: Props) {
  const id = useId();
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [keyboard, setKeyboard] = useState(false);
  const pending = submitting || state === 'pending';
  const activate = async () => {
    if (disabled || submittingRef.current || !onActivate) return;
    submittingRef.current = true;
    setSubmitting(true);
    try { await onActivate(); } catch { /* The action owner reports server errors. */ }
    finally { submittingRef.current = false; setSubmitting(false); }
  };
  const art = (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-shell`}><stop stopColor="#e8d699" /><stop offset=".55" stopColor="#b29a5b" /><stop offset="1" stopColor="#4e482f" /></radialGradient>
        <radialGradient id={`${id}-dark`}><stop stopColor="#4b4b3b" /><stop offset="1" stopColor="#141a16" /></radialGradient>
        <linearGradient id={`${id}-cap`} x2=".3" y2="1"><stop stopColor="#f4e4aa" /><stop offset=".5" stopColor="#bba264" /><stop offset="1" stopColor="#706141" /></linearGradient>
      </defs>
      <ellipse cx="50" cy="71" rx="44" ry="18" fill="#060b07" />
      <ellipse cx="50" cy="63" rx="43" ry="23" fill={`url(#${id}-dark)`} stroke="#8e7b45" />
      <ellipse cx="50" cy="58" rx="36" ry="20" fill="#262b22" stroke="#aaa170" strokeWidth="1.4" />
      <circle cx="50" cy="42" r="32" fill={`url(#${id}-shell)`} stroke="#d0bd81" strokeWidth="1.2" />
      <path d="M18 43A32 32 0 0 1 82 43Z" fill={`url(#${id}-cap)`} />
      <path d="M18 43H82" stroke="#262e25" strokeWidth="5" />
      <circle cx="50" cy="43" r="11" fill="#141c17" stroke="#dfcb8f" strokeWidth="3" />
      {state === 'ready' || state === 'waiting'
        ? <path className={styles.signal} d="m44 43 4 4 8-8" stroke="#fff0b1" strokeWidth="2" fill="none" />
        : <circle className={styles.signal} cx="50" cy="43" r="5" fill="#fff0b1" />}
      <path d="M31 23Q42 14 58 17" fill="none" stroke="#fff6cf" strokeWidth="2.4" opacity=".45" />
      <path d="m43 64 7 6 7-6" fill="none" stroke="#bbad79" strokeWidth="2" />
      <ellipse className={styles.signal} cx="50" cy="59" rx="34" ry="17" fill="none" stroke="#e8ce77" strokeWidth="1" />
    </svg>
  );
  const common = { className: cn(styles.orb, className), 'data-active': active || undefined, 'data-pending': pending || undefined, 'data-state': state };
  if (!onActivate) return <div {...common} data-disabled={disabled || undefined} aria-hidden={children ? undefined : true}>{art}{children}</div>;
  return <button {...common} type="button" aria-label={label} aria-busy={pending} disabled={disabled || pending}
    data-keyboard={keyboard || undefined} onKeyDown={() => setKeyboard(true)} onPointerDown={() => setKeyboard(false)} onClick={() => void activate()}>{art}{children}</button>;
}
