import { TrainerPortrait } from '../TrainerPortrait';
import { GameIcon } from '../GameIcon';
import { spawnRipple } from './ripple';
import styles from '../DuoHomePage.module.css';

export type LetterMode = 'incoming' | 'active' | 'outgoing';

const COPY: Record<LetterMode, { title: (peer: string) => string; body: (peer: string) => string }> = {
  incoming: {
    title: peer => `${peer} 的挑战信`,
    body: peer => `${peer} 已提交出战卡组，向你递来对战书。点击应战进入牌桌后，还须选择并确认你的出战卡组，双方才能开始布置牌阵。`,
  },
  active: {
    title: () => '牌局进行中',
    body: peer => `你与 ${peer} 的对局还没有分出胜负，回到牌桌继续。`,
  },
  outgoing: {
    title: () => '挑战信已寄出',
    body: peer => `你的出战卡组已提交，正在等待 ${peer} 应战并选择、确认卡组。确认后这里会提示进入牌桌；等待期间可以撤回。`,
  },
};

/**
 * Invites arrive as a physical letter: it flies in from off-screen with a
 * spin, lands with a slight tilt, and the wax seal thumps down last.
 * Incoming = red seal, active = gold, outgoing = bronze.
 */
export function ChallengeLetter({
  mode,
  myName,
  peerName,
  peerLabel,
  actionBusy,
  setupPending,
  onResume,
  onDecline,
  onCancel,
}: {
  mode: LetterMode;
  myName: string;
  peerName: string;
  peerLabel: string;
  actionBusy: boolean;
  setupPending: boolean;
  onResume: () => void;
  onDecline: () => void;
  onCancel: () => void;
}) {
  const copy = mode === 'active' && setupPending ? {
    title: () => '对手已确认，请进入牌桌',
    body: (peer: string) => `${peer} 已确认出战卡组。请点击「进入牌桌」，与对手一起布置开局牌阵。`,
  } : COPY[mode];
  return (
    <section
      className={`${styles.letter} ${styles[`letter_${mode}`]}`}
      aria-label={copy.title(peerLabel)}
    >
      <div className={styles.letterCard}>
        <span className={styles.letterSeal} aria-hidden="true" />
        <div className={styles.letterVS}>
          <div className={styles.letterTrainer}>
            <TrainerPortrait name={myName} size={54} />
            <span>{myName || '你'}</span>
          </div>
          <span className={styles.vsMark} aria-hidden="true">VS</span>
          <div className={styles.letterTrainer}>
            <TrainerPortrait name={peerName || peerLabel} size={54} />
            <span>{peerLabel}</span>
          </div>
        </div>
        <div className={styles.letterText} role="status" aria-live="polite" aria-atomic="true">
          <h2>{copy.title(peerLabel)}</h2>
          <p>{copy.body(peerLabel)}</p>
        </div>
        <div className={styles.letterActions}>
          {mode === 'incoming' && (
            <>
              <button
                type="button"
                className={styles.stampBtn}
                disabled={actionBusy}
                onPointerDown={spawnRipple}
                onClick={onResume}
              >
                <GameIcon name="check" size={16} />
                应战
              </button>
              <button
                type="button"
                className={styles.paperGhost}
                disabled={actionBusy}
                onPointerDown={spawnRipple}
                onClick={onDecline}
              >
                <GameIcon name="close" size={13} />
                婉拒
              </button>
            </>
          )}
          {mode === 'active' && (
            <button
              type="button"
              className={styles.stampBtn}
              disabled={actionBusy}
              onPointerDown={spawnRipple}
              onClick={onResume}
            >
              <GameIcon name="arrow" size={16} />
              {setupPending ? '进入牌桌' : '回到牌桌'}
            </button>
          )}
          {mode === 'outgoing' && (
            <button
              type="button"
              className={styles.paperGhost}
              disabled={actionBusy}
              onPointerDown={spawnRipple}
              onClick={onCancel}
            >
              <GameIcon name="close" size={13} />
              撤回挑战
            </button>
          )}
        </div>
        <span className={styles.letterTear} aria-hidden="true" />
      </div>
    </section>
  );
}
