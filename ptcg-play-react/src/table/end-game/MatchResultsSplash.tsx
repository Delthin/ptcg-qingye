import { useEffect, useRef } from 'react';
import { GameWinner } from 'ptcg-server';
import type { LocalGameState } from '../types/localGameState';
import { useAuth } from '../../context/AuthContext';
import styles from './MatchResultsSplash.module.css';

export type MatchResultsSplashProps = { localGame: LocalGameState; clientId: number; onDismiss: () => void };
export function MatchResultsSplash({ localGame, clientId, onDismiss }: MatchResultsSplashProps) {
  const { user } = useAuth();
  const dismiss = useRef(onDismiss); dismiss.current = onDismiss;
  useEffect(() => { const timer = setTimeout(() => dismiss.current(), 900); return () => clearTimeout(timer); }, [localGame.localId]);
  const index = localGame.state.players.findIndex(player => player.id === clientId || player.name === user?.name);
  const winner = localGame.state.winner;
  const text = winner === GameWinner.NONE ? '对局中止' : winner === GameWinner.DRAW ? '平局' : winner === (index === 0 ? GameWinner.PLAYER_1 : GameWinner.PLAYER_2) ? '胜利' : '搭档获胜';
  const mood = winner === GameWinner.NONE ? 'abort' : winner === GameWinner.DRAW ? 'draw' : winner === (index === 0 ? GameWinner.PLAYER_1 : GameWinner.PLAYER_2) ? 'win' : 'lose';
  return <div className={styles.splash} data-mood={mood} role="status"><span className={styles.stamp}>{text}</span></div>;
}
