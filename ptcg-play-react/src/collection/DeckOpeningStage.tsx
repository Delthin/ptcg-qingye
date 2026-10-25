import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { DuoDialog } from '../duo/DuoDialog';
import { cardPattern, cardRarity, rarityLabel } from '../duo/chineseCatalog';
import { rarityEffect } from './rarityEffects';
import type { DeckOpening } from './economyTypes';
import styles from './DeckOpeningStage.module.css';

type Phase = 'sealed' | 'reveal';

/**
 * 拆开一套未拆封预组：先是一盒贴着封条的卡组，撕开封条才知道抽到的是哪一套。
 * 卡组本体与 60 张卡在服务器上已经入账，这里只负责揭晓，并把人带向「卡组管理」。
 */
export function DeckOpeningStage({ opening, boxArt, imageFor, onClose }: {
  opening: DeckOpening;
  /** 商品封面（包盒上的那张图）；未开封时只能看到它，不能提前看到卡组封面。 */
  boxArt?: string;
  imageFor: (fullName: string, image?: string) => string;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('sealed');
  const reveal = useRef<HTMLDivElement>(null);
  const cards = opening.cards.map(card => {
    const rarity = card.rarity?.trim() || (card.engineFullName ? cardRarity({ fullName: card.engineFullName }) : undefined);
    const pattern = card.pattern ?? (card.engineFullName ? cardPattern({ fullName: card.engineFullName }) : undefined);
    return { ...card, rarity, pattern, tier: rarityEffect(rarity, pattern) };
  });
  const cover = cards.find(card => !!card.engineFullName && card.engineFullName === opening.cover) ?? cards[0];
  const total = cards.reduce((sum, card) => sum + card.count, 0);
  const coverLabel = cover ? rarityLabel(cover.rarity, cover.pattern) : null;
  useEffect(() => {
    if (phase === 'reveal') reveal.current?.focus({ preventScroll: true });
  }, [phase]);
  return <DuoDialog title={phase === 'reveal' ? '拆封结果' : '拆开封套'} onClose={onClose} className={styles.dialog}>
    <div className={styles.meta}>
      <span className={styles.badge} data-open={phase === 'reveal' || undefined}>{phase === 'reveal' ? '已收入收藏' : '未拆封'}</span>
      <span>{phase === 'reveal' ? `${total} 张卡牌已到账 · 卡组已建好` : '拆开才知道是哪一套'}</span>
    </div>
    {phase === 'sealed' ? <div className={styles.boxScene}>
      <div className={styles.aura} aria-hidden="true" />
      <div className={styles.box}>
        <img className={styles.boxFace} src={boxArt || '/assets/duo-cardback.svg'} alt="" />
        <span className={styles.boxSeal} aria-hidden="true">SEALED&nbsp;DECK</span>
        <span className={styles.boxGloss} aria-hidden="true" />
      </div>
      <p className={styles.hint}>{opening.productName}</p>
      <button type="button" className={`a-btn ${styles.tear}`} onClick={() => setPhase('reveal')}>撕开封条</button>
      <p className={styles.hintFine}>拆开后立即入账</p>
    </div> : <div ref={reveal} tabIndex={-1} className={styles.revealScene} aria-label={`拆封结果：${opening.deckName}`}>
      <div className={styles.spotlight}>
        <div className={styles.spotlightCard} data-tier={cover?.tier ?? 'standard'}>
          <img src={imageFor(cover?.engineFullName ?? '', cover?.image)} alt={cover?.name ?? opening.deckName} />
          <span className={styles.spotlightSheen} aria-hidden="true" />
        </div>
      </div>
      <div className={styles.verdict}>
        <span className={styles.eyebrow}>{opening.productName}</span>
        <h2 className={styles.deckName}>{opening.deckName}</h2>
        <p className={styles.deckFacts}>{total} 张已入收藏{coverLabel ? ` · 封面卡 ${coverLabel}` : ''}</p>
      </div>
      <ul className={styles.cardList}>
        {cards.map(card => <li key={card.printingId} className={styles.cardRow}>
          <img className={styles.cardThumb} src={imageFor(card.engineFullName ?? '', card.image)} alt="" loading="lazy" />
          <span className={styles.cardName}>{card.name}</span>
          <span className={styles.cardRarity}>{rarityLabel(card.rarity, card.pattern)}</span>
          <span className={styles.cardCount}>× {card.count}</span>
        </li>)}
      </ul>
      <div className={styles.done}>
        <Link to="/deck" className="a-btn" onClick={onClose}>查看这套卡组 →</Link>
        <button type="button" className="a-btn-ghost" onClick={onClose}>完成</button>
      </div>
    </div>}
  </DuoDialog>;
}
