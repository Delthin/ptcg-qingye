import { useEffect, useRef } from 'react';
import { GamePhase } from 'ptcg-server';
import styles from './BattleTurnAnnouncement.module.css';

export function BattleTurnAnnouncement({ phase, turn, yourTurn }: { phase: GamePhase; turn: number; yourTurn: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (phase !== GamePhase.PLAYER_TURN || !ref.current) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animation = ref.current.animate(reduced ? [
      { opacity: 0 }, { opacity: 1, offset: .18 }, { opacity: 1, offset: .8 }, { opacity: 0 },
    ] : [
      { opacity: 0, transform: 'scale(1.22) translateY(6px)' },
      { opacity: 1, transform: 'scale(0.97) translateY(0)', offset: .32 },
      { opacity: 1, transform: 'scale(1) translateY(0)', offset: .72 },
      { opacity: 0, transform: 'scale(1.03) translateY(0)' },
    ], { duration: 660, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });
    return () => animation.cancel();
  }, [phase, turn, yourTurn]);
  return <div ref={ref} className={styles.banner} data-owner={yourTurn ? 'self' : 'opponent'} aria-hidden="true">
    <span>{yourTurn ? '轮到你了' : '对手的回合'}</span><small>TURN {turn}</small>
  </div>;
}
