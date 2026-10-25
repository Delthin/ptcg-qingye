import styles from '../DuoHomePage.module.css';

/**
 * Hero centrepiece: the pokéball drops from the sky when the lobby mounts,
 * bounces twice on the inlaid brass ring (with impact dust and a table
 * thud), then idles with a gentle bob. Everything is CSS — no JS state.
 */
export function Emblem() {
  return (
    <div className={styles.emblem}>
      <div className={styles.emblemThud}>
        <div className={styles.emblemRing} />
        <span className={`${styles.impact} ${styles.impact1}`} />
        <span className={`${styles.impact} ${styles.impact2}`} />
        <div className={styles.ballShadow} />
        <div className={styles.ballIdle}>
          <span className={`${styles.ballSpark} ${styles.sparkA}`} />
          <span className={`${styles.ballSpark} ${styles.sparkB}`} />
          <div className={styles.dropBall}>
            <span className={styles.ballBody} />
          </div>
        </div>
      </div>
    </div>
  );
}
