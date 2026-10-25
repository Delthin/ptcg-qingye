import { useTranslation } from 'react-i18next';
import type { LocalGameState } from '../types/localGameState';
import styles from './TablePlayerActions.module.css';

export type TablePlayerActionsProps = {
  localGame: LocalGameState;
  clientId: number;
  isPlaying: boolean;
  isObserver: boolean;
  onPassTurn: () => void;
  onLeave: () => void;
  onSwitchSides: () => void;
};

/** Secondary actions; the turn action lives on the mat's physical orb. */
export function TablePlayerActions({ localGame, isPlaying, isObserver, onLeave, onSwitchSides }: TablePlayerActionsProps) {
  const { t } = useTranslation();
  return <div className={styles.root}>
    {localGame.replay || isObserver ? <button type="button" className={styles.iconButton} aria-label={t('TABLE_SWITCH_SIDES')} onClick={onSwitchSides}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 8h16m-4-4 4 4-4 4M20 16H4m4-4-4 4 4 4" /></svg>
    </button> : null}
    {isPlaying || isObserver || localGame.replay ? <button type="button" className={styles.iconButton} aria-label={t('BUTTON_LEAVE')} onClick={onLeave} disabled={!localGame.replay && isPlaying && !!localGame.deleted}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M10 4H5v16h5m4-13 5 5-5 5m-5-5h10" /></svg>
    </button> : null}
  </div>;
}
