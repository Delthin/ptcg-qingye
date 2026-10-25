import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import { SuperType, type Card } from 'ptcg-server';
import { cardDisplayName, cardPattern, cardRarity, rarityLabel } from '../duo/chineseCatalog';
import { isBasicEnergy } from './deckRules';
import { cardPrintingKey, energyEditionLabel, isFreeBasicEnergy } from './energyPrintings';
import type { DeckSlot } from './types';
import styles from './DeckBuildPane.module.css';

function SortableDeckRow({ slot, scanUrl, disabled, canAdd, reason, ownedCount, ownershipIssue, onAddCopy, onRemoveCopy, onRemoveSlot, onEditQuantity, onOpenInfo }: {
  slot: DeckSlot; scanUrl: string; disabled: boolean; canAdd: boolean; reason?: string; ownedCount?: number; ownershipIssue?: string;
  onAddCopy: () => void; onRemoveCopy: () => void; onRemoveSlot: () => void; onEditQuantity: () => void; onOpenInfo: () => void;
}) {
  const { t } = useTranslation();
  const name = cardDisplayName(slot.card);
  const ownershipLabel = isFreeBasicEnergy(slot.card) ? '免费默认 · ∞' : ownedCount === undefined ? t('DECK_OWNERSHIP_UNKNOWN', { defaultValue: '持有待核对' }) : ownedCount === 0 ? t('DECK_NOT_OWNED', { defaultValue: '未持有' }) : t('DECK_HELD_COPIES', { value: ownedCount });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cardPrintingKey(slot.card), disabled, data: { source: 'deck', card: slot.card } });
  return <div ref={setNodeRef} className={styles.row} data-ownership-issue={!!ownershipIssue} data-dragging={isDragging} style={{ transform: CSS.Transform.toString(transform), transition }}>
    <button type="button" className={styles.cardInfo} onClick={onOpenInfo} aria-label={t('DECK_SHOW_CARD', { name })}><img src={scanUrl} alt="" loading="lazy" /><span><strong>{name}</strong><small>{rarityLabel(cardRarity(slot.card), cardPattern(slot.card)) ? rarityLabel(cardRarity(slot.card), cardPattern(slot.card)) + ' · ' : ''}{!isFreeBasicEnergy(slot.card) && energyEditionLabel(slot.card)} {ownershipLabel}／本卡组 {slot.count}</small>{ownershipIssue && <small className={styles.ownershipIssue}>{ownershipIssue}</small>}</span></button>
    <div className={styles.stepper}><button type="button" disabled={disabled} onClick={onRemoveCopy} aria-label={name + ' · ' + t('DECK_EDIT_REMOVE_ONE')}>−</button><button type="button" className={styles.quantity} disabled={disabled} onClick={onEditQuantity} aria-label={name + ' · ' + t('DECK_EDIT_QUANTITY_ARIA', { count: slot.count })}>{slot.count}</button><button type="button" disabled={disabled || !canAdd} title={reason} onClick={onAddCopy} aria-label={name + ' · ' + t('DECK_EDIT_ADD_ONE')}>＋</button></div>
    {ownershipIssue && <button type="button" className={styles.removeSlot} disabled={disabled} onClick={onRemoveSlot} aria-label={t('DECK_REMOVE_SLOT', { name, defaultValue: '{{name}} · 移除此卡槽' })}>{t('BUTTON_REMOVE', { defaultValue: '移除' })}</button>}
    <button type="button" className={styles.grip} disabled={disabled} {...attributes} {...listeners} aria-label={t('DECK_REORDER', { name })}>⠿</button>
  </div>;
}
export type DeckBuildPaneProps = {
  slots: DeckSlot[]; getScanUrl: (card: Card) => string; disabled: boolean; deckCount: number; ruleMessage: string | null;
  showLibraryToggle: boolean; libraryHidden: boolean; onToggleLibrary: () => void;
  onAddCopy: (fullName: string) => void; onRemoveCopy: (fullName: string) => void; onEditQuantity: (card: Card) => void; onOpenCardInfo: (card: Card) => void;
  ownedCounts?: ReadonlyMap<string, number>; canAddCard?: (card: Card) => boolean; addReason?: (card: Card) => string | undefined;
  ownershipReason: (card: Card) => string | undefined; onRemoveSlot: (fullName: string) => void;
};
export function DeckBuildPane({ slots, getScanUrl, disabled, ruleMessage, showLibraryToggle, libraryHidden, onToggleLibrary, onAddCopy, onRemoveCopy, onEditQuantity, onOpenCardInfo, ownedCounts, canAddCard, addReason, ownershipReason, onRemoveSlot }: DeckBuildPaneProps) {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id: 'deck-drop' });
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const groups = [{ type: SuperType.POKEMON, key: 'LABEL_POKEMON' }, { type: SuperType.TRAINER, key: 'LABEL_TRAINER' }, { type: SuperType.ENERGY, key: 'LABEL_ENERGY' }];
  return <section className={styles.wrap} aria-label={t('DECK_EDIT_TAB_DECK')}>
    <header className={styles.header}><strong>卡组内容</strong><div className={styles.viewSwitch} role="group" aria-label="卡组显示方式"><button aria-label="卡图视图" aria-pressed={view === 'grid'} onClick={() => setView('grid')}>▦</button><button aria-label="列表视图" aria-pressed={view === 'list'} onClick={() => setView('list')}>☰</button></div>{showLibraryToggle && <button type="button" onClick={onToggleLibrary}>{libraryHidden ? t('DECK_EDIT_SHOW_LIBRARY') : t('DECK_EDIT_HIDE_LIBRARY')}</button>}</header>
    {ruleMessage && <p className={styles.ruleMessage} role="alert">{ruleMessage}</p>}
    <div ref={setNodeRef} className={styles.list} data-over={isOver} data-view={view}>
      {!slots.length ? <div className={styles.empty}>{t('DECK_BUILD_DROP_HINT')}</div> : groups.map(group => {
        const rows = slots.filter(slot => slot.card.superType === group.type);
        return rows.length ? <section key={group.type} className={styles.group}><h2>{t(group.key)}<span>{rows.reduce((sum, slot) => sum + slot.count, 0)}</span></h2><SortableContext items={rows.map(slot => cardPrintingKey(slot.card))} strategy={view === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}><div className={styles.groupCards}>{rows.map(slot => <SortableDeckRow key={cardPrintingKey(slot.card)} slot={slot} scanUrl={getScanUrl(slot.card)} disabled={disabled} canAdd={canAddCard?.(slot.card) ?? true} reason={addReason?.(slot.card)} ownedCount={ownedCounts ? (ownedCounts.get(isBasicEnergy(slot.card) ? slot.card.printingId || slot.card.fullName : slot.card.fullName) ?? 0) : undefined} ownershipIssue={ownershipReason(slot.card)} onRemoveSlot={() => onRemoveSlot(cardPrintingKey(slot.card))} onAddCopy={() => onAddCopy(cardPrintingKey(slot.card))} onRemoveCopy={() => onRemoveCopy(cardPrintingKey(slot.card))} onEditQuantity={() => onEditQuantity(slot.card)} onOpenInfo={() => onOpenCardInfo(slot.card)} />)}</div></SortableContext></section> : null;
      })}
    </div>
  </section>;
}
