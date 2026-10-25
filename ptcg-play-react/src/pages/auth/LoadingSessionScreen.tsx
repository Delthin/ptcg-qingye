import { useTranslation } from 'react-i18next';
import '../../duo/duo.css';
import styles from './LoadingSessionScreen.module.css';

/** Session-restore screen sharing the login room material: card back + CSS poké ball, no fake progress. */
export function LoadingSessionScreen() {
  const { t } = useTranslation();

  return (
    <div
      className={styles.screen}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={t('PROTECTED_LOADING_SESSION')}
    >
      <div className={styles.scene} aria-hidden="true">
        <span className={styles.card} />
        <span className={styles.ball} />
      </div>
      <p className={styles.status}>正在恢复登录…</p>
    </div>
  );
}
