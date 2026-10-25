import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { GameWinner } from 'ptcg-server';
import { useAuth } from '../context/AuthContext';
import { useDuoRoom } from './useDuoRoom';
import { TrainerPortrait } from './TrainerPortrait';
import { chineseCard, trainerDisplayName } from './chineseCatalog';
import { duoPresets } from './duoApi';
import { onImageError } from '../components/imageFallback';
import styles from './DuoRecordsPage.module.css';

/** Matches only keep deck names; preset covers give the wall its card art. */
function deckCover(name: string): string | undefined {
  const preset = duoPresets.find(preset => name.startsWith(preset.name));
  return preset ? chineseCard({ fullName: preset.cover })?.image : undefined;
}

export function DuoRecordsPage() {
  const { user } = useAuth();
  const { room, error, loading, refresh } = useDuoRoom();
  const uid = user?.userId ?? 0;

  // Matches arrive newest first: the leading run of identical results is the streak.
  let streakKind: 'w' | 'l' | 'd' | null = null;
  let streakCount = 0;
  for (const match of room.matches) {
    const isFirst = match.player1Id === uid;
    const draw = match.winner === GameWinner.DRAW;
    const won = match.winner === (isFirst ? GameWinner.PLAYER_1 : GameWinner.PLAYER_2);
    const kind: 'w' | 'l' | 'd' = draw ? 'd' : won ? 'w' : 'l';
    if (streakKind === null) { streakKind = kind; streakCount = 1; }
    else if (streakKind === kind) streakCount += 1;
    else break;
  }
  const streak = streakCount >= 2 && (streakKind === 'w' || streakKind === 'l') ? { kind: streakKind, count: streakCount } : null;

  return <div className={`a-page ${styles.root}`}>
    <div className="a-wrap">
      <header className={`${styles.head} a-rise`}>
        <div>
          <p className="a-hero-sub">战绩档案</p>
          <h1 className="a-hero-title">战报墙</h1>
        </div>
        <button type="button" className="a-btn-ghost" onClick={refresh} disabled={loading}>↻ 刷新</button>
      </header>

      {error && <p className={styles.errorNote} role="alert">{error}</p>}

      {/* 记分牌 */}
      <div className={styles.boards}>
        {room.players.map((player, index) => {
          const total = player.wins + player.losses + player.draws;
          const winRate = total ? Math.round(player.wins / total * 100) : 0;
          return <section className={`a-panel a-panel-corners a-rise ${styles.board}`} data-self={player.userId === user?.userId} key={player.userId}
            style={{ '--a-delay': `${Math.min(index, 5) * 80}ms` } as CSSProperties}>
            <div className={styles.boardTop}>
              <span className={styles.boardPortrait}><TrainerPortrait name={player.name} size={54} /></span>
              <div className={styles.boardMeta}>
                <h2 className={styles.boardName}>{player.label}{player.userId === user?.userId && <small>我</small>}</h2>
                <span className={styles.boardTotal}>{total} 场对战</span>
              </div>
              <div className={styles.ringWrap}>
                <span className={styles.ring} style={{ '--p': winRate } as CSSProperties}>
                  <b>{total ? winRate : '—'}</b>{total ? <i>%</i> : null}
                </span>
                <span className={styles.ringLabel}>胜率</span>
              </div>
            </div>
            <div className={styles.boardNumbers}>
              <div><strong>{String(total).padStart(2, '0')}</strong><span>总场次</span></div>
              <div><strong>{String(player.wins).padStart(2, '0')}</strong><span>胜</span></div>
              <div><strong>{String(player.losses).padStart(2, '0')}</strong><span>负</span></div>
              <div><strong>{String(player.draws).padStart(2, '0')}</strong><span>平</span></div>
            </div>
            <div className={styles.boardBar} aria-hidden="true">
              <i style={{ width: `${total ? player.wins / total * 100 : 0}%` }} />
              <i style={{ width: `${total ? player.losses / total * 100 : 0}%` }} />
            </div>
          </section>;
        })}
      </div>

      {/* 连胜 / 连败丝带 */}
      {streak && (
        <div className={`${styles.streakBar} a-rise`} style={{ '--a-delay': '120ms' } as CSSProperties}>
          <div className={styles.ribbon} data-kind={streak.kind}>
            <span className={styles.streakSeals} aria-hidden="true">
              {Array.from({ length: Math.min(streak.count, 5) }, (_, seal) => <i key={seal}>{streak.kind === 'w' ? '胜' : '负'}</i>)}
              {streak.count > 5 && <em>+{streak.count - 5}</em>}
            </span>
            <strong className={styles.streakText}>{streak.count} 连{streak.kind === 'w' ? '胜' : '败'}</strong>
          </div>
        </div>
      )}

      <div className="a-section a-rise" style={{ '--a-delay': '160ms' } as CSSProperties}>
        <h2 className="a-section-title">最近对局</h2>
        <span className="a-section-meta">最近 20 场</span>
      </div>

      {room.matches.length === 0 ? (
        <div className="a-empty a-rise" style={{ '--a-delay': '200ms' } as CSSProperties}>
          <span className={styles.emptyBall} aria-hidden="true" />
          <p className="a-empty-title">还没有战绩</p>
          <p className="a-empty-note">先去大厅打一场，战报就会贴上这面墙。</p>
          <Link to="/games" className="a-btn">去大厅</Link>
        </div>
      ) : (
        <div className={styles.wall}>
          {room.matches.map((match, index) => {
            const isFirst = match.player1Id === uid;
            const draw = match.winner === GameWinner.DRAW;
            const won = match.winner === (isFirst ? GameWinner.PLAYER_1 : GameWinner.PLAYER_2);
            const participants = [...room.players, ...(room.peers ?? [])];
            const first = participants.find(player => player.userId === match.player1Id);
            const second = participants.find(player => player.userId === match.player2Id);
            const firstName = first?.label ?? trainerDisplayName(first?.name ?? '训练家');
            const secondName = second?.label ?? trainerDisplayName(second?.name ?? '训练家');
            return <article className={styles.report} data-result={draw ? 'draw' : won ? 'win' : 'loss'} key={match.id}
              style={{ '--a-delay': `${Math.min(index, 9) * 60}ms`, '--tilt': `${(((match.id + index) % 3) - 1) * 0.7}deg` } as CSSProperties}>
              <span className={styles.pin} aria-hidden="true" />
              <div className={styles.reportHead}>
                <div className={styles.side}>
                  <span className={styles.portrait}><TrainerPortrait name={first?.name ?? '训练家'} size={40} /></span>
                  <span className={styles.sideMeta}>
                    <strong className={styles.sideName}>{firstName}</strong>
                    <small className={styles.sideDeck}>{match.deck1 || '自组卡组'}</small>
                  </span>
                  <span className={styles.deckChip} aria-hidden="true"><img src={deckCover(match.deck1) ?? '/assets/duo-cardback.svg'} alt="" onError={onImageError} /></span>
                </div>
                <span className={styles.vs} aria-hidden="true">VS</span>
                <div className={`${styles.side} ${styles.sideRight}`}>
                  <span className={styles.portrait}><TrainerPortrait name={second?.name ?? '训练家'} size={40} /></span>
                  <span className={styles.sideMeta}>
                    <strong className={styles.sideName}>{secondName}</strong>
                    <small className={styles.sideDeck}>{match.deck2 || '自组卡组'}</small>
                  </span>
                  <span className={styles.deckChip} aria-hidden="true"><img src={deckCover(match.deck2) ?? '/assets/duo-cardback.svg'} alt="" onError={onImageError} /></span>
                </div>
              </div>
              <footer className={styles.reportFoot}>
                <time className={styles.reportTime} dateTime={new Date(match.created).toISOString()}>{new Date(match.created).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>
                <Link className={styles.replayBtn} to={`/table/replay/${match.id}`}>回放 ↗</Link>
              </footer>
              <span className={styles.stamp}>{draw ? '平' : won ? '胜' : '负'}</span>
            </article>;
          })}
        </div>
      )}
    </div>
  </div>;
}
