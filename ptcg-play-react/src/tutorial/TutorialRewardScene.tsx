import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { cn } from '../utils/cn';
import { Loading } from '../components/ui/Loading';
import { ShellButton } from '../components/ui/ShellButton';
import styles from './TutorialRewardScene.module.css';

/**
 * 注册时已入账的新手赠送（预组 + 对应卡牌）。本场景只做展示，
 * 不发卡、不请求接口；数据与「是否已看过」由上层核实后传入。
 */
export interface TutorialRewardGift {
  id: string;
  name: string;
  productName?: string;
  /** 绝对或 same-origin 的封面 URL；缺省或加载失败时回退到内置通用卡叠包装。 */
  coverImage?: string;
  cardCount: number;
}

export interface TutorialRewardSceneProps {
  gifts: readonly TutorialRewardGift[];
  status: 'loading' | 'ready' | 'error' | 'empty';
  /** 仅首次到达为 true；false 表示之前看过，直接呈现最终状态不重播。 */
  animate: boolean;
  error?: string;
  onRetry: () => void;
  onViewDecks: () => void;
  onViewCollection: () => void;
  onDone: () => void;
  onRestart: () => void;
}

/** 教程完成后的新手礼包到账场景：预组落桌、金带开启揭示名称、提示去向。CTA 永不等待动画。 */
export function TutorialRewardScene({
  gifts, status, animate, error, onRetry, onViewDecks, onViewCollection, onDone, onRestart,
}: TutorialRewardSceneProps) {
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (status !== 'loading') headingRef.current?.focus({ preventScroll: true });
  }, [status]);
  const ready = status === 'ready' && gifts.length > 0;
  const play = ready && animate;

  const tag = ready ? '注册赠送'
    : status === 'loading' ? '核对中'
    : status === 'error' ? '同步失败'
    : '无赠送记录';
  const title = ready ? '新手礼包已到账' : '教学已完成';
  const countWord = gifts.length === 1 ? '一' : gifts.length === 2 ? '两' : String(gifts.length);
  const sub = ready ? `新手赠送的${countWord}套预组已经在你的账号里，随时可以查看。` : '';
  const noticeText =
    status === 'loading' ? '正在核对你账号的新手赠送记录……'
    : status === 'error' ? '新手赠送记录同步失败，不影响已完成的教程进度。'
    : ready ? '预组已加入卡组，对应卡牌已加入收藏。'
    : '当前账号没有可展示的新手赠送记录，可前往卡组查看已有卡组。';

  return (
    <section className={styles.scene} aria-labelledby={headingId} aria-busy={status === 'loading' || undefined}>
      <div className={styles.scroll}>
        <div className={cn(styles.inner, play && styles.play)}>
          <header className={styles.hero}>
            <span className={cn('a-tag', styles.tag)}>{tag}</span>
            <h1 ref={headingRef} tabIndex={-1} id={headingId} className={styles.title}>{title}</h1>
            {sub && <p className={styles.sub}>{sub}</p>}
          </header>

          {ready && (
            <div className={styles.giftRow}>
              {gifts.map((gift, index) => (
                <GiftPack key={gift.id} gift={gift} index={index} />
              ))}
            </div>
          )}

          {status === 'loading' && (
            <div className={styles.statusCard}><Loading size="sm" /></div>
          )}

          {status === 'error' && (
            <div className={styles.statusCard}>
              <p className={styles.statusText}>新手赠送记录暂时没有同步成功，教学的完成进度已经保存，不影响后续游玩。</p>
              {error && <p className={styles.errorDetail}>{error}</p>}
              <ShellButton variant="secondary" onClick={onRetry}>重试</ShellButton>
            </div>
          )}

          {status !== 'error' && error && <p className={styles.errorDetail} role="alert">{error}</p>}
          <p className={styles.notice} role="status" aria-live="polite">
            <span className={styles.noticeDiamond} aria-hidden="true" />
            {noticeText}
          </p>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.actions}>
          <ShellButton onClick={onViewDecks}>查看卡组</ShellButton>
          <ShellButton onClick={onViewCollection}>查看收藏</ShellButton>
          <ShellButton variant="secondary" onClick={onDone}>返回大厅</ShellButton>
        </div>
        <ShellButton variant="plain" className={styles.restart} onClick={onRestart}>重新学习教学</ShellButton>
      </footer>
    </section>
  );
}

/** 单个封装预组：错位卡叠厚度 + 封面 + 金带封签；--d 驱动 70ms 顺次入场。 */
function GiftPack({ gift, index }: { gift: TutorialRewardGift; index: number }) {
  const [coverFailed, setCoverFailed] = useState(false);
  const cover = !coverFailed && gift.coverImage ? gift.coverImage : null;
  const product = gift.productName?.trim();
  const uid = gift.id.replace(/[^a-zA-Z0-9_-]/g, '') || String(index);
  return (
    <figure className={styles.gift} style={{ '--d': `${index * 70}ms` } as CSSProperties}>
      <div className={styles.pack}>
        <span className={cn(styles.leaf, styles.leafB)} aria-hidden="true" />
        <span className={cn(styles.leaf, styles.leafA)} aria-hidden="true" />
        <div className={styles.face} aria-hidden="true">
          {cover
            ? <img className={styles.artImg} src={cover} alt="" draggable={false} decoding="async"
                onError={() => setCoverFailed(true)} />
            : <GenericPackArt uid={uid} />}
          <span className={styles.sheen} />
        </div>
        <span className={styles.band} aria-hidden="true" />
        <span className={styles.seal} aria-hidden="true" />
      </div>
      <figcaption className={styles.giftInfo}>
        <span className={styles.giftName}>{gift.name}</span>
        {product && product !== gift.name && <span className={styles.giftProduct}>{product}</span>}
        <span className={styles.giftMeta}>{gift.cardCount} 张卡牌</span>
      </figcaption>
    </figure>
  );
}

/** 缺封面时的通用卡叠包装（源码 SVG，材质沿用绿绒 + 黄铜）。 */
function GenericPackArt({ uid }: { uid: string }) {
  const p = `trg-${uid}`;
  return (
    <svg className={styles.art} viewBox="0 0 125 175" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${p}-bg`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#2a7a4d" />
          <stop offset=".55" stopColor="#1f5c3a" />
          <stop offset="1" stopColor="#143d26" />
        </linearGradient>
        <linearGradient id={`${p}-brass`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#e8c85a" />
          <stop offset=".5" stopColor="#c9a227" />
          <stop offset="1" stopColor="#8a6f14" />
        </linearGradient>
        <radialGradient id={`${p}-glow`} cx=".5" cy=".4" r=".65">
          <stop offset="0" stopColor="#fff8e2" stopOpacity=".16" />
          <stop offset="1" stopColor="#fff8e2" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="125" height="175" rx="10" fill={`url(#${p}-bg)`} />
      <rect width="125" height="175" rx="10" fill={`url(#${p}-glow)`} />
      <rect x="7.5" y="7.5" width="110" height="160" rx="6" fill="none" stroke={`url(#${p}-brass)`} strokeWidth="1.5" opacity=".9" />
      <rect x="13" y="13" width="99" height="149" rx="4" fill="none" stroke="#c9a227" strokeWidth=".75" opacity=".38" />
      <g stroke="#f6efdd" strokeOpacity=".5" strokeWidth="2" strokeLinecap="round">
        <path d="M44 22h37" />
        <path d="M48 27h29" />
      </g>
      <g transform="translate(62.5 92)">
        <rect x="-20" y="-20" width="40" height="40" transform="rotate(45)" fill={`url(#${p}-brass)`} />
        <rect x="-14" y="-14" width="28" height="28" transform="rotate(45)" fill="#1c4a2f" />
        <rect x="-6.5" y="-6.5" width="13" height="13" transform="rotate(45)" fill={`url(#${p}-brass)`} />
      </g>
      <g stroke={`url(#${p}-brass)`} strokeWidth="1.5" strokeLinecap="round" opacity=".8" fill="none">
        <path d="M20 28v-8h8" />
        <path d="M105 28v-8h-8" />
        <path d="M20 147v8h8" />
        <path d="M105 147v8h-8" />
      </g>
    </svg>
  );
}
