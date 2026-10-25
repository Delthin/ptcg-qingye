import type { CSSProperties } from 'react';
import styles from '../DuoHomePage.module.css';

const LAYERS = 5;

/**
 * The active deck as a physical 3D stack lying on the table:
 * five card-back layers separated on the z-axis, topped by the deck's
 * featured Pokémon with a holographic sheet. Hover fans the stack into
 * an arc so every card edge is visible; the whole pile breathes.
 */
export function DeckStack({
  art,
  alt,
  onOpen,
  openDisabled = false,
}: {
  art?: string;
  alt: string;
  onOpen: () => void;
  openDisabled?: boolean;
}) {
  return (
    <div className={styles.deckStage}>
      <button
        type="button"
        className={styles.deckStackBtn}
        onClick={() => { if (!openDisabled) onOpen(); }}
        aria-disabled={openDisabled || undefined}
        aria-label={art ? `${alt} — 点击更换出战卡组` : '选择出战卡组'}
      >
        <span className={styles.deckStack}>
          {Array.from({ length: LAYERS }, (_, i) =>
            i === LAYERS - 1 && art ? (
              <span key={i} className={styles.stackCard} style={{ '--i': i } as CSSProperties}>
                <img src={art} alt={alt} className={styles.stackArt} />
                <span className={styles.holoSheet} />
              </span>
            ) : (
              <span key={i} className={styles.stackCard} style={{ '--i': i } as CSSProperties}>
                <span className={styles.stackBack} />
              </span>
            ),
          )}
        </span>
      </button>
      <span className={styles.deckShadow} aria-hidden="true" />
    </div>
  );
}
