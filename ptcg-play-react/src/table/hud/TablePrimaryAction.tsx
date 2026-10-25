import { createContext, useContext, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { TableTurnOrb, type TableOrbState } from './TableTurnOrb';
import { TablePrimaryActionStore, type TablePrimaryAction as RegisteredAction } from './TablePrimaryActionStore';
import styles from './TablePrimaryAction.module.css';

const ActionContext = createContext<TablePrimaryActionStore | null>(null);

function ActionControls({ action }: { action: RegisteredAction }) {
  const { t } = useTranslation();
  const [pending, setPending] = useState<'confirm' | 'cancel' | null>(null);
  const pendingRef = useRef(false);
  const busy = pending !== null || action.state === 'pending';
  const inDialog = !!action.host.closest('[role="dialog"]');
  const activate = async (kind: 'confirm' | 'cancel') => {
    const callback = kind === 'confirm' ? action.onActivate : action.onCancel;
    const disabled = kind === 'confirm' ? action.disabled : action.cancelDisabled;
    if (!callback || disabled || busy || pendingRef.current) return;
    pendingRef.current = true;
    setPending(kind);
    try { await callback(); } catch { /* The action owner reports server errors. */ }
    finally { pendingRef.current = false; setPending(null); }
  };

  // Keep dialog controls in its accessibility/focus tree. Board bars use
  // backdrop-filter, so their fixed control group must escape to body instead.
  return createPortal(<div className={styles.actionDock}
    role="group" aria-label="当前操作" aria-busy={busy} data-table-actions data-cancellable={!!action.onCancel || undefined}>
    {action.onCancel ? <button type="button" className={styles.cancelButton} data-table-action="cancel"
      disabled={action.cancelDisabled || busy} aria-label={action.cancelLabel || t('BUTTON_CANCEL')}
      onClick={() => void activate('cancel')}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d={action.cancelIcon === 'arrow' ? 'M5 12h14m-6-6 6 6-6 6' : 'm7 7 10 10M17 7 7 17'} /></svg>
      <span className={styles.actionLabel}>{action.cancelLabel || t('BUTTON_CANCEL')}</span>
    </button> : null}
    <TableTurnOrb className={styles.primaryOrb} active={action.active}
      state={busy ? 'pending' : action.state} label={action.label} disabled={action.disabled || busy}
      onActivate={action.onActivate ? () => activate('confirm') : undefined}>
      <span className={styles.actionLabel}>{action.label}</span>
    </TableTurnOrb>
  </div>, inDialog ? action.host : document.body);
}

function PrimaryOrb({ store }: { store: TablePrimaryActionStore }) {
  const action = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return action ? <ActionControls key={action.id} action={action} /> : null;
}

export function TablePrimaryActionProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => new TablePrimaryActionStore());
  return <ActionContext.Provider value={store}>{children}<PrimaryOrb store={store} /></ActionContext.Provider>;
}

export function TablePrimaryAction({ priority = 100, active = true, disabled = false, state = 'ready', label = '确认当前选择', onActivate, onCancel, cancelLabel, cancelIcon, cancelDisabled = false }: {
  priority?: number;
  active?: boolean;
  disabled?: boolean;
  state?: TableOrbState;
  label?: string;
  onActivate?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  cancelLabel?: string;
  cancelIcon?: 'close' | 'arrow';
  cancelDisabled?: boolean;
}) {
  const store = useContext(ActionContext);
  const id = useId();
  const [host, setHost] = useState<HTMLSpanElement | null>(null);
  useLayoutEffect(() => {
    if (!store || !host) return;
    store.set(id, { host, priority, active, disabled, state, label, onActivate, onCancel, cancelLabel, cancelIcon, cancelDisabled });
  }, [store, host, id, priority, active, disabled, state, label, onActivate, onCancel, cancelLabel, cancelIcon, cancelDisabled]);
  useLayoutEffect(() => () => store?.remove(id), [store, id]);
  return <span ref={setHost} data-table-primary-host />;
}

/** Confirmation and its optional cancellation belong to the same prompt owner. */
export function TableConfirmAction({ disabled, onClick, onCancel, cancelLabel, cancelIcon, cancelDisabled, children }: {
  disabled?: boolean;
  onClick: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  cancelLabel?: string;
  cancelIcon?: 'close' | 'arrow';
  cancelDisabled?: boolean;
  children?: ReactNode;
}) {
  return <TablePrimaryAction disabled={disabled} state={disabled ? 'choose' : 'ready'}
    label={typeof children === 'string' ? children : '确认当前选择'} onActivate={onClick}
    onCancel={onCancel} cancelLabel={cancelLabel} cancelIcon={cancelIcon} cancelDisabled={cancelDisabled} />;
}
