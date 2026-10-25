import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './DeckEditView.module.css';

const DEFAULT_LIBRARY_SHARE = 35;
const MIN_LIBRARY_SHARE = 25;
const MAX_LIBRARY_SHARE = 65;
const clampShare = (share: number) => Math.min(MAX_LIBRARY_SHARE, Math.max(MIN_LIBRARY_SHARE, share));

type DeckWorkbenchPanesProps = {
  isNarrow: boolean;
  libraryHidden: boolean;
  mobileTab: 'library' | 'deck';
  onMobileTabChange: (tab: 'library' | 'deck') => void;
  deckCount: number;
  library: ReactNode;
  deck: ReactNode;
};

export function DeckWorkbenchPanes({ isNarrow, libraryHidden, mobileTab, onMobileTabChange, deckCount, library, deck }: DeckWorkbenchPanesProps) {
  const { t } = useTranslation();
  const [libraryShare, setLibraryShare] = useState(DEFAULT_LIBRARY_SHARE);
  const drag = useRef<{ pointerId: number; startX: number; share: number; width: number } | null>(null);
  const libraryRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);

  function startResize(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    const width = (libraryRef.current?.getBoundingClientRect().width ?? 0) + (deckRef.current?.getBoundingClientRect().width ?? 0);
    if (!width) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, startX: event.clientX, share: libraryShare, width };
  }

  function resize(event: PointerEvent<HTMLDivElement>) {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    setLibraryShare(clampShare(active.share + (event.clientX - active.startX) / active.width * 100));
  }

  function stopResize(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function resizeWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case 'ArrowLeft':
        setLibraryShare(share => clampShare(share - 2));
        break;
      case 'ArrowRight':
        setLibraryShare(share => clampShare(share + 2));
        break;
      case 'Home':
        setLibraryShare(MIN_LIBRARY_SHARE);
        break;
      case 'End':
        setLibraryShare(MAX_LIBRARY_SHARE);
        break;
      case 'Enter':
        setLibraryShare(DEFAULT_LIBRARY_SHARE);
        break;
      default:
        return;
    }
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <div className={`${styles.panes} ${libraryHidden && !isNarrow ? styles.panesLibraryHidden : ''}`}
      style={{ '--deck-library-share': libraryShare } as CSSProperties}>
      {isNarrow && (
        <div className={styles.mobileTabs} role="tablist" aria-label={t('DECK_WORKBENCH_PANELS', { defaultValue: '组卡区域' })}>
          <button type="button" className={`${styles.tab} ${mobileTab === 'library' ? styles.tabActive : ''}`}
            role="tab" aria-selected={mobileTab === 'library'} aria-controls="deck-library-panel"
            onClick={() => onMobileTabChange('library')}>{t('LIBRARY_TITLE')}</button>
          <button type="button" className={`${styles.tab} ${mobileTab === 'deck' ? styles.tabActive : ''}`}
            role="tab" aria-selected={mobileTab === 'deck'} aria-controls="deck-build-panel"
            onClick={() => onMobileTabChange('deck')}>{t('DECK_EDIT_TAB_DECK')} · {deckCount}</button>
        </div>
      )}
      <div ref={libraryRef} id="deck-library-panel" role={isNarrow ? 'tabpanel' : undefined}
        className={`${styles.libraryCol} ${libraryHidden && !isNarrow ? styles.libraryColHidden : ''} ${isNarrow && mobileTab !== 'library' ? styles.paneMobileInactive : ''}`}>
        {library}
      </div>
      {!isNarrow && !libraryHidden && (
        <div className={styles.splitter} role="separator" tabIndex={0} aria-orientation="vertical"
          aria-label={t('DECK_RESIZE_PANELS', { defaultValue: '调整卡牌库与卡组宽度' })}
          aria-controls="deck-library-panel deck-build-panel" aria-valuemin={MIN_LIBRARY_SHARE} aria-valuemax={MAX_LIBRARY_SHARE}
          aria-valuenow={Math.round(libraryShare)}
          title={t('DECK_RESIZE_PANELS_HINT', { defaultValue: '左右拖动调整宽度；双击或按 Enter 恢复默认' })}
          onPointerDown={startResize} onPointerMove={resize} onPointerUp={stopResize} onPointerCancel={stopResize}
          onLostPointerCapture={() => { drag.current = null; }} onKeyDown={resizeWithKeyboard}
          onDoubleClick={() => setLibraryShare(DEFAULT_LIBRARY_SHARE)} />
      )}
      <div ref={deckRef} id="deck-build-panel" role={isNarrow ? 'tabpanel' : undefined}
        className={`${styles.deckCol} ${isNarrow && mobileTab !== 'deck' ? styles.paneMobileInactive : ''}`}>
        {deck}
      </div>
    </div>
  );
}
