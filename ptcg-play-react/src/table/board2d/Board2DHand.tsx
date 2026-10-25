import { useLayoutEffect, useRef, useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { Card, CardList } from 'ptcg-server';
import { CardFace } from '../../components/cards/CardFace';
import { publicAssetUrl } from '../../utils/publicAssetUrl';
import { cn } from '../../utils/cn';
import { board2dHandDragId } from './board2dDropIds';
import { cardDisplayName } from '../../duo/chineseCatalog';
import { handLayout } from './board2dHandLayout';
import styles from './Board2DHand.module.css';

export type Board2DHandProps = {
  cards: Card[];
  cardList?: CardList | null;
  opponent?: boolean;
  faceDown?: boolean;
  interactive?: boolean;
  playableCardIds?: ReadonlySet<number> | number[];
  selectedHandIndexes?: ReadonlySet<number>;
  selectableHandIndexes?: ReadonlySet<number>;
  scanUrl: (card: Card, list?: CardList | null) => string;
  onCardClick?: (card: Card, index: number) => void;
  onCardSelect?: (card: Card, index: number) => void;
  dense?: boolean;
  handTag?: 'bottom' | 'top';
  inactive?: boolean;
  handIndexes?: number[];
  draggableCardIds?: ReadonlySet<number>;
  highlightMode?: 'opening' | 'selection';
  allowDrop?: boolean;
};

function HandCard({ card, index, src, interactive, available, selected, faceDown, opponent, fanAngle, fanLift, onClick, onSelect, selectionMode }: {
  card: Card; index: number; src: string; interactive: boolean; available: boolean;
  selected: boolean; faceDown: boolean; opponent: boolean; fanAngle: number; fanLift: number; onClick?: () => void; onSelect?: () => void; selectionMode: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: opponent ? `opponent-hand-${index}` : board2dHandDragId(index),
    disabled: !interactive || faceDown,
    data: { type: 'hand', index, card },
  });
  return <div ref={setNodeRef}
    className={cn(styles.cardWrap, !faceDown && !opponent && !available && styles.unavailable, selected && styles.selected, isDragging && styles.dragging)}
    style={{ ['--fan-angle' as string]: `${fanAngle}deg`, ['--fan-lift' as string]: `${fanLift}px` }}
    data-hand-index={index} data-available={available || undefined}
    {...(interactive ? { ...listeners, ...attributes } : {})}
    role={faceDown ? undefined : selectionMode ? 'group' : 'button'} tabIndex={faceDown || selectionMode ? undefined : 0}
    aria-label={faceDown ? '对手手牌' : `查看 ${cardDisplayName(card)}${available ? '' : '，当前不可使用'}`}
    aria-pressed={faceDown || selectionMode ? undefined : selected}
    onKeyDown={event => {
      if (selectionMode || event.target !== event.currentTarget) return;
      if (event.key === 'Enter' && event.shiftKey && onSelect) { event.preventDefault(); onSelect(); }
      else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onClick?.(); }
    }} onClick={selectionMode ? undefined : onClick}>
    {faceDown ? <img className={styles.face} src={publicAssetUrl('assets/duo-cardback.svg')} alt="背面卡牌" draggable={false} />
      : selectionMode ? <>
        <button type="button" className={styles.selectionImage} aria-label={`查看 ${cardDisplayName(card)}`} onClick={onClick}>
          <CardFace className={styles.face} src={src} card={card} name={card.name} draggable={false} />
        </button>
        <button type="button" className={styles.selectCard} aria-label={`${selected ? '取消选择' : '选择'} ${cardDisplayName(card)}`}
          aria-pressed={selected} disabled={!available || !onSelect} onClick={onSelect}>{selected ? '取消选择' : '选择这张'}</button>
      </> : <CardFace className={styles.face} src={src} card={card} name={card.name} draggable={false} />}
  </div>;
}

export function Board2DHand({ cards, cardList, opponent = false, faceDown = false, interactive = false, playableCardIds,
  selectedHandIndexes, selectableHandIndexes, scanUrl, onCardClick, onCardSelect, dense, handTag, inactive = false,
  handIndexes, draggableCardIds, highlightMode, allowDrop = false }: Board2DHandProps) {
  const { setNodeRef, isOver } = useDroppable({ id: opponent ? 'opponent-hand' : 'slot-hand', disabled: opponent || !allowDrop });
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(92);
  const [scroll, setScroll] = useState({ left: 0, max: 0 });
  const playableSet = playableCardIds instanceof Set ? playableCardIds : new Set(playableCardIds ?? []);
  const selecting = highlightMode != null || selectableHandIndexes != null;

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const measure = () => {
      const css = getComputedStyle(scroller);
      const cardWidth = parseFloat(css.getPropertyValue('--hand-card-w'));
      const minStep = parseFloat(css.getPropertyValue('--hand-min-step'));
      const maxStep = parseFloat(css.getPropertyValue('--hand-max-step'));
      const fitted = handLayout(cards.length, scroller.clientWidth - 32, cardWidth, minStep, maxStep).step;
      setStep(onCardSelect ? Math.max(cardWidth + 10, fitted) : fitted);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [cards.length, opponent, dense, !!onCardSelect]);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const update = () => setScroll({ left: scroller.scrollLeft, max: Math.max(0, scroller.scrollWidth - scroller.clientWidth) });
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey && scroller.scrollWidth > scroller.clientWidth + 1 && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        event.preventDefault();
        scroller.scrollLeft += event.deltaY * (event.deltaMode === 1 ? 20 : 1);
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    scroller.addEventListener('scroll', update, { passive: true });
    scroller.addEventListener('wheel', wheel, { passive: false });
    return () => { observer.disconnect(); scroller.removeEventListener('scroll', update); scroller.removeEventListener('wheel', wheel); };
  }, [step, cards.length]);

  const browse = (direction: number) => {
    const scroller = scrollerRef.current;
    scroller?.scrollBy({ left: direction * scroller.clientWidth * .7,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  const overflow = scroll.max > 1;
  return <div ref={setNodeRef} className={cn(styles.hand, opponent && styles.opponent, isOver && styles.returnTarget)}
    style={{ ['--hand-step' as string]: `${step}px` }}
    data-board2d-hand={handTag} data-hand-count={cards.length} data-inactive={inactive || undefined}
    data-selecting={selecting || undefined} data-selection-actions={!!onCardSelect || undefined} data-overflow={overflow || undefined}>
    <div ref={scrollerRef} className={styles.scroller}>
      <div className={styles.track}>
        {cards.map((card, visibleIndex) => {
          const index = handIndexes?.[visibleIndex] ?? visibleIndex;
          const available = !inactive && (selecting ? !!selectableHandIndexes?.has(index) : playableSet.has(card.id));
          return <HandCard key={card.id} card={card} index={index} src={scanUrl(card, cardList)}
            interactive={!onCardSelect && interactive && available && (!draggableCardIds || draggableCardIds.has(card.id))}
            selectionMode={!!onCardSelect}
            fanAngle={onCardSelect || overflow ? 0 : Math.max(-5, Math.min(5, (visibleIndex - (cards.length - 1) / 2) * .9))}
            fanLift={onCardSelect || overflow ? 0 : Math.min(4, Math.abs(visibleIndex - (cards.length - 1) / 2))}
            available={available} selected={!!selectedHandIndexes?.has(index)} faceDown={faceDown} opponent={opponent}
            onClick={() => onCardClick?.(card, index)}
            onSelect={onCardSelect && available ? () => onCardSelect(card, index) : undefined} />;
        })}
      </div>
    </div>
    {overflow ? <>
      <button type="button" className={cn(styles.browse, styles.previous)} disabled={scroll.left <= 1} aria-label="浏览前面的手牌" onClick={() => browse(-1)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>
      </button>
      <button type="button" className={cn(styles.browse, styles.next)} disabled={scroll.left >= scroll.max - 1} aria-label="浏览后面的手牌" onClick={() => browse(1)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg>
      </button>
      <input className={styles.position} type="range" min={0} max={scroll.max} step={1} value={scroll.left}
        aria-label="手牌浏览位置" onChange={event => { if (scrollerRef.current) scrollerRef.current.scrollLeft = Number(event.target.value); }} />
    </> : null}
  </div>;
}
