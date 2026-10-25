import { GameWinner } from 'ptcg-server';
import { useAuth } from '../../context/AuthContext';
import { useEconomy } from '../../collection/EconomyContext';
import { formatGameMoney } from '../../collection/economyTypes';
import { TrainerPortrait } from '../../duo/TrainerPortrait';
import { trainerDisplayName } from '../../duo/chineseCatalog';
import type { LocalGameState } from '../types/localGameState';
import type { Card } from 'ptcg-server';
import { isValidPlayerGameStats } from './playerGameStats';
import styles from './GameOverOverlay.module.css';

export type GameOverOverlayProps = {
  localGame: LocalGameState; clientId: number;
  getScanUrl: (card: Card) => string; onConfirm: () => void;
};

/** Presentational scoreboard numbers for one seat; mirrors the end-game stats contract. */
function scoreboardStats(player: LocalGameState['state']['players'][number]): {
  prizeTotal: number;
  prizesTaken: number;
  damageDealt: number | null;
} {
  const gameStats = (player as { gameStats?: unknown }).gameStats;
  if (isValidPlayerGameStats(gameStats)) {
    const prizeTotal = Math.max(player.prizes?.length ?? 0, gameStats.prizesTakenCount);
    return { prizeTotal, prizesTaken: gameStats.prizesTakenCount, damageDealt: gameStats.totalDamageDealt };
  }
  const prizes = player.prizes ?? [];
  const remaining = prizes.filter((slot) => slot.cards.length > 0).length;
  return { prizeTotal: prizes.length, prizesTaken: Math.max(0, prizes.length - remaining), damageDealt: null };
}

export function GameOverOverlay({ localGame, clientId, onConfirm }: GameOverOverlayProps) {
  const { user } = useAuth();
  const economy = useEconomy();
  const state = localGame.state;
  const index = state.players.findIndex(player => player.id === clientId || player.name === user?.name);
  const winner = state.winner;
  const aborted = winner === GameWinner.NONE;
  const draw = winner === GameWinner.DRAW;
  const won = !aborted && !draw && winner === (index === 0 ? GameWinner.PLAYER_1 : GameWinner.PLAYER_2);
  const selfPlay = state.gameSettings?.selfPlay === true;
  // Coins settle server-side for a completed online match only; amounts come from the server snapshot.
  const rewards = economy.snapshot?.battleReward;
  const rewardMinor = !aborted && index >= 0 && !selfPlay && rewards
    ? (draw ? rewards.draw : won ? rewards.win : rewards.loss)
    : null;
  const title = aborted ? '这场对局已中止。' : draw ? '这一局，平分秋色。' : won ? '这一局，你赢了。' : '这一局，搭档获胜。';
  const mood = aborted ? 'abort' : draw ? 'draw' : won ? 'win' : 'lose';
  return <div className={styles.overlay} data-mood={mood} role="dialog" aria-modal="true" aria-label="对战结果">
    <div className={styles.hairlineTop} aria-hidden="true" />
    <section className={styles.panel}>
      <span className={styles.eyebrow}>{aborted ? 'MATCH INTERRUPTED' : 'GOOD GAME, TRAINERS'}</span>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.trainers}>{state.players.map((player, playerIndex) => {
        const playerWon = !aborted && !draw && winner === (playerIndex === 0 ? GameWinner.PLAYER_1 : GameWinner.PLAYER_2);
        const score = scoreboardStats(player);
        return <div key={player.id} className={styles.trainer} data-winner={playerWon || undefined}>
          <span className={styles.portraitRing} aria-hidden="true"><TrainerPortrait name={player.name} size={90} /></span>
          <strong className={styles.trainerName}>{trainerDisplayName(player.name)}</strong>
          <span className={styles.verdict}>{aborted ? '未计入战绩' : draw ? '平局' : winner === (playerIndex === 0 ? GameWinner.PLAYER_1 : GameWinner.PLAYER_2) ? '胜利' : '落败'}</span>
          <div className={styles.score}>
            <span className={styles.beads} aria-hidden="true">
              {Array.from({ length: score.prizeTotal }, (_, i) => (
                <i key={i} className={styles.bead} data-taken={i < score.prizesTaken || undefined} />
              ))}
            </span>
            <span className={styles.scoreNum}>{score.prizesTaken}/{score.prizeTotal}</span>
            {score.damageDealt != null ? <span className={styles.scoreNum}>{score.damageDealt}</span> : null}
          </div>
        </div>;
      })}</div>
      {rewardMinor != null ? (
        <p className={styles.reward} role="status">
          <span className={styles.rewardLabel}>本局金币</span>
          <span className={styles.rewardAmount}>+{formatGameMoney(rewardMinor)} 游戏元</span>
        </p>
      ) : null}
      <p className={styles.note}>{aborted ? '未完成的对局不会记为胜负，可以回到房间重新开始。' : `共进行了 ${state.turn} 个回合。完成的对局由服务器保存，可在对战记录里查看。`}</p>
      <div className={styles.actions}>
        <button className={`a-btn ${styles.primaryBtn}`} onClick={onConfirm}>回到对战室 <span aria-hidden>↗</span></button>
      </div>
    </section>
  </div>;
}
