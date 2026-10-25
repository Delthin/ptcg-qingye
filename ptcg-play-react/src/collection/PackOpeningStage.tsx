import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { DuoDialog } from '../duo/DuoDialog';
import { cardPattern, cardRarity, rarityLabel } from '../duo/chineseCatalog';
import { rarityEffect, rarityEffectRank, type RarityEffect } from './rarityEffects';
import type { PackOpening } from './economyTypes';
import styles from './PackOpeningStage.module.css';

type Phase = 'sealed' | 'cutting' | 'reveal' | 'summary';
const SPARKS = [[8, 20, -24, -30], [88, 12, 20, -35], [98, 49, 32, -8], [86, 86, 22, 28], [18, 94, -15, 35], [0, 64, -30, 15], [37, 2, -8, -32], [63, 100, 12, 34]];
function Sparkles({ tier }: { tier: RarityEffect }) {
  if (tier === 'standard' || tier === 'foil') return null;
  return <span className={styles.sparkles} aria-hidden>{SPARKS.map(([x, y, dx, dy], i) => <i key={i} style={{ left: `${x}%`, top: `${y}%`, '--dx': `${dx}px`, '--dy': `${dy}px`, '--delay': `${i * 65}ms` } as CSSProperties} />)}</span>;
}
function RarityArt({ src, name, tier }: { src: string; name: string; tier: RarityEffect }) {
  const surface = useRef<HTMLSpanElement>(null);
  const sheen = useRef<HTMLSpanElement>(null);
  const area = useRef<DOMRect | null>(null);
  const gesture = useRef<{ x: number; y: number; dragged: boolean } | null>(null);
  function reset() {
    if (surface.current) {
      surface.current.style.transition = 'transform 180ms var(--ease-out)';
      surface.current.style.transform = '';
    }
    if (sheen.current) sheen.current.style.opacity = '0';
    area.current = null;
  }
  function track(event: PointerEvent<HTMLSpanElement>) {
    if (gesture.current && Math.hypot(event.clientX - gesture.current.x, event.clientY - gesture.current.y) > 8) gesture.current.dragged = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (event.pointerType !== 'mouse' && !gesture.current) return;
    const bounds = area.current ??= event.currentTarget.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
    const y = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
    event.currentTarget.style.transition = 'none';
    event.currentTarget.style.transform = `perspective(850px) rotateX(${-y * 9}deg) rotateY(${x * 12}deg) translateZ(7px)`;
    if (sheen.current && tier !== 'standard') {
      sheen.current.style.transform = `translate(${x * 28}%, ${y * 20}%) rotate(${x * 12}deg)`;
      sheen.current.style.opacity = tier === 'foil' ? '.35' : '.65';
    }
  }
  return <span ref={surface} className={styles.rarityArt} data-tier={tier}
    onPointerEnter={event => { area.current = event.currentTarget.getBoundingClientRect(); }}
    onPointerMove={track}
    onPointerDown={event => {
      gesture.current = { x: event.clientX, y: event.clientY, dragged: false };
      event.currentTarget.setPointerCapture(event.pointerId);
      track(event);
    }}
    onPointerUp={reset}
    onPointerCancel={() => { gesture.current = null; reset(); }}
    onPointerLeave={reset}
    onClickCapture={event => {
      if (event.detail > 0 && gesture.current?.dragged) { event.preventDefault(); event.stopPropagation(); }
      gesture.current = null;
    }}>

    <span className={styles.cardAura} aria-hidden />
    <img src={src} alt={name} draggable={false} />
    <span className={styles.holoSurface} aria-hidden><span ref={sheen} className={styles.pointerSheen} /></span>
    <Sparkles tier={tier} />
  </span>;
}
export function PackOpeningStage({ opening, preview, imageFor, onClose }: { opening: PackOpening; preview: boolean; imageFor: (fullName: string, image?: string) => string; onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>('sealed');
  const [cut, setCut] = useState(0);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set());
  const cardButton = useRef<HTMLButtonElement>(null);
  const summaryHeading = useRef<HTMLDivElement>(null);
  const dealt = useRef(false);
  const cards = useMemo(() => opening.cards.map(card => {
    const rarity = card.rarity?.trim() || (card.engineFullName ? cardRarity({ fullName: card.engineFullName }) : undefined);
    const pattern = card.pattern ?? (card.engineFullName ? cardPattern({ fullName: card.engineFullName }) : undefined);
    return { ...card, rarity, pattern, tier: rarityEffect(rarity, pattern) };
  }), [opening]);
  useEffect(() => {
    if (phase === 'reveal') cardButton.current?.focus({ preventScroll: true });
    if (phase === 'summary') summaryHeading.current?.focus({ preventScroll: true });
  }, [phase, index]);
  useLayoutEffect(() => {
    if (phase !== 'summary' || !summaryHeading.current || dealt.current) return;
    dealt.current = true;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches) return;
    const host = summaryHeading.current;
    const box = host.getBoundingClientRect();
    const animations = [...host.querySelectorAll<HTMLElement>('[data-reward-card]')].map((element, i) => {
      const rect = element.getBoundingClientRect();
      const focal = element.dataset.rewardCard === 'focal';
      const dx = focal ? 0 : box.left + box.width / 2 - (rect.left + rect.width / 2);
      const dy = focal ? 35 : box.top + Math.min(180, box.height * .35) - (rect.top + rect.height / 2);
      return element.animate([
        { opacity: 0, transform: `translate3d(${dx}px,${dy}px,0) rotate(${focal ? -13 : (i % 2 ? 10 : -10)}deg) scale(.8)` },
        { opacity: 1, transform: getComputedStyle(element).transform },
      ], { duration: focal ? 650 : 520, delay: Math.min(i * 60, 360), easing: 'cubic-bezier(.23,1,.32,1)', fill: 'backwards' });
    });
    const cancel = () => { if (motion.matches) animations.forEach(animation => animation.cancel()); };
    motion.addEventListener('change', cancel);
    return () => { motion.removeEventListener('change', cancel); animations.forEach(animation => animation.cancel()); };
  }, [phase]);
  const card = cards[index];
  const isRevealed = revealed.has(index);
  const tier = isRevealed ? card?.tier ?? 'standard' : 'standard';
  const groups = useMemo(() => {
    const map = new Map<string, { card: typeof cards[number]; copies: number; index: number }>();
    cards.forEach((card, index) => {
      const prior = map.get(card.printingId);
      map.set(card.printingId, { card: prior?.card ?? card, copies: (prior?.copies ?? 0) + 1, index: prior?.index ?? index });
    });
    return [...map.entries()];
  }, [cards]);
  const standout = groups.reduce<typeof groups[number] | undefined>((best, next) => rarityEffectRank[next[1].card.tier] > (best ? rarityEffectRank[best[1].card.tier] : 0) ? next : best, undefined);
  const gallery = standout ? groups.filter(([id]) => id !== standout[0]) : groups;
  useEffect(() => {
    if (phase !== 'cutting') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setPhase('reveal'), reduced ? 0 : 560);
    return () => window.clearTimeout(timer);
  }, [phase]);
  function revealAll() { setRevealed(new Set(cards.map((_, i) => i))); setPhase('summary'); }
  function inspect(at: number) { setIndex(at); setPhase('reveal'); }
  function advance() {
    if (!isRevealed) setRevealed(previous => new Set([...previous, index]));
    else if (index < cards.length - 1) setIndex(index + 1);
    else setPhase('summary');
  }
  function cutTo(value: number) {
    setCut(value);
    if (value >= 98) { setCut(100); setPhase('cutting'); }
  }
  return <DuoDialog title={phase === 'summary' ? '开包结果' : '开包'} onClose={onClose} className={styles.dialog}>
    <div className={styles.meta}><span className={styles.badge}>{preview ? '演示' : '已收入收藏'}</span><span>{preview ? '不扣款 · 不入收藏 · 非商品出率' : `${cards.length} 张卡牌已到账`}</span>{phase !== 'summary' && <button type="button" onClick={revealAll}>{revealed.size === cards.length ? '返回开包结果' : '跳过 · 查看全部'} ↗</button>}{phase === 'summary' && <span className={styles.resultCount}>{cards.length} 张 · {groups.length} 种</span>}</div>
    {(phase === 'sealed' || phase === 'cutting') ? <div className={styles.sealedScene} data-cutting={phase === 'cutting'}>
      <div className={styles.ring} aria-hidden />
      <div className={styles.pack}>
        <div className={styles.packLid} aria-hidden><span>POKÉMON / TRADING CARDS</span></div>
        <div className={styles.packBody} aria-hidden>
          <div className={styles.packEmblem}><span className="duo-ball" /></div>
          <strong>POKÉMON</strong><span className={styles.packEdition}>{cards.length} 张</span>
          <div className={styles.foil} />
        </div>
        <div className={styles.cutTrack}>
          <div className={styles.cutLine} aria-hidden><span style={{ transform: `scaleX(${cut / 100})` }} /></div>
          <input type="range" min={0} max={100} step={1} value={cut} disabled={phase === 'cutting'} onChange={event => cutTo(Number(event.target.value))} aria-label="向右滑动剪刀拆开卡包" aria-valuetext={cut >= 98 ? '包装已剪开' : `已剪开 ${cut}%`} />
        </div>
      </div>
      <div className={styles.cutHint}><span aria-hidden>→</span><button type="button" disabled={phase === 'cutting'} onClick={() => cutTo(100)}>拆开</button></div>
      <div className={styles.flash} aria-hidden />
    </div> : phase === 'reveal' && card ? <div className={styles.revealScene}>
      <div className={styles.revealPosition}><span>{String(index + 1).padStart(2, '0')}</span> / {String(cards.length).padStart(2, '0')}</div>
      <div className={styles.cardStage} data-tier={tier} key={index}>
        <div key={tier} className={styles.halo} aria-hidden />
        {tier !== 'standard' && <div className={styles.revealBurst} aria-hidden><i /><i /></div>}
        <div className={styles.stackBack} aria-hidden />
        <button ref={cardButton} type="button" className={styles.heroCard} data-revealed={isRevealed} onClick={advance} aria-label={!isRevealed ? `揭示第 ${index + 1} 张卡牌` : index < cards.length - 1 ? `${card.name}，查看下一张` : `${card.name}，查看全部结果`}>
          <span className={styles.flip}><img className={styles.backFace} src="/assets/duo-cardback.svg" alt="" draggable={false} aria-hidden /><span className={styles.frontFace} aria-hidden={!isRevealed}><RarityArt src={imageFor(card.engineFullName ?? '', card.image)} name={isRevealed ? card.name : ''} tier={tier} /></span></span>
        </button>
        <div className={styles.caption} aria-live="polite">{isRevealed ? <>{card.rarity && <span className={styles.rarity} data-tier={tier}>{rarityLabel(card.rarity, card.pattern)}</span>}<h2>{card.name}</h2>{!preview && (card.ownedBefore === 0 ? <small className={styles.stampNew}>NEW</small> : <small className={styles.countPlate}>{`收藏 × ${card.count}`}</small>)}</> : null}</div>
      </div>
      <div className={styles.revealActions}><button type="button" className={`a-btn-ghost ${styles.revealNav}`} disabled={index === 0} onClick={() => setIndex(i => Math.max(0, i - 1))} aria-label="上一张卡牌">←</button><button type="button" className={`a-btn ${styles.revealButton}`} onClick={advance}>{!isRevealed ? '翻开卡牌' : index < cards.length - 1 ? '下一张 →' : '查看开包结果 →'}</button><span>{revealed.size} / {cards.length}</span></div>
    </div> : <div ref={summaryHeading} tabIndex={-1} aria-label="开包结果卡牌" className={styles.summary} data-tier={standout?.[1].card.tier ?? 'standard'}>
      <div className={styles.rewardLayout} data-small={!!standout && groups.length <= 5}>
      {standout && <section className={styles.spotlight} data-tier={standout[1].card.tier} aria-label={standout[1].card.name}>
        <button className={styles.spotlightCard} data-reward-card="focal" type="button" aria-label={`放大查看 ${standout[1].card.name}`} onClick={() => inspect(standout[1].index)}><span className={styles.spotlightRays} aria-hidden /><RarityArt src={imageFor(standout[1].card.engineFullName ?? '', standout[1].card.image)} name={standout[1].card.name} tier={standout[1].card.tier} /></button>
        <div className={styles.spotlightInfo}><span className={styles.rarity} data-tier={standout[1].card.tier}>{rarityLabel(standout[1].card.rarity, standout[1].card.pattern)}</span><h3>{standout[1].card.name}</h3><div className={styles.rewardPills}><span>× {standout[1].copies}</span>{!preview && standout[1].card.ownedBefore === 0 && <span>NEW</span>}</div></div>
      </section>}
      {gallery.length > 0 && <div className={styles.results} data-small={gallery.length <= 5}>{gallery.map(([id, group]) => <button type="button" data-reward-card="card" className={styles.resultCard} key={id} data-tier={group.card.tier} aria-label={`放大查看 ${group.card.name}，${rarityLabel(group.card.rarity, group.card.pattern) ?? '稀有度待同步'}，本次 ${group.copies} 张`} onClick={() => inspect(group.index)}><RarityArt src={imageFor(group.card.engineFullName ?? '', group.card.image)} name={group.card.name} tier={group.card.tier} /><span className={styles.copyBadge}>×{group.copies}</span><strong>{group.card.name}</strong><small>{rarityLabel(group.card.rarity, group.card.pattern)}{!preview && group.card.ownedBefore === 0 ? ' · NEW' : ''}</small></button>)}</div>}
      </div>
      <div className={styles.done}><button type="button" className="a-btn" onClick={onClose}>完成</button>{!preview && <Link to="/collection" className="a-btn-ghost" onClick={onClose}>查看收藏 →</Link>}</div>
    </div>}
  </DuoDialog>;
}
