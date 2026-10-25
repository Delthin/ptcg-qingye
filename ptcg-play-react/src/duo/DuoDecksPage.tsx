import { useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { SuperType } from 'ptcg-server';
import { useAuth } from '../context/AuthContext';
import { createDeck, deleteDeck, renameDeck } from '../api/deckApi';
import { DeckComposition } from '../deck-editor/DeckComposition';
import { deckNameError, deckNameSaveError } from '../deck-editor/deckName';
import type { DeckListEntry } from '../types/responses';
import { chineseCard } from './chineseCatalog';
import { rememberDuoDeck, selectDuoDeck } from './duoApi';
import { useDuoRoom } from './useDuoRoom';
import { DuoDialog } from './DuoDialog';
import { GameIcon } from './GameIcon';
import { onImageError } from '../components/imageFallback';
import styles from './DuoDecksPage.module.css';

const CARD_BACK = '/assets/duo-cardback.svg';
const INNER_LAYERS = [1, 2, 3, 4];

export function DuoDecksPage() {
  const { user, cardsInfo } = useAuth();
  const { decks, room, error, loading, refresh } = useDuoRoom();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [dialog, setDialog] = useState<{ kind: 'new' | 'rename'; deck?: DeckListEntry } | null>(null);
  const [name, setName] = useState('');
  const [deleting, setDeleting] = useState<DeckListEntry | null>(null);
  const [search, setSearch] = useState('');
  const cardTypes = useMemo(() => new Map(cardsInfo?.cards.map(card => [card.fullName, card.superType])), [cardsInfo]);
  const visibleDecks = decks.filter(deck => deck.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  function composition(deck: DeckListEntry) {
    const counts = { pokemon: 0, trainer: 0, energy: 0 };
    for (const name of deck.cards ?? []) {
      const type = cardTypes.get(name);
      if (type === SuperType.POKEMON) counts.pokemon++;
      if (type === SuperType.TRAINER) counts.trainer++;
      if (type === SuperType.ENERGY) counts.energy++;
    }
    return counts;
  }
  async function remove() {
    if (!deleting || busy) return;
    setBusy(true); setActionError('');
    try { await deleteDeck(deleting.id); setDeleting(null); refresh(); }
    catch { setActionError('删除失败，卡组仍然保留。请重试。'); }
    finally { setBusy(false); }
  }
  const me = room.players.find(player => player.userId === user?.userId);
  function deckArt(deck: DeckListEntry): string | undefined {
    const cover = deck.cards?.find(fullName => cardsInfo?.cards.some(card => card.fullName === fullName && card.superType === SuperType.POKEMON));
    return cover ? chineseCard({ fullName: cover })?.image : undefined;
  }
  async function choose(deckId: number) {
    if (busy || !user) return;
    setBusy(true); setActionError('');
    try { await selectDuoDeck(deckId); rememberDuoDeck(user.userId, deckId); refresh(); }
    catch { setActionError('出战卡组没有更新，请确认卡组完整后重试。'); }
    finally { setBusy(false); }
  }
  async function saveName(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !dialog) return;
    const nameError = deckNameError(name);
    if (nameError) { setActionError(nameError); return; }
    setBusy(true); setActionError('');
    try {
      if (dialog.kind === 'new') {
        const result = await createDeck(name.trim());
        navigate(`/deck/${result.deck.id}`);
      } else if (dialog.deck) {
        await renameDeck(dialog.deck.id, name.trim());
        setDialog(null); refresh();
      }
    } catch (cause) { setActionError(deckNameSaveError(cause)); }
    finally { setBusy(false); }
  }
  function backup() {
    const blob = new Blob([JSON.stringify({ version: 1, role: user?.name, decks: decks.map(deck => ({ name: deck.name, cards: deck.cards })) }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `双人卡桌-${me?.label ?? '卡组'}-备份.json`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="a-page">
    <div className={`a-wrap ${styles.page}`}>
      <header className={styles.head}>
        <div>
          <span className={styles.headRule} aria-hidden="true" />
          <h1 className="a-hero-title">卡组管理</h1>
        </div>
        <div className={styles.headActions}>
          <button className="a-btn-ghost" disabled={loading || !decks.length} onClick={backup}>备份卡组</button>
          <button className="a-btn" onClick={() => { setName('我的新卡组'); setActionError(''); setDialog({ kind: 'new' }); }}>＋ 新建卡组</button>
        </div>
      </header>
      {(error || actionError) && <p className="duo-error" role="alert">{actionError || error}</p>}
      <div className={`a-section ${styles.shelfHead}`}>
        <h2 className="a-section-title">我的卡组</h2>
        <div className={styles.shelfTools}>
          <span className="a-section-meta">共 {decks.length} 副</span>
          <label className={styles.findLabel}>
            <span className={styles.srOnly}>搜索卡组</span>
            <input className={`a-input ${styles.find}`} type="search" placeholder="搜索卡组名称" value={search} onChange={event => setSearch(event.target.value)} />
          </label>
        </div>
      </div>
      {loading ? <div className="a-empty"><p className="a-empty-title">正在打开卡组盒…</p></div> : <ul className={styles.wall}>
        {visibleDecks.map((deck, index) => {
          const art = deckArt(deck);
          const selected = me?.selectedDeckId === deck.id;
          return <li key={deck.id} className={`a-rise ${styles.cell} ${selected ? styles.cellSelected : ''}`} style={{ '--a-delay': `${Math.min(index, 8) * 60}ms` } as CSSProperties}>
            <div className={styles.stage}>
              <span className={styles.ground} aria-hidden="true" />
              <div className={styles.cube}>
                <span className={styles.back} aria-hidden="true" />
                <span className={styles.spineL} aria-hidden="true" />
                <span className={styles.spineR} aria-hidden="true" />
                <div className={styles.lid} aria-hidden="true">
                  <span className={styles.lidBoard}><span className={styles.lidPlate}>{String(index + 1).padStart(2, '0')}</span></span>
                  <span className={styles.lidLiner} />
                </div>
                <span className={styles.frontBoard} aria-hidden="true" />
                {INNER_LAYERS.map(i => <span key={i} className={styles.layer} style={{ '--i': i } as CSSProperties} aria-hidden="true" />)}
                <button className={styles.cover} onClick={() => navigate(`/deck/${deck.id}`)} aria-label={`打开卡组「${deck.name}」进入编辑`}>
                  <img className={styles.coverArt} src={art ?? CARD_BACK} alt={art ? `${deck.name} 封面` : ''} loading="lazy" onError={onImageError} />
                  {selected && <span className={styles.seal} aria-hidden="true" />}
                </button>
              </div>
            </div>
            <span className={styles.plank} aria-hidden="true" />
            <div className={styles.plaque}>
              <div className={styles.plaqueTop}>
                <h3 className={styles.name} title={deck.name}>{deck.name}</h3>
                <button className={`${styles.iconBtn} ${styles.iconDanger}`} disabled={busy} aria-label={`删除卡组「${deck.name}」`} title="删除卡组" onClick={() => { setActionError(''); setDeleting(deck); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7" /></svg>
                </button>
              </div>
              <p className={`${styles.meta} ${selected ? styles.metaSelected : deck.isValid ? styles.metaReady : ''}`}><i aria-hidden="true" />{selected ? '当前出战' : deck.isValid ? '可出战' : '构筑中'}</p>
              <DeckComposition compact total={deck.cards?.length ?? 0} counts={composition(deck)} />
              <div className={styles.acts}>
                <button className="a-btn" disabled={busy || !deck.isValid || selected} title={deck.isValid ? undefined : '卡组未完成，暂不能出战'} onClick={() => void choose(deck.id)}>{selected ? '✓ 出战中' : '设为出战'}</button>
                <div className={styles.actsRow}>
                  <button className="a-btn-ghost" onClick={() => navigate(`/deck/${deck.id}`)}>编辑卡组 ↗</button>
                  <button className={styles.iconBtn} aria-label={`重命名「${deck.name}」`} onClick={() => { setName(deck.name); setActionError(''); setDialog({ kind: 'rename', deck }); }}><GameIcon name="edit" size={15} /></button>
                </div>
              </div>
            </div>
          </li>;
        })}
        {!search && <li className={`a-rise ${styles.cell}`} style={{ '--a-delay': `${Math.min(visibleDecks.length, 8) * 60}ms` } as CSSProperties}>
          <div className={styles.stage}>
            <button className={styles.slot} onClick={() => { setName('我的新卡组'); setActionError(''); setDialog({ kind: 'new' }); }}>
              <span className={styles.slotPlus} aria-hidden="true" />
              <strong className={styles.slotTitle}>新建卡组</strong>
              <small className={styles.slotNote}>从空白卡组开始</small>
            </button>
          </div>
          <span className={styles.plank} aria-hidden="true" />
        </li>}
        {search && !visibleDecks.length && <li className={`a-empty ${styles.noResult}`}><p className="a-empty-title">没有找到卡组</p></li>}
      </ul>}
      {deleting && <DuoDialog title={`删除「${deleting.name}」？`} onClose={() => { if (!busy) setDeleting(null); }}>
        <p className="duo-muted">卡组配方将被删除，收藏中的卡牌不会减少。{me?.selectedDeckId === deleting.id ? '这是当前出战卡组，删除后需要重新选择。' : ''}</p>
        {actionError && <p className="duo-error" role="alert">{actionError}</p>}
        <div className="duo-dialog-actions">
          <button className="duo-button" disabled={busy} onClick={() => setDeleting(null)}>保留卡组</button>
          <button className="duo-button" disabled={busy} onClick={() => void remove()}>{busy ? '删除中…' : '确认删除'}</button>
        </div>
      </DuoDialog>}
      {dialog && <DuoDialog title={dialog.kind === 'new' ? '新建卡组' : '给卡组取个名字'} onClose={() => { if (!busy) setDialog(null); }}>
        <form noValidate onSubmit={event => void saveName(event)}>
          <label className="duo-field">卡组名称<input autoFocus value={name} disabled={busy} aria-describedby="deck-name-hint" aria-invalid={!!deckNameError(name)} onChange={event => { setName(event.target.value); setActionError(''); }} required /></label>
          <p id="deck-name-hint" className="duo-muted">3–32 个字符，不计首尾空白。</p>
          {actionError && <p className="duo-error" role="alert">{actionError}</p>}
          <div className="duo-dialog-actions">
            <button className="duo-button" type="button" disabled={busy} onClick={() => setDialog(null)}>取消</button>
            <button className="duo-button duo-button-primary" disabled={busy}>{busy ? '保存中…' : dialog.kind === 'new' ? '开始组卡' : '保存名称'}</button>
          </div>
        </form>
      </DuoDialog>}
    </div>
  </div>;
}
