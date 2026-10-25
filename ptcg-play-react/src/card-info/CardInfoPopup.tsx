import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { Card, CardList, Player } from 'ptcg-server';
import type { CardInfoPaneOptions, CardInfoTableAction } from './CardInfoPane';
import { CardInfoPane } from './CardInfoPane';
import { CheckboxField } from '../components/ui/CheckboxField';
import { CardInfoImageColumn } from './CardInfoImageColumn';
import paneStyles from './CardInfoPane.module.css';
import styles from './CardInfoPopup.module.css';
import { cardDisplayName } from '../duo/chineseCatalog';
import { useViewportBounds } from '../hooks/useViewportBounds';

export type CardInfoPopupProps = {
  card: Card;
  /** When set (in-game Pokémon), HP reflects list damage and HP modifiers. */
  cardList?: CardList;
  players?: Player[];
  facedown?: boolean;
  catalog: Card[];
  getScanUrl: (card: Card) => string;
  onClose: () => void;
  onCardSwap?: (event: { originalCard: Card; replacementCard: Card }) => void;
  /** Deck builder: not in game — swap + favorites match Angular out-of-table behavior. */
  isInGame?: boolean;
  options?: CardInfoPaneOptions;
  showTags?: boolean;
  cardTextKerning?: number;
  /** When set (in-game), ability/attack/trainer clicks invoke this then typically close. Return false to keep open. */
  onTableAction?: (action: CardInfoTableAction) => void | boolean;
  /** Browse previous card in the parent list (←). */
  onNavigatePrev?: () => void;
  /** Browse next card in the parent list (→). */
  onNavigateNext?: () => void;
  /** Optional “tested” checkbox in the footer (next to browse hint). */
  tested?: boolean;
  onToggleTested?: () => void;
  testedLabel?: string;
  /** Optional “flag” checkbox in the footer. */
  flagged?: boolean;
  onToggleFlagged?: () => void;
  flaggedLabel?: string;
  /** Hide the alternative-printing swap control on the card image. */
  hideSwapButton?: boolean;
  onPlayFromHand?: () => void;
  handPlayDisabled?: boolean;
  /** Select within a prompt, without submitting the game action. */
  selectionAction?: { label: string; disabled?: boolean; onClick: () => void };
  closeLabel?: string;
};

function isEditableKeyTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

export function CardInfoPopup({
  card,
  cardList,
  players,
  facedown = false,
  catalog,
  getScanUrl,
  onClose,
  onCardSwap,
  isInGame = false,
  options,
  showTags,
  cardTextKerning,
  onTableAction,
  onNavigatePrev,
  onNavigateNext,
  tested,
  onToggleTested,
  testedLabel = 'Mark as tested & working',
  flagged,
  onToggleFlagged,
  flaggedLabel = 'Flag this card',
  hideSwapButton = false,
  onPlayFromHand,
  handPlayDisabled = false,
  selectionAction,
  closeLabel,
}: CardInfoPopupProps) {
  const { t } = useTranslation();
  const viewport = useViewportBounds();
  const [swapOpen, setSwapOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusable = () => [...(panel?.querySelectorAll<HTMLElement>('button:not(:disabled), input, select, [tabindex="0"]') ?? [])].filter(el => el.getClientRects().length > 0);
    focusable()[0]?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const elements = focusable();
      const first = elements[0];
      const last = elements.at(-1);
      if (!first) { event.preventDefault(); panel?.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || !panel?.contains(document.activeElement))) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !panel?.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', trap);
    return () => { document.removeEventListener('keydown', trap); if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, []);
  useEffect(() => {
    setSwapOpen(false);
  }, [card.fullName]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (swapOpen || isEditableKeyTarget(e.target)) {
        return;
      }
      if (e.key === 'ArrowLeft' && onNavigatePrev) {
        e.preventDefault();
        onNavigatePrev();
        return;
      }
      if (e.key === 'ArrowRight' && onNavigateNext) {
        e.preventDefault();
        onNavigateNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onNavigatePrev, onNavigateNext, swapOpen]);

  const canNavigate = Boolean(onNavigatePrev || onNavigateNext);

  return createPortal(
    <div
      className={styles.backdrop}
      style={{ top: viewport.top, left: viewport.left, width: viewport.width, height: viewport.height,
        right: 'auto', bottom: 'auto', '--card-info-viewport-height': `${viewport.height}px` } as CSSProperties}
      data-in-game={isInGame || undefined}
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={facedown ? '背面卡牌' : cardDisplayName(card)}
        aria-labelledby={facedown ? 'card-info-dialog-title' : undefined}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="card-info-dialog-title" className={styles.title}>
          {facedown ? t('CARDS_UNKNOWN') : ''}
        </h2>
        <div className={styles.content}>
          <div className={`${paneStyles.pane} ${styles.detailPane}`}>
            <CardInfoImageColumn
              key={`img-${card.fullName}`}
              card={card}
              catalog={catalog}
              facedown={facedown}
              getScanUrl={getScanUrl}
              isInGame={isInGame}
              onSwapClick={() => setSwapOpen(true)}
              hideSwapButton={hideSwapButton}
              className={selectionAction ? styles.selectionImage : undefined}
            />
            <CardInfoPane
              key={card.fullName}
              card={card}
              cardList={cardList}
              players={players}
              facedown={facedown}
              catalog={catalog}
              getScanUrl={getScanUrl}
              isInGame={isInGame}
              options={options}
              showTags={showTags}
              cardTextKerning={cardTextKerning}
              onCardSwap={onCardSwap}
              onTableAction={
                onTableAction
                  ? (action) => {
                      const shouldClose = onTableAction(action);
                      if (shouldClose !== false) {
                        onClose();
                      }
                    }
                  : undefined
              }
              omitScanColumn
              swapOpen={swapOpen}
              onSwapOpenChange={setSwapOpen}
            />
          </div>
        </div>
        <div className={styles.footer}>
          {(canNavigate || onToggleTested || onToggleFlagged) && (
            <div className={styles.footerLeft}>
              {canNavigate && (
                <span className={styles.navHint}>← → browse</span>
              )}
              {onToggleTested && (
                <CheckboxField
                  plain
                  className={styles.footerCheck}
                  checked={Boolean(tested)}
                  onChange={() => onToggleTested()}
                >
                  <span>Tested</span>
                </CheckboxField>
              )}
              {onToggleFlagged && (
                <CheckboxField
                  plain
                  className={`${styles.footerCheck} ${styles.flagCheck}`}
                  checked={Boolean(flagged)}
                  onChange={() => onToggleFlagged()}
                >
                  <span>Flag</span>
                </CheckboxField>
              )}
            </div>
          )}
          <span className={styles.spacer} />
          {onPlayFromHand ? (
            <button type="button" className={isInGame ? styles.playBtn : styles.closeBtn} disabled={handPlayDisabled} onClick={onPlayFromHand}>
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="10" height="16" rx="2" /><path d="M9 12h12m-4-4 4 4-4 4" /></svg>
              打出这张牌
            </button>
          ) : null}
          <button type="button" className={closeLabel ? styles.returnBtn : isInGame ? styles.iconClose : styles.closeBtn} aria-label={closeLabel ?? '关闭卡牌详情'} onClick={() => onClose()}>
            {closeLabel ?? (isInGame ? <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 6 12 12M18 6 6 18" /></svg> : t('BUTTON_CLOSE'))}
          </button>
          {selectionAction ? <button type="button" className={`${styles.playBtn} ${styles.promptAction}`}
            disabled={selectionAction.disabled} onClick={selectionAction.onClick}>{selectionAction.label}</button> : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
