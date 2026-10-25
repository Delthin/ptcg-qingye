// Dev-only: real layout, toolbar and card panes with local sample data. No API, sockets or deck writes.
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { DndContext } from '@dnd-kit/core';
import { EnergyType, Stage, SuperType, type Card } from 'ptcg-server';
import '../src/i18n/i18n';
import '../src/styles/design-system.css';
import '../src/styles/arena.css';
import { SettingsProvider } from '../src/context/SettingsContext';
import { DeckWorkbenchPanes } from '../src/deck-editor/DeckWorkbenchPanes';
import { DeckBuildPane } from '../src/deck-editor/DeckBuildPane';
import { DeckLibraryPane } from '../src/deck-editor/DeckLibraryPane';
import { DeckEditToolbar } from '../src/deck-editor/DeckEditToolbar';
import { DeckEditInfoValidity } from '../src/deck-editor/DeckEditInfoValidity';
import { DECK_DEFAULT_SLOT_W } from '../src/deck-editor/deckCardLayout';
import { defaultToolbarFilter } from '../src/deck-editor/types';
import styles from '../src/deck-editor/DeckEditView.module.css';

const noop = () => {};
const cards = Array.from({ length: 59 }, (_, index) => ({
  fullName: `布局样本 ${index + 1}`, name: `布局样本 ${index + 1}`, set: '测试', setNumber: String(index + 1),
  superType: index < 15 ? SuperType.POKEMON : index < 57 ? SuperType.TRAINER : SuperType.ENERGY,
  energyType: EnergyType.BASIC, stage: Stage.BASIC, tags: [],
} as unknown as Card));
const slots = [...cards.slice(0, 15), ...cards.slice(15, 29), cards[58]].map(card => ({ card, count: 2 }));
const inDeckCounts = new Map(slots.map(slot => [slot.card.fullName, slot.count]));
const ownedCounts = new Map(cards.map(card => [card.fullName, 4]));
const getScanUrl = () => '/assets/cardback.png';

export function Fixture() {
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 899px)').matches);
  const [mobileTab, setMobileTab] = useState<'library' | 'deck'>('deck');
  const [libraryHidden, setLibraryHidden] = useState(false);
  const [filter, setFilter] = useState(defaultToolbarFilter);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 899px)');
    const change = () => setNarrow(mq.matches);
    mq.addEventListener('change', change);
    return () => mq.removeEventListener('change', change);
  }, []);
  const library = <DeckLibraryPane cardSlotW={DECK_DEFAULT_SLOT_W} cards={cards} scanComplete getScanUrl={getScanUrl}
    showTypeBadge={false} disabled={false} onAddCard={noop} onRemoveOneFromDeck={noop} onEditQuantity={noop}
    inDeckCounts={inDeckCounts} canAddCard={() => true} ownedCounts={ownedCounts} onOpenCardInfo={noop} />;
  const deck = <DeckBuildPane slots={slots} getScanUrl={getScanUrl} disabled={false} deckCount={60} ruleMessage={null}
    showLibraryToggle={!narrow} libraryHidden={libraryHidden} onToggleLibrary={() => setLibraryHidden(hidden => !hidden)}
    onAddCopy={noop} onRemoveCopy={noop} onEditQuantity={noop} onOpenCardInfo={noop}
    ownedCounts={ownedCounts} ownershipReason={() => undefined} onRemoveSlot={noop} />;
  return <MemoryRouter><SettingsProvider><DndContext>
    <div style={{ height: narrow && window.innerWidth <= 768 ? 57 : 65, display: 'flex', alignItems: 'center', paddingInline: 20, color: '#f3ead6', background: '#2e1e14' }}>卡组布局回归夹具 · 本地样本</div>
    <div className={`a-page ${styles.page}`}><div className={`a-wrap ${styles.workbench}`}><div className={styles.console}>
      <DeckEditToolbar deckName="响应式卡组布局" filter={filter} onFilterChange={setFilter} allCards={cards}
        disabled={false} isAdmin={false} saving={false} onSave={noop} onExport={noop} onImport={noop}
        inventoryReady libraryFiltersVisible={!narrow || mobileTab === 'library'} deckCount={60}
        deckCounts={{ pokemon: 30, trainer: 28, energy: 2 }} energyRange="all" onEnergyRangeChange={noop} />
      <DeckWorkbenchPanes isNarrow={narrow} libraryHidden={libraryHidden} mobileTab={mobileTab}
        onMobileTabChange={setMobileTab} deckCount={60} library={library} deck={deck} />
      <DeckEditInfoValidity slots={slots} allCards={cards} savedIsValid />
    </div></div></div>
  </DndContext></SettingsProvider></MemoryRouter>;
}

createRoot(document.getElementById('fixture')!).render(<Fixture />);
