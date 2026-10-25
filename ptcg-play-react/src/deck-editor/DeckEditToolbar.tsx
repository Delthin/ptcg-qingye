import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { Card } from 'ptcg-server';
import { SuperType } from 'ptcg-server';
import { useSettings } from '../context/SettingsContext';
import { cardPattern, cardRarity, rarityLabel } from '../duo/chineseCatalog';
import { DuoDialog } from '../duo/DuoDialog';
import { DuoSwitch } from '../duo/DuoSwitch';
import { DeckComposition, type DeckCounts } from './DeckComposition';
import { getDeckFilterTagOptions } from './cardTagI18n';
import { DECK_FORMAT_OPTIONS } from './deckFormatOptions';
import { defaultToolbarFilter, type DeckEditToolbarFilter } from './types';
import styles from './DeckEditToolbar.module.css';

const SUPER_TYPE_KEYS = [{ value: SuperType.POKEMON, key: 'LABEL_POKEMON' }, { value: SuperType.TRAINER, key: 'LABEL_TRAINER' }, { value: SuperType.ENERGY, key: 'LABEL_ENERGY' }];
export type DeckEditToolbarProps = {
  deckName: string; filter: DeckEditToolbarFilter; onFilterChange: (filter: DeckEditToolbarFilter) => void; allCards: Card[];
  disabled: boolean; isAdmin: boolean; saving: boolean; onSave: () => void; onExport: () => void; onImport: () => void;
  onDelete?: () => void; deleting?: boolean; deckCount?: number; saveState?: 'saved' | 'dirty' | 'saving' | 'error'; inventoryReady?: boolean; libraryFiltersVisible?: boolean;
  inventoryMessage?: string; inventoryRefreshing?: boolean; onRefreshInventory?: () => void; saveBlocked?: boolean;
  deckCounts?: DeckCounts;
  energyRange: 'all' | 'free' | 'collectible';
  onEnergyRangeChange: (range: 'all' | 'free' | 'collectible') => void;
};
export function DeckEditToolbar({ deckName, filter, onFilterChange, allCards, disabled, isAdmin, saving, onSave, onExport, onImport, onDelete, deleting = false, saveState = 'saved', inventoryReady = false, libraryFiltersVisible = true, inventoryMessage, inventoryRefreshing = false, onRefreshInventory, saveBlocked = false, deckCount, deckCounts, energyRange, onEnergyRangeChange }: DeckEditToolbarProps) {
  const { t } = useTranslation();
  const { hiddenFormats } = useSettings();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const moreRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && moreRef.current && !moreRef.current.contains(event.target)) moreRef.current.open = false;
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);
  const sets = useMemo(() => [...new Set(allCards.map(card => card.printingSet || card.set).filter(Boolean))].sort(), [allCards]);
  const rarities = useMemo(() => [...new Set(allCards.flatMap(card => {
    const label = rarityLabel(cardRarity(card), cardPattern(card));
    return label ? [label] : [];
  }))].sort(), [allCards]);
  const formats = DECK_FORMAT_OPTIONS.filter(row => !hiddenFormats.includes(row.value));
  const tags = getDeckFilterTagOptions(t);
  const extraCount = (filter.selectedSet ? 1 : 0) + filter.formats.length + filter.tags.length + (filter.rarities?.length ?? 0);
  const filtered = !!(extraCount || filter.superTypes.length || filter.searchValue);
  function patch(value: Partial<DeckEditToolbarFilter>) { onFilterChange({ ...filter, ...value }); }
  function clearFilters() { onFilterChange({ ...defaultToolbarFilter(), ownedOnly: filter.ownedOnly }); }
  function action(callback: () => void) {
    if (moreRef.current) {
      moreRef.current.open = false;
      moreRef.current.querySelector('summary')?.focus({ preventScroll: true });
    }
    callback();
  }
  return <header className={styles.toolbar}>
    <div className={styles.topRow}>
      <Link to="/deck" className={styles.back} aria-label="返回卡组管理">← <span>卡组管理</span></Link>
      <div className={styles.title}><h1 title={deckName}>{deckName.trim() || t('DECK_EDIT_UNTITLED')}</h1><span className={styles.saveState} data-dirty={saveState === 'dirty'} role="status">{saving ? t('BUTTON_SAVING') : saveState === 'dirty' ? t('DECK_UNSAVED_DRAFT') : saveState === 'error' ? t('DECK_SAVE_FAILED') : t('DECK_ALL_CHANGES_SAVED')}</span></div>
      {deckCounts && deckCount !== undefined && <div className={styles.counts}><DeckComposition inline total={deckCount} counts={deckCounts} /></div>}
      <details ref={moreRef} className={styles.more} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false; }} onKeyDown={event => { if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus(); } }}><summary aria-label={t('DECK_MORE_ACTIONS')}>•••</summary><div>{onRefreshInventory && <button type="button" disabled={disabled || inventoryRefreshing} onClick={() => action(onRefreshInventory)}>{inventoryRefreshing ? '正在同步…' : '刷新收藏'}</button>}<button type="button" disabled={disabled} onClick={() => action(onImport)}>{t('BUTTON_IMPORT')}</button><button type="button" disabled={disabled} onClick={() => action(onExport)}>{t('BUTTON_EXPORT')}</button>{onDelete && <button type="button" disabled={disabled || deleting || saving} onClick={() => action(onDelete)}>{deleting ? t('BUTTON_DELETING', { defaultValue: '正在删除…' }) : t('BUTTON_DELETE')}</button>}</div></details>
      <button type="button" className={`a-btn ${styles.saveButton}`} onClick={onSave} disabled={disabled || saving || saveBlocked}>{saving ? t('BUTTON_SAVING') : t('BUTTON_SAVE')}</button>
    </div>
    {!inventoryReady && <div className={styles.inventoryStatus} role="status">
      <span>{inventoryMessage ?? t('DECK_OWNERSHIP_PENDING')}</span>
      {onRefreshInventory && <button type="button" disabled={inventoryRefreshing} onClick={onRefreshInventory}>{inventoryRefreshing ? '正在同步…' : '重试'}</button>}
    </div>}
    {libraryFiltersVisible && <div className={styles.filterRow}>
      <label className={styles.search}><span className={styles.srOnly}>{t('DECK_EDIT_SEARCH_CARDS_LABEL')}</span><input id="deck-edit-search" type="search" className={styles.searchInput} value={filter.searchValue} disabled={disabled} autoComplete="off" placeholder={t('DECK_EDIT_SEARCH_PLACEHOLDER')} onChange={event => patch({ searchValue: event.target.value })} /></label>
      <div className={styles.categories} role="group" aria-label={t('DECK_EDIT_CARD_TYPE_GROUP')}><button type="button" aria-pressed={!filter.superTypes.length} disabled={disabled} onClick={() => patch({ superTypes: [] })}>{t('DECK_ALL_CARD_TYPES')}</button>{SUPER_TYPE_KEYS.map(row => <button type="button" key={row.value} aria-pressed={filter.superTypes.includes(row.value)} disabled={disabled} onClick={() => patch({ superTypes: filter.superTypes.includes(row.value) ? filter.superTypes.filter(type => type !== row.value) : [...filter.superTypes, row.value] })}>{t(row.key)}</button>)}</div>
      {filter.superTypes.length === 1 && filter.superTypes[0] === SuperType.ENERGY && <label className={`${styles.rarity} ${styles.energyEdition}`}><span className={styles.srOnly}>能量版本</span><select aria-label="能量版本" value={energyRange} disabled={disabled} onChange={event => onEnergyRangeChange(event.target.value as 'all' | 'free' | 'collectible')}><option value="all">全部能量版本</option><option value="free">免费基础能量</option><option value="collectible">收藏版能量</option></select></label>}
      <label className={styles.rarity}><span className={styles.srOnly}>{t('DECK_RARITY_FILTER')}</span><select value={filter.rarities?.[0] ?? ''} aria-label={t('DECK_RARITY_FILTER')} disabled={disabled} onChange={event => patch({ rarities: event.target.value ? [event.target.value] : [] })}><option value="">{t('DECK_ALL_RARITIES')}</option>{rarities.map(rarity => <option key={rarity} value={rarity}>{rarity}</option>)}</select></label>
      <button type="button" className={styles.filterToggle} disabled={disabled} onClick={() => setFiltersOpen(true)}>{t('DECK_EDIT_FILTERS')}{extraCount > 0 && <span>{extraCount}</span>}</button>
      {filtered && <button type="button" className={styles.clear} onClick={clearFilters}>{t('DECK_CLEAR_FILTERS')}</button>}
    </div>}
    {filtersOpen && <DuoDialog title={t('DECK_EDIT_FILTERS')} onClose={() => setFiltersOpen(false)}>
      <div className={styles.advanced}>
        <label>{t('DECK_RARITY_FILTER')}<select aria-label={t('DECK_RARITY_FILTER')} value={filter.rarities?.[0] ?? ''} disabled={disabled} onChange={event => patch({ rarities: event.target.value ? [event.target.value] : [] })}><option value="">{t('DECK_ALL_RARITIES')}</option>{rarities.map(rarity => <option key={rarity} value={rarity}>{rarity}</option>)}</select></label>
        <label>{t('DECK_EDIT_SET_LABEL')}<select id="deck-filter-set" value={filter.selectedSet ?? ''} disabled={disabled} onChange={event => patch({ selectedSet: event.target.value || null })}><option value="">{t('DECK_EDIT_ALL_SETS')}</option>{sets.map(set => <option value={set} key={set}>{set}</option>)}</select></label>
        <fieldset className={styles.choiceField}><legend>{t('DECK_EDIT_FORMATS_ANY')}</legend><div className={styles.choices}>{formats.map(row => <button type="button" key={row.value} className={styles.choice} aria-pressed={filter.formats.includes(row.value)} disabled={disabled} onClick={() => patch({ formats: filter.formats.includes(row.value) ? filter.formats.filter(value => value !== row.value) : [...filter.formats, row.value] })}>{t(row.labelKey)}</button>)}</div></fieldset>
        <fieldset className={styles.choiceField}><legend>{t('DECK_EDIT_TAGS_ANY')}</legend><div className={styles.choices}>{tags.map(tag => <button type="button" key={tag.value} className={styles.choice} aria-pressed={filter.tags.includes(tag.value)} disabled={disabled} onClick={() => patch({ tags: filter.tags.includes(tag.value) ? filter.tags.filter(value => value !== tag.value) : [...filter.tags, tag.value] })}>{tag.label}</button>)}</div></fieldset>
        {isAdmin && <DuoSwitch checked={filter.showLibraryCardTypeBadge} onChange={checked => patch({ showLibraryCardTypeBadge: checked })} disabled={disabled}>{t('DECK_EDIT_SHOW_TYPE_OVERLAY_ADMIN')}</DuoSwitch>}
      </div><div className="duo-dialog-actions"><button type="button" className="duo-text-link" onClick={clearFilters}>{t('DECK_CLEAR_FILTERS')}</button><button type="button" className="duo-button duo-button-primary" onClick={() => setFiltersOpen(false)}>{t('BUTTON_OK')}</button></div>
    </DuoDialog>}
  </header>;
}
