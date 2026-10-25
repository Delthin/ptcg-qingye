import { useEffect, useRef, useState } from 'react';
import { GameLog } from 'ptcg-server';
import type { LocalGameState } from '../types/localGameState';
import styles from './Board2D.module.css';
import { CoinToss } from '../CoinToss';
import { coinById } from '../../collection/coinCatalog';

type Flip = { result: boolean; key: number; coinId: string; owner: string };

/** One authoritative source: arbiter logs cover setup, status checks and attack flips alike. */
export function BoardCoinFlip({ game }: { game: LocalGameState }) {
  const [flip, setFlip] = useState<Flip | null>(null);
  const queue = useRef<Flip[]>([]);
  const busy = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const seen = useRef(Math.max(0, ...game.logs.map(log => log.id)));
  const gameKey = useRef(game.localId);
  const advance = useRef<() => void>(() => {});
  advance.current = () => {
    const next = queue.current.shift();
    if (!next) { busy.current = false; setFlip(null); return; }
    busy.current = true; setFlip(next);
    timer.current = window.setTimeout(() => advance.current(), 1600);
  };
  useEffect(() => {
    if (gameKey.current !== game.localId) {
      clearTimeout(timer.current); queue.current = []; busy.current = false; setFlip(null);
      seen.current = Math.max(0, ...game.logs.map(log => log.id)); gameKey.current = game.localId;
      return;
    }
    for (const log of [...game.logs].sort((a, b) => a.id - b.id)) {
      if (log.id <= seen.current) continue;
      seen.current = log.id;
      if (log.message === GameLog.LOG_PLAYER_FLIPS_HEADS || log.message === GameLog.LOG_PLAYER_FLIPS_TAILS) {
        const actor = game.state.players.find(player => player.name === log.params?.name)
          ?? game.state.players.find(player => player.id === log.client);
        // Read the game-frozen appearance, not the viewer's current collection or a client URL.
        const coinId = coinById((actor as { coinId?: string } | undefined)?.coinId).id;
        queue.current.push({ key: log.id, result: log.message === GameLog.LOG_PLAYER_FLIPS_HEADS, coinId, owner: actor?.name ?? '' });
      }
    }
    if (!busy.current) advance.current();
  }, [game.logs, game.localId]);
  useEffect(() => () => { clearTimeout(timer.current); queue.current = []; }, []);
  if (!flip) return null;
  return <div key={flip.key} className={styles.flipStage}>
    <CoinToss coinId={flip.coinId} heads={flip.result} owner={flip.owner} />
  </div>;
}
