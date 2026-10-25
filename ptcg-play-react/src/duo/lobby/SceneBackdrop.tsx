import styles from '../DuoHomePage.module.css';

/**
 * The room around the table: a dusk sky with drifting clouds, a distant
 * pokéball factory silhouette with smoking chimneys, and the wooden card
 * table itself (walnut rim + green felt + wear). Purely decorative;
 * layers read --px/--py for pointer parallax.
 */
export function SceneBackdrop() {
  return (
    <div className={styles.scene} aria-hidden="true">
      <div className={styles.sky}>
        <span className={`${styles.cloud} ${styles.cloudA}`} />
        <span className={`${styles.cloud} ${styles.cloudB}`} />
        <span className={`${styles.cloud} ${styles.cloudC}`} />
        <div className={styles.horizonGlow} />
        <div className={styles.factory}>
          <span className={styles.factoryGlow} />
          <span className={`${styles.smoke} ${styles.smoke1}`} />
          <span className={`${styles.smoke} ${styles.smoke2}`} />
          <span className={`${styles.smoke} ${styles.smoke3}`} />
          <span className={`${styles.smoke} ${styles.smoke4}`} />
          <span className={`${styles.smoke} ${styles.smoke5}`} />
          <span className={`${styles.smoke} ${styles.smoke6}`} />
        </div>
      </div>

      <div className={styles.table}>
        <div className={styles.felt}>
          <div className={styles.feltRing} />
          <span className={`${styles.scratch} ${styles.scratchA}`} />
          <span className={`${styles.scratch} ${styles.scratchB}`} />
          <span className={`${styles.scratch} ${styles.scratchC}`} />
          <span className={`${styles.mote} ${styles.mote1}`} />
          <span className={`${styles.mote} ${styles.mote2}`} />
          <span className={`${styles.mote} ${styles.mote3}`} />
          <span className={`${styles.mote} ${styles.mote4}`} />
          <span className={`${styles.mote} ${styles.mote5}`} />
          <span className={`${styles.mote} ${styles.mote6}`} />
        </div>
      </div>

      <div className={styles.vignette} />
    </div>
  );
}
