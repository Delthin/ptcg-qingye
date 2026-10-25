import type { CSSProperties } from 'react';
import type { DuoPlayer } from '../duoApi';
import { TrainerPortrait } from '../TrainerPortrait';
import { useTilt } from './usePointerFX';
import { spawnRipple } from './ripple';
import styles from '../DuoHomePage.module.css';

function Swords({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 4l10.5 10.5M19 4 8.5 14.5" />
      <path d="m14 17 3-3M7 14l3 3" />
      <path d="M15.5 15.5 18.5 18.5M8.5 15.5 5.5 18.5" />
    </svg>
  );
}

/**
 * An opponent's seat: a standing trainer card with pointer tilt,
 * glare highlight, iridescent press feedback and a slow float.
 */
export function SeatCard({
  player,
  index,
  canChallenge,
  challenging,
  actionBusy,
  blockedReason,
  onChallenge,
}: {
  player: DuoPlayer;
  index: number;
  canChallenge: boolean;
  challenging: boolean;
  actionBusy: boolean;
  /** 不可挑战时的具体原因（我方或对方）。 */
  blockedReason?: string;
  onChallenge: () => void;
}) {
  const tilt = useTilt<HTMLDivElement>(8);
  const disabled = !canChallenge || challenging || actionBusy;
  return (
    <article
      className={styles.seat}
      style={{ '--enter-delay': `${1.05 + (index % 8) * 0.07}s` } as CSSProperties}
    >
      <div
        className={styles.seatFloat}
        style={{ '--float-delay': `${(index % 5) * 0.9}s` } as CSSProperties}
      >
        <div
          className={`${styles.seatCard} ${styles.tiltCard}`}
          {...tilt}
        >
          <div className={styles.seatFrame}>
            <div className={styles.seatPortrait}>
              <TrainerPortrait name={player.name} size={72} />
            </div>
            <span className={styles.seatCorner} aria-hidden="true" />
          </div>
          <div className={styles.seatInfo}>
            <h3 className={styles.seatName}>{player.label}</h3>
            <p className={styles.seatDeck}>{player.selectedDeckName || '未亮出卡组'}</p>
          </div>
          <p className={styles.seatRecord}>
            <span className={styles.recW}>{player.wins} 胜</span>
            <i aria-hidden="true" />
            <span className={styles.recL}>{player.losses} 负</span>
            {player.draws > 0 && <i aria-hidden="true" />}
            {player.draws > 0 && <span className={styles.recD}>{player.draws} 平</span>}
          </p>
          <button
            type="button"
            className={styles.challengeBtn}
            disabled={disabled}
            onPointerDown={spawnRipple}
            onClick={onChallenge}
            title={disabled ? blockedReason : undefined}
          >
            <Swords size={15} />
            {challenging ? '挑战中…' : '发起挑战'}
          </button>
          <span className={styles.glare} aria-hidden="true" />
        </div>
        <span className={styles.seatShadow} aria-hidden="true" />
      </div>
    </article>
  );
}
