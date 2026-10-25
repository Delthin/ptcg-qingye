import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBeforeUnload, useBlocker, useLocation, useNavigate } from 'react-router-dom';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { FREE_BASIC_ENERGIES, canonicalFreePrintingId, cardPrintingKey, SuperType, type Archetype, type Card } from 'ptcg-server';
import { defaultEnergyCard, isFreeBasicEnergy, withEnergyPrinting } from './energyPrintings';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { ApiError } from '../api/apiError';
import { deleteDeck, getDeck, saveDeck } from '../api/deckApi';
import { useDeckCardScanUrl } from '../context/CardImagesContext';
import { DeckBuildPane } from './DeckBuildPane';
import { DeckWorkbenchPanes } from './DeckWorkbenchPanes';
import { DeckEditInfoValidity } from './DeckEditInfoValidity';
import { DeckEditToolbar } from './DeckEditToolbar';
import { DeckLibraryPane } from './DeckLibraryPane';
import { DeckQuantityDialog } from './DeckQuantityDialog';
import { CardInfoPopup } from '../card-info/CardInfoPopup';
import { readFavoriteCards } from '../card-info/favoriteCardsStorage';
import {
  addCardToDeck,
  isBasicEnergy,
  flatNamesFromSlots,
  flatPrintingIdsFromSlots,
  removeOneCopy,
  reorderSlots,
  replaceSlotCard,
  setSlotCount,
  slotsFromFlatNames,
} from './deckRules';
import { clipboardImportFromText, formatPtcgoImportFailures } from './clipboardDeckImport';
import { deckListExportAngularCountedLines } from './deckListExportText';
import { sortLibraryCatalog } from './filterLibrary';
import { createDeckOwnership } from './deckOwnership';
import { cardDisplayName, isChineseCard } from '../duo/chineseCatalog';
import { useEconomy } from '../collection/EconomyContext';
import type { OwnedPrinting } from '../collection/economyTypes';
import { DuoDialog } from '../duo/DuoDialog';
import { useIncrementalFilteredLibrary } from './useIncrementalFilteredLibrary';
import { DECK_DEFAULT_SLOT_W } from './deckCardLayout';
import { defaultToolbarFilter, type DeckEditToolbarFilter, type DeckSlot } from './types';
import styles from './DeckEditView.module.css';

const LS_DEFAULT_DECK_ID = 'defaultDeckId';
const LS_FORMAT_DEFAULTS = 'formatDefaultDecks';

function clearStoredDeckDefaults(deletedId: number): void {
  const def = localStorage.getItem(LS_DEFAULT_DECK_ID);
  if (def !== null && parseInt(def, 10) === deletedId) {
    localStorage.removeItem(LS_DEFAULT_DECK_ID);
  }
  try {
    const raw = localStorage.getItem(LS_FORMAT_DEFAULTS);
    if (!raw) {
      return;
    }
    const o = JSON.parse(raw) as Record<string, number>;
    const next = { ...o };
    let changed = false;
    for (const k of Object.keys(next)) {
      if (next[k] === deletedId) {
        delete next[k];
        changed = true;
      }
    }
    if (changed) {
      localStorage.setItem(LS_FORMAT_DEFAULTS, JSON.stringify(next));
    }
  } catch {
    /* ignore */
  }
}

function useNarrowLayout(breakpointPx: number): boolean {
  const [narrow, setNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(`(max-width: ${breakpointPx}px)`).matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx}px)`);
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [breakpointPx]);

  return narrow;
}

export type DeckEditViewProps = {
  deckId: number;
};

export function DeckEditView({ deckId }: DeckEditViewProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const clipboardFromNavConsumed = useRef(false);
  const { cardsInfo, serverConfig, user } = useAuth();
  const { hiddenFormats } = useSettings();
  const isNarrow = useNarrowLayout(899);
  const [mobileTab, setMobileTab] = useState<'library' | 'deck'>('deck');
  const economy = useEconomy();
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [savedIsValid, setSavedIsValid] = useState<boolean | undefined>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const allowLeave = useRef(false);
  const loadedLines = useRef<string[] | null>(null);
  const [libraryHidden, setLibraryHidden] = useState(false);

  const [deckName, setDeckName] = useState('');
  const [slots, setSlots] = useState<DeckSlot[]>([]);
  const [deckLinesFromServer, setDeckLinesFromServer] = useState<string[] | null>(null);
  const [savedPrintingIds, setSavedPrintingIds] = useState<(string | null)[] | undefined>();
  const [savedPrintings, setSavedPrintings] = useState<Omit<OwnedPrinting, 'count'>[]>([]);
  const [energyRange, setEnergyRange] = useState<'all' | 'free' | 'collectible'>('all');
  /** Kept in sync with last load; forwarded on save so the API does not clear these fields. */
  const [manualArchetype1, setManualArchetype1] = useState<Archetype | undefined>(undefined);
  const [manualArchetype2, setManualArchetype2] = useState<Archetype | undefined>(undefined);
  const [deckArtworks, setDeckArtworks] = useState<{ code: string; artworkId?: number }[] | undefined>(undefined);
  const [sleeveIdentifier, setSleeveIdentifier] = useState<string | undefined>(undefined);
  const [importUnknown, setImportUnknown] = useState<string[]>([]);
  const [transfer, setTransfer] = useState<{ kind: 'import' | 'export'; text: string } | null>(null);
  const [transferMessage, setTransferMessage] = useState('');
  const [filter, setFilter] = useState<DeckEditToolbarFilter>(() => defaultToolbarFilter());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ruleMessage, setRuleMessage] = useState<string | null>(null);
  const [cardInfoCard, setCardInfoCard] = useState<Card | null>(null);
  const [quantityEditCard, setQuantityEditCard] = useState<Card | null>(null);


  const isThemeDeck = deckId < 0;
  const disabled = isThemeDeck || loading;
  const isAdmin = user?.roleId === 4;

  const allCards = useMemo(
    () => sortLibraryCatalog(cardsInfo?.cards ?? []),
    [cardsInfo?.cards],
  );
  const byFullName = useMemo(() => {
    const m = new Map<string, Card>();
    for (const c of allCards) {
      m.set(c.fullName, defaultEnergyCard(c));
    }
    return m;
  }, [allCards]);

  const cardsCatalogHash = cardsInfo?.hash ?? '';
  const energyPrintings = useMemo(() => economy.snapshot?.basicEnergyPrintings ?? savedPrintings.filter(p => p.basicEnergy), [economy.snapshot?.basicEnergyPrintings, savedPrintings]);
  const libraryCards = useMemo(() => {
    const defaults = FREE_BASIC_ENERGIES.flatMap(p => { const c = byFullName.get(p.engineFullName); return c ? [c] : []; });
    const collectible = (energyPrintings || []).filter(p => !canonicalFreePrintingId(p.printingId)).flatMap(p => {
      const c = p.engineFullName ? byFullName.get(p.engineFullName) : undefined;
      return c ? [withEnergyPrinting(c, p)] : [];
    });
    return [...allCards.filter(c => isChineseCard(c) && !isBasicEnergy(c)), ...defaults, ...collectible];
  }, [allCards, byFullName, energyPrintings]);
  const byPrinting = useMemo(() => {
    const map = new Map(libraryCards.map(c => [c.printingId || c.fullName, c]));
    for (const p of [...savedPrintings, ...economy.snapshot?.holdings || []]) {
      if (!p.engineFullName) continue;
      const c = byFullName.get(p.engineFullName);
      if (c) map.set(p.printingId, withEnergyPrinting(c, p));
    }
    return map;
  }, [libraryCards, economy.snapshot?.holdings, byFullName, savedPrintings]);
  const byKey = useMemo(() => new Map([...libraryCards, ...slots.map(s => s.card)].map(c => [cardPrintingKey(c), c])), [libraryCards, slots]);
  const inventoryReady = economy.status === 'ready' && !economy.error && !!user?.userId && economy.snapshot?.userId === user.userId;
  const ownedCounts = useMemo(() => {
    if (!inventoryReady) return undefined;
    const counts = new Map(economy.ownedCounts);
    for (const p of economy.snapshot?.holdings || []) counts.set(p.printingId, p.count);
    return counts;
  }, [inventoryReady, economy.ownedCounts, economy.snapshot?.holdings]);
  const inventoryMessage = inventoryReady
    ? ''
    : economy.status === 'error' || economy.error
      ? t('DECK_INVENTORY_FAILED_HINT', { defaultValue: '收藏同步失败，暂时无法核对持有；仅免费基础能量可加入。' })
      : t('DECK_INVENTORY_PENDING_HINT', { defaultValue: '收藏待同步，暂时无法核对持有；仅免费基础能量可加入。' });
  const ownership = useMemo(() => createDeckOwnership(ownedCounts, inventoryMessage), [ownedCounts, inventoryMessage]);
  const visibleLibraryCards = useMemo(() => {
    const range = libraryCards.filter(c => energyRange === 'all' ||
      (energyRange === 'free' ? isFreeBasicEnergy(c) : c.superType === SuperType.ENERGY && !isFreeBasicEnergy(c)));
    return range.filter(card => ownership.limit(card) > 0);
  }, [libraryCards, ownership, energyRange]);
  const deckOwnership = useMemo(() => ownership.validate(slots), [ownership, slots]);
  const unknownSaveReason = importUnknown.length ? t('DECK_SAVE_UNKNOWN_BLOCKED', {
    count: importUnknown.length,
    preview: importUnknown.slice(0, 3).join('；'),
    defaultValue: '卡组含 {{count}} 条未识别原牌：{{preview}}。为避免丢失原牌，暂不能保存；请先核对卡牌目录或明确导入完整新卡表。',
  }) : undefined;

  const importedDeckReason = useCallback((next: DeckSlot[], unknown: string[], clippedCardCount: number) => {
    if (!next.length) return '请粘贴有效卡表。当前卡组没有被替换。';
    if (unknown.length) return `未识别的卡牌：${unknown.slice(0, 3).join('；')}。当前卡组没有被替换。`;
    if (clippedCardCount > 0) return '同名卡超过 4 张（基本能量除外），请调整卡表。当前卡组没有被替换。';
    const held = ownership.validate(next);
    if (!held.ok) return `${held.reason}当前卡组没有被替换。`;
    if (next.some(slot => slot.count > ownership.maxCount(next, slot.card))) {
      return '卡表超过同名或特殊卡构筑上限。当前卡组没有被替换。';
    }
    return undefined;
  }, [ownership]);

  const {
    cards: filteredLibrary,
    done: libraryScanComplete,
    requestScrollBoost,
  } = useIncrementalFilteredLibrary(visibleLibraryCards, filter);

  // The incremental filter may re-sort search results; apply the ownership range again at render time.
  const displayedLibrary = useMemo(() => {
    const available = (card: Card) => ownership.limit(card) > 0;
    if (filter.ownedOnly) return filteredLibrary.filter(available);
    return [...filteredLibrary.filter(available), ...filteredLibrary.filter(card => !available(card))];
  }, [filteredLibrary, filter.ownedOnly, ownership]);

  const getScanUrl = useDeckCardScanUrl(serverConfig?.scansUrl);

  const saveDeckWithFlatCards = useCallback(
    async (flatNames: string[], unknownEntries = importUnknown, sourceSlots = slots) => {
      if (unknownEntries.length) throw new Error(t('DECK_SAVE_UNKNOWN_BLOCKED', {
        count: unknownEntries.length,
        preview: unknownEntries.slice(0, 3).join('；'),
        defaultValue: '卡组含 {{count}} 条未识别原牌：{{preview}}。为避免丢失原牌，暂不能保存；请先核对卡牌目录或明确导入完整新卡表。',
      }));
      // Preserve every copy's identity; the server validates references and inventory.
      const refs = flatPrintingIdsFromSlots(sourceSlots);
      const saved = await saveDeck(
        deckId,
        deckName.trim(),
        flatNames,
        manualArchetype1,
        manualArchetype2,
        deckArtworks,
        sleeveIdentifier,
        refs,
      );
      // The current save response omits isValid; read back without changing the
      // successful-save outcome if only that follow-up request fails.
      if (typeof saved.deck.isValid !== 'boolean') {
        try { saved.deck.isValid = (await getDeck(deckId)).deck.isValid; }
        catch { /* Saved successfully; full legality remains unknown. */ }
      }
      return saved;
    },
    [deckId, deckName, manualArchetype1, manualArchetype2, deckArtworks, sleeveIdentifier, slots, importUnknown, t],
  );

  useEffect(() => {
    if (!Number.isFinite(deckId)) {
      setLoading(false);
      setError(t('REACT_INVALID_DECK'));
      return;
    }
    loadedLines.current = null;
    setSavedSignature(null);
    setSavedIsValid(undefined);
    setSaveFailed(false);
    setDeckLinesFromServer(null);
    setSavedPrintingIds(undefined);
    setSavedPrintings([]);
    setSlots([]);
    setImportUnknown([]);
    setManualArchetype1(undefined);
    setManualArchetype2(undefined);
    setDeckArtworks(undefined);
    setSleeveIdentifier(undefined);
    let alive = true;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getDeck(deckId);
        if (!alive) return;
        const d = res.deck;
        setDeckName(d.name);
        setSavedIsValid(d.isValid);
        const lines = (d.cards ?? []).filter(Boolean);
        setDeckLinesFromServer(lines);
        setSavedPrintingIds(d.printingIds);
        setSavedPrintings(d.printings || []);
        setManualArchetype1(d.manualArchetype1 || undefined);
        setManualArchetype2(d.manualArchetype2 || undefined);
        setDeckArtworks(d.artworks);
        setSleeveIdentifier(d.sleeveIdentifier);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof ApiError ? e.message : t('REACT_ERROR_LOAD_SINGLE_DECK'));
        setDeckLinesFromServer(null);
        setSlots([]);
        setImportUnknown([]);
        setManualArchetype1(undefined);
        setManualArchetype2(undefined);
        setDeckArtworks(undefined);
        setSleeveIdentifier(undefined);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [deckId, t]);

  useEffect(() => {
    if (deckLinesFromServer === null) {
      return;
    }
    if (!cardsCatalogHash || byFullName.size === 0) {
      return;
    }
    if (loadedLines.current === deckLinesFromServer) return;
    loadedLines.current = deckLinesFromServer;
    const { slots: next, unknown } = slotsFromFlatNames(deckLinesFromServer, byFullName, savedPrintingIds, byPrinting);
    setSlots(next);
    setSavedSignature(JSON.stringify([deckName.trim(), flatNamesFromSlots(next), flatPrintingIdsFromSlots(next)]));
    setImportUnknown(unknown);
  }, [deckLinesFromServer, cardsCatalogHash, byFullName, deckName, savedPrintingIds, byPrinting, energyPrintings]);

  useEffect(() => {
    clipboardFromNavConsumed.current = false;
  }, [deckId]);

  useEffect(() => {
    const raw = (location.state as { importFromClipboard?: string } | null)?.importFromClipboard;
    if (raw == null || typeof raw !== 'string') {
      return;
    }
    if (loading || disabled) {
      return;
    }
    if (!cardsCatalogHash || byFullName.size === 0) {
      return;
    }
    if (clipboardFromNavConsumed.current) {
      return;
    }
    clipboardFromNavConsumed.current = true;
    const imp = clipboardImportFromText(raw, allCards, byFullName, readFavoriteCards());
    const { slots: next, unknown: u2 } = slotsFromFlatNames(imp.flatFullNames, byFullName);
    const failureFmt = formatPtcgoImportFailures(imp.ptcgoFailureCounts);
    const unknownAll = [...failureFmt, ...imp.fallbackUnknown, ...u2];
    const rejection = importedDeckReason(next, unknownAll, imp.clippedCardCount);
    navigate(location.pathname, { replace: true, state: {} });
    if (rejection) {
      setRuleMessage(rejection);
      return;
    }
    setSlots(next);
    setImportUnknown(unknownAll);
    setRuleMessage(
      unknownAll.length ? t('DECK_IMPORT_SKIP_UNKNOWN', { count: unknownAll.length }) : t('DECK_IMPORT_APPLIED_CLIPBOARD'),
    );

    if (!isThemeDeck) {
      void (async () => {
        try {
          const saved = await saveDeckWithFlatCards(flatNamesFromSlots(next), unknownAll, next);
          setSavedIsValid(saved.deck.isValid);
          setSavedSignature(JSON.stringify([deckName.trim(), flatNamesFromSlots(next), flatPrintingIdsFromSlots(next)]));
        } catch (e) {
          setError(e instanceof Error ? e.message : t('REACT_ERROR_SAVE_DECK'));
        }
      })();
    }
  }, [
    location.pathname,
    location.state,
    loading,
    disabled,
    cardsCatalogHash,
    byFullName,
    allCards,
    deckId,
    deckName,
    isThemeDeck,
    navigate,
    saveDeckWithFlatCards,
    importedDeckReason,
    t,
  ]);

  useEffect(() => {
    setFilter((f) => {
      const nextFormats = f.formats.filter((fmt) => !hiddenFormats.includes(fmt));
      if (nextFormats.length === f.formats.length) {
        return f;
      }
      return { ...f, formats: nextFormats };
    });
  }, [hiddenFormats]);

  const deckCount = useMemo(() => slots.reduce((s, x) => s + x.count, 0), [slots]);
  const currentSignature = useMemo(() => JSON.stringify([deckName.trim(), flatNamesFromSlots(slots), flatPrintingIdsFromSlots(slots)]), [deckName, slots]);
  const dirty = !isThemeDeck && savedSignature !== null && currentSignature !== savedSignature;
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !allowLeave.current && currentLocation.pathname !== nextLocation.pathname);
  useBeforeUnload(useCallback((event: BeforeUnloadEvent) => { if (dirty && !allowLeave.current) { event.preventDefault(); event.returnValue = ''; } }, [dirty]));
  const addReason = useCallback((card: Card) => { const result = ownership.canAdd(slots, card); return result.ok ? undefined : result.reason; }, [slots, ownership]);
  const ownershipReason = useCallback((card: Card) => ownership.countReason(card, slots.find(slot => cardPrintingKey(slot.card) === cardPrintingKey(card))?.count ?? 0), [slots, ownership]);
  const saveState = saving ? 'saving' : saveFailed ? 'error' : dirty ? 'dirty' : 'saved';

  const inDeckCounts = useMemo(() => new Map(slots.map((s) => [cardPrintingKey(s.card), s.count])), [slots]);

  const canAddCard = useCallback((card: Card) => !disabled && ownership.canAdd(slots, card).ok, [slots, ownership, disabled]);

  const tryAdd = useCallback(
    (card: Card) => {
      if (disabled) return;
      const gate = ownership.canAdd(slots, card);
      if (!gate.ok) {
        setRuleMessage(gate.reason);
        return;
      }
      const res = addCardToDeck(slots, card);
      if (!res.ok) {
        setRuleMessage(res.reason);
        return;
      }
      setRuleMessage(null);
      setSlots(res.slots);
    },
    [slots, ownership, disabled],
  );

  const tryAddByFullName = useCallback(
    (fullName: string) => {
      const card = byKey.get(fullName);
      if (card) {
        tryAdd(card);
      }
    },
    [byKey, tryAdd],
  );

  const openQuantityEdit = useCallback(
    (card: Card) => {
      if (disabled) {
        return;
      }
      setQuantityEditCard(card);
    },
    [disabled],
  );

  const onQuantityConfirm = useCallback(
    (count: number) => {
      if (disabled || !quantityEditCard || !Number.isFinite(count)) return;
      const requested = Math.max(0, Math.floor(count));
      const current = slots.find(slot => cardPrintingKey(slot.card) === cardPrintingKey(quantityEditCard))?.count ?? 0;
      if (requested > current) {
        const held = ownership.validateIncrease(slots, quantityEditCard, requested);
        if (!held.ok) { setRuleMessage(held.reason); return; }
        if (requested > ownership.maxCount(slots, quantityEditCard)) { setRuleMessage('已达构筑上限。'); return; }
      }
      // Reductions remain possible even while a legacy deck is over-owned or inventory is unavailable.
      const res = setSlotCount(slots, quantityEditCard, requested);
      if (!res.ok) {
        setRuleMessage(res.reason);
        return;
      }
      setRuleMessage(null);
      setSlots(res.slots);
    },
    [quantityEditCard, slots, ownership, disabled],
  );

  const quantityEditValue = quantityEditCard
    ? (inDeckCounts.get(cardPrintingKey(quantityEditCard)) ?? 0)
    : 0;
  const quantityEditMax = quantityEditCard ? ownership.maxCount(slots, quantityEditCard) : 0;

  const onSave = useCallback(async () => {
    if (saving || disabled) return;
    if (unknownSaveReason) { setRuleMessage(unknownSaveReason); setSaveFailed(true); return; }
    const names = flatNamesFromSlots(slots);
    const signature = currentSignature;
    setSaving(true); setSaveFailed(false); setError(null);
    try { const saved = await saveDeckWithFlatCards(names); setSavedIsValid(saved.deck.isValid); setSavedSignature(signature); }
    catch (e) { setSaveFailed(true); setError(e instanceof Error ? e.message : t('REACT_ERROR_SAVE_DECK')); }
    finally { setSaving(false); }
  }, [saving, disabled, slots, ownership, unknownSaveReason, currentSignature, saveDeckWithFlatCards, t]);

  const onDeleteDeck = useCallback(async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteDeck(deckId);
      clearStoredDeckDefaults(deckId);
      allowLeave.current = true;
      navigate('/deck');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('REACT_ERROR_DELETE_DECK'));
    } finally {
      setDeleting(false);
    }
  }, [deckId, navigate, t]);

  const onExport = useCallback(() => {
    setTransferMessage('');
    setTransfer({ kind: 'export', text: deckListExportAngularCountedLines(slots) });
  }, [slots]);

  const onImport = useCallback(() => {
    setTransferMessage('');
    setTransfer({ kind: 'import', text: '' });
  }, []);

  function applyImportedText() {
    if (disabled || !transfer || transfer.kind !== 'import') return;
    const imp = clipboardImportFromText(transfer.text, allCards, byFullName, readFavoriteCards());
    const { slots: next, unknown } = slotsFromFlatNames(imp.flatFullNames, byFullName);
    const unknownAll = [...formatPtcgoImportFailures(imp.ptcgoFailureCounts), ...imp.fallbackUnknown, ...unknown];
    const rejection = importedDeckReason(next, unknownAll, imp.clippedCardCount);
    if (rejection) {
      setTransferMessage(rejection);
      return;
    }
    setSlots(next);
    setImportUnknown([]);
    setTransfer(null);
    setRuleMessage('卡表已导入，请点击保存。');
  }

  async function copyExportedText() {
    if (!transfer || transfer.kind !== 'export') return;
    try {
      await navigator.clipboard.writeText(transfer.text);
      setTransferMessage(t('DECK_EXPORTED_TO_CLIPBOARD'));
    } catch {
      setTransferMessage('浏览器不允许自动复制，请选中上方卡表手动复制。');
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const deckIds = useMemo(() => slots.map((s) => cardPrintingKey(s.card)), [slots]);

  const onDragEnd = useCallback(
    (e: DragEndEvent) => {
      const { active, over } = e;
      if (!over) {
        return;
      }
      const a = active.data.current as { source?: string; card?: Card } | undefined;
      if (a?.source === 'deck') {
        const aid = String(active.id);
        const oid = String(over.id);
        if (aid === oid) {
          return;
        }
        if (byKey.get(aid)?.superType !== byKey.get(oid)?.superType) return;
        if (deckIds.includes(aid) && deckIds.includes(oid)) {
          setSlots((prev) => reorderSlots(prev, aid, oid));
        }
      }
    },
    [deckIds, byKey],
  );

  if (!Number.isFinite(deckId)) {
    return <p>Invalid deck</p>;
  }

  if (loading) {
    return <div className={styles.loadingDeck} role="status"><span className="duo-ball" aria-hidden />{t('PROTECTED_LOADING')}</div>;
  }

  const libraryPane = (
    <DeckLibraryPane
      cardSlotW={DECK_DEFAULT_SLOT_W}
      cards={displayedLibrary}
      scanComplete={libraryScanComplete}
      onNearCatalogEnd={requestScrollBoost}
      getScanUrl={getScanUrl}
      showTypeBadge={isAdmin && filter.showLibraryCardTypeBadge}
      disabled={disabled}
      onAddCard={tryAdd}
      onRemoveOneFromDeck={(fullName) => setSlots((prev) => removeOneCopy(prev, fullName))}
      onEditQuantity={openQuantityEdit}
      inDeckCounts={inDeckCounts}
      canAddCard={canAddCard}
      ownedCounts={ownedCounts}
      addReason={addReason}
      onOpenCardInfo={(c) => setCardInfoCard(c)}
    />
  );

  const deckPane = (
    <DeckBuildPane
      slots={slots}
      getScanUrl={getScanUrl}
      disabled={disabled}
      deckCount={deckCount}
      ruleMessage={ruleMessage}
      showLibraryToggle={!isNarrow}
      libraryHidden={libraryHidden}
      onToggleLibrary={() => setLibraryHidden((v) => !v)}
      onAddCopy={tryAddByFullName}
      onRemoveCopy={(fullName) => setSlots((prev) => removeOneCopy(prev, fullName))}
      onRemoveSlot={(fullName) => { if (!disabled) setSlots(prev => prev.filter(slot => cardPrintingKey(slot.card) !== fullName)); }}
      onEditQuantity={openQuantityEdit}
      onOpenCardInfo={(c) => setCardInfoCard(c)}
      ownedCounts={ownedCounts}
      ownershipReason={ownershipReason}
      canAddCard={canAddCard}
      addReason={addReason}
    />
  );

  return (
    <div className={`a-page ${styles.page}`}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className={`a-wrap ${styles.workbench}`}>
        <div className={styles.console}>
          <DeckEditToolbar
            deckName={deckName}
            filter={filter}
            onFilterChange={next => {
              setFilter({ ...next, ownedOnly: true });
              if (next.superTypes.length !== 1 || next.superTypes[0] !== SuperType.ENERGY) setEnergyRange('all');
            }}
            allCards={libraryCards}
            disabled={disabled}
            isAdmin={isAdmin}
            saving={saving}
            deckCount={deckCount}
            deckCounts={{
              pokemon: slots.filter(slot => slot.card.superType === SuperType.POKEMON).reduce((sum, slot) => sum + slot.count, 0),
              trainer: slots.filter(slot => slot.card.superType === SuperType.TRAINER).reduce((sum, slot) => sum + slot.count, 0),
              energy: slots.filter(slot => slot.card.superType === SuperType.ENERGY).reduce((sum, slot) => sum + slot.count, 0),
            }}
            energyRange={energyRange}
            onEnergyRangeChange={setEnergyRange}
            saveState={saveState}
            inventoryReady={inventoryReady}
            inventoryMessage={inventoryMessage}
            inventoryRefreshing={economy.status === 'loading' || economy.busy}
            onRefreshInventory={() => void economy.refresh()}
            saveBlocked={!!unknownSaveReason}
            libraryFiltersVisible={!isNarrow || mobileTab === 'library'}
            onSave={() => void onSave()}
            onExport={onExport}
            onImport={onImport}
            onDelete={isThemeDeck ? undefined : () => setDeleteConfirm(true)}
            deleting={deleting}
          />
          {isThemeDeck && (
            <div className={styles.warnBanner}>{t('DECK_EDIT_THEME_READONLY')}</div>
          )}
          {error && <div className={styles.errorBanner}>{error}</div>}
          {!deckOwnership.ok && <div className={styles.warnBanner} role="status">{deckOwnership.reason} {t('DECK_OWNERSHIP_REPAIR_HINT', { defaultValue: '可查看、移除或减少数量；旧练习卡组可保留草稿，补齐收藏后才能对战。' })}</div>}
          {!error &&
            !loading &&
            deckLinesFromServer !== null &&
            (!cardsCatalogHash || byFullName.size === 0) && (
              <div className={styles.warnBanner}>{t('DECK_EDIT_WAITING_CATALOG')}</div>
            )}
          {importUnknown.length > 0 && (
            <div className={styles.warnBanner}>
              {unknownSaveReason}
            </div>
          )}
          <DeckWorkbenchPanes
            isNarrow={isNarrow}
            libraryHidden={libraryHidden}
            mobileTab={mobileTab}
            onMobileTabChange={setMobileTab}
            deckCount={deckCount}
            library={libraryPane}
            deck={deckPane}
          />
          <DeckEditInfoValidity slots={slots} allCards={allCards} onSave={() => void onSave()} saving={saving} disabled={disabled || !!unknownSaveReason} savedIsValid={savedIsValid} dirty={dirty} />
        </div>
        </div>
        {cardInfoCard && (
          <CardInfoPopup
            card={cardInfoCard}
            catalog={libraryCards}
            getScanUrl={getScanUrl}
            isInGame={false}
            hideSwapButton={isThemeDeck}
            onClose={() => setCardInfoCard(null)}
            onCardSwap={({ originalCard, replacementCard }) => {
              if (disabled) return;
              const source = slots.find(slot => cardPrintingKey(slot.card) === cardPrintingKey(originalCard));
              // Browsing another printing outside the deck does not add it.
              if (!source) { setCardInfoCard(replacementCard); return; }
              const replacement = defaultEnergyCard(replacementCard);
              const next = replaceSlotCard(slots, cardPrintingKey(originalCard), replacement);
              const replacementCount = next.find(slot => cardPrintingKey(slot.card) === cardPrintingKey(replacement))?.count ?? 0;
              const held = ownership.validateIncrease(next, replacement, replacementCount);
              if (!held.ok) { setRuleMessage(held.reason); return; }
              if (replacementCount > ownership.maxCount(next, replacement)) { setRuleMessage('替换后超过同名或特殊卡构筑上限。'); return; }
              setSlots(next);
              setRuleMessage(null);
              setCardInfoCard(replacement);
            }}
          />
        )}
        <DeckQuantityDialog
          open={quantityEditCard !== null}
          value={quantityEditValue}
          maxValue={quantityEditMax}
          cardName={quantityEditCard ? cardDisplayName(quantityEditCard) : undefined}
          onClose={() => setQuantityEditCard(null)}
          onConfirm={onQuantityConfirm}
        />
      </DndContext>
      {blocker.state === 'blocked' && <DuoDialog title={t('DECK_LEAVE_TITLE')} onClose={() => blocker.reset()}><p className="duo-muted">{t('DECK_LEAVE_TEXT')}</p><div className="duo-dialog-actions"><button type="button" className="duo-button duo-button-primary" onClick={() => blocker.reset()}>{t('DECK_STAY')}</button><button type="button" className="duo-button" onClick={() => blocker.proceed()}>{t('DECK_DISCARD_AND_LEAVE')}</button></div></DuoDialog>}
      {deleteConfirm && <DuoDialog title={t('BUTTON_DELETE') + ' · ' + deckName} onClose={() => { if (!deleting) setDeleteConfirm(false); }}><p className="duo-muted">{t('DECK_DELETE_SELECTED')}</p>{error && <p className="duo-error" role="alert">{error}</p>}<div className="duo-dialog-actions"><button className="duo-button" disabled={deleting} onClick={() => setDeleteConfirm(false)}>{t('BUTTON_CANCEL')}</button><button className="duo-button duo-button-primary" disabled={deleting} onClick={() => void onDeleteDeck()}>{deleting ? t('BUTTON_DELETING', { defaultValue: '正在删除…' }) : t('BUTTON_DELETE')}</button></div></DuoDialog>}
      {transfer && <DuoDialog title={transfer.kind === 'import' ? '导入中文卡表' : '导出中文卡表'} onClose={() => setTransfer(null)}>
        <p className="duo-muted">{transfer.kind === 'import' ? '每行一张卡：数量、中文名称、系列和编号。导入会替换当前编辑内容，保存后才写入卡组。' : '保留数量、中文名称、系列和编号，可直接分享或重新导入。'}</p>
        <label className="duo-field">中文卡表<textarea className={styles.transferText} autoFocus rows={12} value={transfer.text} readOnly={transfer.kind === 'export'} onChange={event => { setTransfer({ ...transfer, text: event.target.value }); setTransferMessage(''); }} /></label>
        {transferMessage && <p role="status" className="duo-muted">{transferMessage}</p>}
        <div className="duo-dialog-actions"><button type="button" className="duo-button" onClick={() => setTransfer(null)}>关闭</button><button type="button" className="duo-button duo-button-primary" onClick={transfer.kind === 'import' ? applyImportedText : () => void copyExportedText()}>{transfer.kind === 'import' ? '应用卡表' : '复制卡表'}</button></div>
      </DuoDialog>}
    </div>
  );
}
