import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DuoDialog } from '../duo/DuoDialog';
import styles from './DeckQuantityDialog.module.css';

export type DeckQuantityDialogProps = { open: boolean; value: number; minValue?: number; maxValue: number; cardName?: string; onClose: () => void; onConfirm: (count: number) => void };
export function DeckQuantityDialog({ open, value, minValue = 0, maxValue, cardName, onClose, onConfirm }: DeckQuantityDialogProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(String(value));
  useEffect(() => {
    if (!open) return;
    setText(String(value));
    const frame = requestAnimationFrame(() => { inputRef.current?.focus(); inputRef.current?.select(); });
    return () => cancelAnimationFrame(frame);
  }, [open, value]);
  const submit = useCallback(() => {
    if (!text.trim()) { onClose(); return; }
    const parsed = parseInt(text, 10);
    if (!Number.isFinite(parsed)) { onClose(); return; }
    onConfirm(Math.min(maxValue, Math.max(minValue, parsed)));
    onClose();
  }, [text, minValue, maxValue, onConfirm, onClose]);
  /** Stepper knobs only rewrite the local text field; submit still clamps. */
  const step = useCallback((delta: number) => {
    const parsed = parseInt(text, 10);
    const base = Number.isFinite(parsed) ? parsed : value;
    setText(String(Math.min(maxValue, Math.max(minValue, base + delta))));
  }, [text, value, minValue, maxValue]);
  if (!open) return null;
  return <DuoDialog title={t('DECK_EDIT_HOW_MANY_CARDS')} className={styles.panel} onClose={onClose}>
    {cardName && <p className={styles.cardName}>{cardName}</p>}
    <div className={styles.stepperRow}>
      <button type="button" className={styles.stepBtn} onClick={() => step(-1)} disabled={(parseInt(text, 10) || value) <= minValue} aria-label={t('DECK_EDIT_REMOVE_ONE')}>−</button>
      <label className={styles.field}><span className={styles.srOnly}>{t('DECK_EDIT_HOW_MANY_CARDS')}</span><input ref={inputRef} type="number" autoFocus className={styles.input} value={text} min={minValue} max={maxValue} inputMode="numeric" onChange={event => setText(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); submit(); } }} /></label>
      <button type="button" className={styles.stepBtn} onClick={() => step(1)} disabled={(parseInt(text, 10) || value) >= maxValue} aria-label={t('DECK_EDIT_ADD_ONE')}>＋</button>
    </div>
    <p className={styles.hint}>{minValue} – {maxValue}</p><div className="duo-dialog-actions"><button type="button" className="duo-button" onClick={onClose}>{t('BUTTON_CANCEL')}</button><button type="button" className="duo-button duo-button-primary" onClick={submit}>{t('BUTTON_OK')}</button></div>
  </DuoDialog>;
}
