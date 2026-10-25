import styles from './DeckComposition.module.css';

export type DeckCounts = { pokemon: number; trainer: number; energy: number };
export function DeckComposition({ counts, total, compact = false, inline = false }: { counts: DeckCounts; total: number; compact?: boolean; inline?: boolean }) {
  const unknown = Math.max(0, total - counts.pokemon - counts.trainer - counts.energy);
  const groups = [{ key: 'pokemon', label: '宝可梦', mark: '◉' }, { key: 'trainer', label: '训练家', mark: '▣' }, { key: 'energy', label: '能量', mark: 'ϟ' }] as const;
  return <div className={`${styles.composition} ${inline ? styles.inline : compact ? styles.compact : ''}`} aria-label={`卡组共 ${total} 张，目标 60 张，宝可梦 ${counts.pokemon} 张，训练家 ${counts.trainer} 张，能量 ${counts.energy} 张${unknown ? `，${unknown} 张待识别` : ''}`} >
    <div className={styles.total} data-complete={total === 60} data-over={total > 60} style={{ ['--fill' as string]: `${Math.min(100, Math.max(0, total / 60 * 100))}%` }}><strong>{String(total).padStart(2, '0')}</strong><span>/ 60<small data-unknown={unknown > 0}>{unknown ? `${unknown} 张待识别` : total === 60 ? '张数齐备' : total > 60 ? `超出 ${total - 60} 张` : `还差 ${60 - total} 张`}</small></span></div>
    <div className={styles.categories}>{groups.map(group => <div key={group.key} data-kind={group.key}><i aria-hidden>{group.mark}</i><span>{group.label}</span><strong>{counts[group.key]}</strong></div>)}</div>
    <div className={styles.track} aria-hidden>{groups.map(group => <span key={group.key} data-kind={group.key} style={{ width: `${counts[group.key] / Math.max(60, total) * 100}%` }} />)}</div>
  </div>;
}
