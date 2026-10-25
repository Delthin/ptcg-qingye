import { useId } from 'react';
import styles from './Board2D.module.css';

/**
 * 桌垫印刷层：中央徽记（同心圆 + 精灵球刻线 + 12 个方位刻度）。
 * 参照官方 30 周年庆典双人卡垫的烫金印线；配色由主题提供 CSS 变量，
 * 深色桌垫用烫金，纸面桌垫用油墨色。
 */
export function MatPrint({ portrait }: { portrait: boolean }) {
  const ink = useId();
  const rough = useId();
  return (
    <svg className={styles.matPrint} viewBox="0 0 1000 1034" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <linearGradient id={ink} x1="0" y1="0" x2="1" y2=".4">
          <stop style={{ stopColor: 'var(--mat-print-1)' }} />
          <stop offset=".35" style={{ stopColor: 'var(--mat-print-2)' }} />
          <stop offset=".55" style={{ stopColor: 'var(--mat-print-3)' }} />
          <stop offset=".85" style={{ stopColor: 'var(--mat-print-4)' }} />
          <stop offset="1" style={{ stopColor: 'var(--mat-print-5)' }} />
        </linearGradient>
        {/* 印刷粗糙感：细微的网点扰动，让线稿像真的印在桌垫上。 */}
        <filter id={rough} x="-2%" y="-2%" width="104%" height="104%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="5" stitchTiles="stitch" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.1" />
        </filter>
      </defs>
      <g fill="none" stroke={`url(#${ink})`} strokeWidth="1.6" style={{ opacity: 'var(--mat-print-opacity)' }} filter={`url(#${rough})`}>
        <circle cx="500" cy="517" r="178" /><circle cx="500" cy="517" r="160" />
        <circle cx="500" cy="517" r="130" opacity=".8" />
        <path d="M370 517h260" />
        <circle cx="500" cy="517" r="24" style={{ fill: 'var(--mat-print-core)' }} /><circle cx="500" cy="517" r="14" />
        {Array.from({ length: 12 }, (_, i) => {
          const angle = i * Math.PI / 6;
          return <path key={i} opacity=".5" transform={`translate(${500 + Math.sin(angle) * 169},${517 + Math.cos(angle) * 169}) rotate(${i * 30})`} d="M-4 3L0-5L4 3Z M-3 6H3" />;
        })}
        {portrait ? <path d="M242 432h16m-16 0v16m-16 80v16h16" opacity=".35" /> : null}
      </g>
    </svg>
  );
}
