import { useEffect, useState } from 'react';
import { coinById, coinImageFallback } from '../collection/coinCatalog';
import styles from './CoinToss.module.css';

/** The server supplies result. The animation never samples or modifies game randomness. */
export function CoinToss({ coinId, heads, owner = '' }: { coinId?: string; heads: boolean; owner?: string }) {
  const coin = coinById(coinId);
  const [landed, setLanded] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) { setLanded(true); return; }
    const timer = window.setTimeout(() => setLanded(true), 1100);
    const onChange = () => { if (media.matches) setLanded(true); };
    media.addEventListener('change', onChange);
    return () => { clearTimeout(timer); media.removeEventListener('change', onChange); };
  }, []);
  return <div className={styles.stage} data-coin-id={coin.id} data-result={heads ? 'heads' : 'tails'} data-landed={landed}>
    <div className={styles.surface} aria-hidden="true">
      <div className={styles.flight}><div className={styles.tilt}><div className={styles.coin}>
        <i className={styles.edge} /><i className={styles.edge} /><i className={styles.edge} />
        <img className={styles.front} src={coin.frontImage} alt="" onError={event => coinImageFallback(event)} />
        <img className={styles.back} src={coin.backImage} alt="" onError={event => coinImageFallback(event, true)} />
      </div></div></div>
      <div className={styles.shadow} />
    </div>
    <div className={styles.caption} role="status" aria-live="polite">
      <span>{owner ? `${owner} · ` : ''}{coin.name}</span>
      <strong>{landed ? heads ? '正面' : '反面' : '抛硬币…'}</strong>
    </div>
  </div>;
}
