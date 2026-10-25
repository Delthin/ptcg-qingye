import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CSSProperties } from 'react';
import type { Card, PokemonCard } from 'ptcg-server';
import { CardType, getPrimaryCardType, SuperType } from 'ptcg-server';
import { CardFace } from '../components/cards';
import { DECK_CARD_AR, DECK_CARD_GAP_PX, DECK_MAX_SLOT_W } from './deckCardLayout';
import headerStyles from './DeckPaneHeader.module.css';
import { cardDisplayName, cardPattern, cardRarity, rarityLabel } from '../duo/chineseCatalog';
import { cardPrintingKey, energyEditionLabel, isFreeBasicEnergy } from './energyPrintings';
import { isBasicEnergy } from './deckRules';
import styles from './DeckLibraryPane.module.css';

const NEAR_END_PX = 400;
const SCROLL_PAD_X = 12;
const GAP = DECK_CARD_GAP_PX;

function typeBadgeColor(card: Card): string | null {
  if (card.superType !== SuperType.POKEMON) {
    return null;
  }
  const t = getPrimaryCardType(card as PokemonCard);
  const map: Partial<Record<CardType, string>> = {
    [CardType.GRASS]: '#4caf50',
    [CardType.FIRE]: '#ff7043',
    [CardType.WATER]: '#42a5f5',
    [CardType.LIGHTNING]: '#ffee58',
    [CardType.PSYCHIC]: '#ab47bc',
    [CardType.FIGHTING]: '#8d6e63',
    [CardType.DARK]: '#5c6bc0',
    [CardType.METAL]: '#90a4ae',
    [CardType.COLORLESS]: '#e0e0e0',
    [CardType.DRAGON]: '#9575cd',
    [CardType.FAIRY]: '#f48fb1',
  };
  return map[t] ?? '#78909c';
}

/** Visual rarity tier for the card-slot glow (decorative only).
 * Catalog rarities: C/●/无标记 → common, U → uncommon, R/RR/★ → rare,
 * S, HR, UR, AR, PR 系列 → ultra, ACE → secret, named promos → holo. */
function rarityTier(card: Card): string {
  const rarity = (cardRarity(card) ?? '').trim();
  if (!rarity || rarity === '无标记' || rarity === 'C' || rarity === '●') return 'common';
  if (rarity === 'U' || rarity === '◆') return 'uncommon';
  if (rarity === 'ACE') return 'secret';
  if (/^(S|HR|UR|AR|PR)/.test(rarity) || rarity.includes('★★★')) return 'ultra';
  if (rarity === 'RR' || rarity === 'R' || rarity.includes('★')) return 'rare';
  return 'holo';
}

function LibraryCardThumb({ card, slotW, scanUrl, showTypeBadge, disabled, inDeckCount, canAddMore, ownedCount, reason, onAdd, onRemoveOne, onEditQuantity, onOpenInfo }: {
  card: Card; slotW: number; scanUrl: string; showTypeBadge: boolean; disabled: boolean; inDeckCount: number;
  canAddMore: boolean; ownedCount?: number; reason?: string; onAdd: () => void; onRemoveOne: () => void; onEditQuantity: () => void; onOpenInfo: () => void;
}) {
  const { t } = useTranslation();
  const name = cardDisplayName(card);
  const badge = showTypeBadge ? typeBadgeColor(card) : null;
  const inDeck = inDeckCount > 0;
  const freeEnergy = isFreeBasicEnergy(card);
  const unavailable = !freeEnergy && (ownedCount === undefined || ownedCount === 0);
  const ownershipLabel = freeEnergy ? t('DECK_FREE_ENERGY') : ownedCount === undefined ? t('DECK_OWNERSHIP_UNKNOWN', { defaultValue: '持有待核对' }) : ownedCount === 0 ? t('DECK_NOT_OWNED', { defaultValue: '未持有' }) : t('DECK_HELD_COPIES', { value: ownedCount });
  return <div className={styles.thumb} data-unavailable={unavailable} data-r={rarityTier(card)} style={{ width: slotW, ['--deck-slot-w' as string]: slotW + 'px' } as CSSProperties}>
    <div className={styles.cardFace}>
      <button type="button" className={styles.infoButton} onClick={onOpenInfo} aria-label={t('DECK_SHOW_CARD', { name })}><CardFace card={card} src={scanUrl} name={name} loading="lazy" draggable={false} shadow={inDeck ? 'deckInDeck' : 'none'} style={{ width: '100%' }} /></button>
      {inDeck && <button type="button" className={styles.countCircle} disabled={disabled} onClick={onEditQuantity} aria-label={name + ' · ' + t('LIBRARY_IN_DECK_ARIA', { count: inDeckCount })}>{inDeckCount}</button>}
      {inDeck && <button type="button" className={styles.circleBtn + ' ' + styles.circleBtnRemove} disabled={disabled} onClick={onRemoveOne} aria-label={name + ' · ' + t('LIBRARY_REMOVE_ONE_DECK')}>−</button>}
      <button type="button" className={styles.circleBtn + ' ' + styles.circleBtnAdd} disabled={disabled || !canAddMore} title={reason} onClick={onAdd} aria-label={name + ' · ' + t('LIBRARY_ADD_ONE_DECK')}>＋</button>
      {badge && <span className={styles.typeBadge} style={{ background: badge }} title={t('LIBRARY_TYPE_TITLE')} />}
    </div>
    <span className={styles.metadata} title={reason} data-limited={!canAddMore}>{energyEditionLabel(card)}{!freeEnergy && <> · {ownershipLabel}／本卡组 {inDeckCount}</>}{rarityLabel(cardRarity(card), cardPattern(card)) && <i>{rarityLabel(cardRarity(card), cardPattern(card))}</i>}</span>
  </div>;
}

export type DeckLibraryPaneProps = {
  /** Minimum card width used to calculate responsive columns (px). */
  cardSlotW: number;
  cards: Card[];
  scanComplete: boolean;
  onNearCatalogEnd?: () => void;
  getScanUrl: (card: Card) => string;
  showTypeBadge: boolean;
  disabled: boolean;
  onAddCard: (card: Card) => void;
  onRemoveOneFromDeck: (fullName: string) => void;
  onEditQuantity: (card: Card) => void;
  /** Copies in deck for this printing (`fullName` → count). */
  inDeckCounts: ReadonlyMap<string, number>;
  canAddCard: (card: Card) => boolean;
  ownedCounts?: ReadonlyMap<string, number>;
  addReason?: (card: Card) => string | undefined;
  onOpenCardInfo: (card: Card) => void;
};

export function DeckLibraryPane({
  cardSlotW,
  cards,
  scanComplete,
  onNearCatalogEnd,
  getScanUrl,
  showTypeBadge,
  disabled,
  onAddCard,
  onRemoveOneFromDeck,
  onEditQuantity,
  inDeckCounts,
  canAddCard,
  ownedCounts,
  addReason,
  onOpenCardInfo,
}: DeckLibraryPaneProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const nearEndRef = useRef(onNearCatalogEnd);
  nearEndRef.current = onNearCatalogEnd;
  const [gridMetrics, setGridMetrics] = useState({ cols: 2, rowPad: 0, slotW: cardSlotW });

  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    const innerW = Math.max(0, el.clientWidth - SCROLL_PAD_X * 2);
    if (innerW < 80) return;
    const cols = Math.max(1, Math.floor((innerW + GAP) / (cardSlotW + GAP)));
    const slotW = Math.min(DECK_MAX_SLOT_W, Math.floor((innerW - (cols - 1) * GAP) / cols));
    const rowPad = Math.max(0, (innerW - (cols * slotW + (cols - 1) * GAP)) / 2);
    setGridMetrics({ cols, rowPad, slotW });
  }, [cardSlotW]);

  useEffect(() => {
    measure();
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    const fn = nearEndRef.current;
    if (!el || !fn || scanComplete) {
      return;
    }
    if (el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_END_PX) {
      fn();
    }
  }, [scanComplete]);

  const { cols, rowPad, slotW } = gridMetrics;
  const rowHeight = slotW * DECK_CARD_AR + GAP + 26;
  const rows = useMemo(() => Math.ceil(cards.length / cols) || 1, [cards.length, cols]);

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual
  const rowVirtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 4,
  });

  /* Clear cached row heights when layout changes. Do not encode slotW in getItemKey — that remounts every row on each resize tick and reloads images (flash of CardFace background). */
  useLayoutEffect(() => {
    rowVirtualizer.measure();
  }, [rowVirtualizer, rowHeight, cols, rows]);

  return (
    <div className={styles.wrap}>
      <div className={headerStyles.header}>
        <span className={headerStyles.title}>{t('LIBRARY_TITLE_WITH_COUNT', { count: cards.length })}</span>
        <div className={headerStyles.aside}>
          {!scanComplete ? <span className={headerStyles.status}>{t('PROTECTED_LOADING')}</span> : null}
        </div>
      </div>
      <div ref={scrollRef} className={styles.scroll} onScroll={onScroll}>
        {cards.length === 0 ? (
          <div className={styles.empty}>{t('LIBRARY_NO_MATCH_FILTERS')}</div>
        ) : (
          <div
            className={styles.gridInner}
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((vRow) => {
              const rowIndex = vRow.index;
              const startIdx = rowIndex * cols;
              const rowCards = cards.slice(startIdx, startIdx + cols);
              return (
                <div
                  key={vRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${vRow.size}px`,
                    transform: `translateY(${vRow.start}px)`,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    gap: GAP,
                    paddingLeft: rowPad,
                    paddingRight: rowPad,
                    boxSizing: 'border-box',
                  }}
                >
                  {rowCards.map((card) => (
                    <LibraryCardThumb
                      key={cardPrintingKey(card)}
                      card={card}
                      slotW={slotW}
                      scanUrl={getScanUrl(card)}
                      showTypeBadge={showTypeBadge}
                      disabled={disabled}
                      inDeckCount={inDeckCounts.get(cardPrintingKey(card)) ?? 0}
                      canAddMore={canAddCard(card)}
                      ownedCount={ownedCounts ? (ownedCounts.get(isBasicEnergy(card) ? card.printingId || card.fullName : card.fullName) ?? 0) : undefined}
                      reason={addReason?.(card)}
                      onAdd={() => onAddCard(card)}
                      onRemoveOne={() => onRemoveOneFromDeck(cardPrintingKey(card))}
                      onEditQuantity={() => onEditQuantity(card)}
                      onOpenInfo={() => onOpenCardInfo(card)}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
