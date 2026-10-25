import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { DuoDialog } from '../duo/DuoDialog';
import { formatGameMoney } from './economyTypes';
import styles from './CoinCollection.module.css';
import { COINS, COIN_COLLECTIONS, COIN_SETS, DEFAULT_COIN_ID, coinById, coinImageFallback } from './coinCatalog';
import type { CoinDefinition } from './coinCatalog';

export interface CoinCollectionProps {
  ownedIds: readonly string[];
  counts?: Readonly<Record<string, number>>;
  equippedId: string;
  pending: boolean;
  onEquip: (coinId: string) => Promise<void>;
}

interface CoinSetInfo {
  id: string;
  name: string;
  priceMinor: number | null;
}

const SHOP_COIN_LINK = '/shop?category=coin';
const SHOP_STARTER_LINK = '/shop?category=starter';
const PAGE_SIZE = 12;
const SERIES_LABELS: Readonly<Record<string, string>> = {
  '30th': '30周年',
  tera: '太晶伊布',
  gift: '卡组附赠',
  legacy: '历代',
};

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true" focusable="false"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.2" y="7.2" width="9.6" height="6.6" rx="1.4" />
      <path d="M5.6 7.2V5.1a2.4 2.4 0 0 1 4.8 0v2.1" />
    </svg>
  );
}

function normalizeSearch(value: string) {
  return value.toLocaleLowerCase().replace(/\s+/g, '');
}

function coinLabel(coin: CoinDefinition) {
  if (coin.seriesId === '30th' && coin.designNumber != null) {
    return `图案 ${String(coin.designNumber).padStart(2, '0')}`;
  }
  if (coin.pokemon) return coin.pokemon;
  return coin.name;
}

export function CoinCollection({ ownedIds, counts, equippedId, pending, onEquip }: CoinCollectionProps) {
  // 初始硬币随账号自带；数量只用于展示，不据此推断其他硬币的所有权。
  const owned = useMemo(() => new Set([...ownedIds, DEFAULT_COIN_ID]), [ownedIds]);
  const ownedKinds = COINS.filter(coin => owned.has(coin.id)).length;
  const equipped = coinById(equippedId || DEFAULT_COIN_ID);
  const initial = coinById(DEFAULT_COIN_ID);
  const albumHeadingId = useId();
  const resultsId = useId();

  function ownedCount(coinId: string) {
    if (!owned.has(coinId)) return 0;
    const count = counts?.[coinId];
    return count != null && Number.isFinite(count) ? Math.max(1, Math.floor(count)) : 1;
  }

  const { albums, setByCoinId, collectionByCoinId } = useMemo(() => {
    const byId = new Map(COINS.map(coin => [coin.id, coin]));
    const setByCoinId = new Map<string, CoinSetInfo>();
    for (const set of COIN_SETS) {
      const info: CoinSetInfo = { id: set.id, name: set.name, priceMinor: set.priceMinor ?? null };
      // coinIds 是随机候选，而不是购买后全部解锁的清单。
      for (const coinId of set.coinIds) setByCoinId.set(coinId, info);
    }
    const collectionByCoinId = new Map<string, string>();
    const albums = COIN_COLLECTIONS.map(collection => {
      for (const coinId of collection.coinIds) collectionByCoinId.set(coinId, collection.name);
      const coins = collection.coinIds.map(id => byId.get(id)).filter((coin): coin is CoinDefinition => coin != null);
      return { ...collection, coins };
    });
    return { albums, setByCoinId, collectionByCoinId };
  }, []);

  const [seriesId, setSeriesId] = useState('30th');
  const [query, setQuery] = useState('');
  const [onlyOwned, setOnlyOwned] = useState(false);
  const [design, setDesign] = useState('');
  const [pokemon, setPokemon] = useState('');
  const [finish, setFinish] = useState('');
  const [page, setPage] = useState(1);
  const album = albums.find(item => item.id === seriesId) ?? albums[0];
  const albumCoins = album?.coins ?? [];
  const albumOwned = albumCoins.filter(coin => owned.has(coin.id)).length;
  const designs = [...new Set(albumCoins.flatMap(coin => coin.designNumber == null ? [] : [coin.designNumber]))].sort((a, b) => a - b);
  const pokemonNames = [...new Set(albumCoins.flatMap(coin => coin.pokemon ? [coin.pokemon] : []))];
  const finishes = [...new Set(albumCoins.map(coin => coin.finish))];
  const needle = normalizeSearch(query.trim());
  const filtered = albumCoins.filter(coin => {
    const searchable = `${coin.name} ${coin.id} ${coin.pokemon ?? ''} ${coin.finish} ${coin.secret ? '隐藏款 金色' : ''} ${coin.designNumber == null ? '' : `${coin.designNumber}号 图案${coin.designNumber}`}`;
    return (!onlyOwned || owned.has(coin.id))
      && (!design || String(coin.designNumber) === design)
      && (!pokemon || coin.pokemon === pokemon)
      && (!finish || coin.finish === finish)
      && (!needle || normalizeSearch(searchable).includes(needle));
  });
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visibleCoins = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const hasFilters = Boolean(query || onlyOwned || design || pokemon || finish);

  function resetFilters() {
    setQuery('');
    setOnlyOwned(false);
    setDesign('');
    setPokemon('');
    setFinish('');
    setPage(1);
  }

  function selectSeries(id: string) {
    setSeriesId(id);
    setQuery('');
    setDesign('');
    setPokemon('');
    setFinish('');
    setPage(1);
  }

  const [detailId, setDetailId] = useState<string | null>(null);
  const [showBack, setShowBack] = useState(false);
  const [flipAnimated, setFlipAnimated] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  /** onEquip 已 resolve、正等 equippedId prop 跟上来的那枚硬币 */
  const [awaitingId, setAwaitingId] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const submittingRef = useRef(false);
  const requestSerial = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; requestSerial.current++; };
  }, []);

  // 服务端确认（equippedId prop 更新）后解除等待。
  useEffect(() => {
    if (awaitingId !== null && awaitingId === equippedId) setAwaitingId(null);
  }, [awaitingId, equippedId]);

  const detail = detailId == null ? null : coinById(detailId);
  const detailSet = detail == null ? null : setByCoinId.get(detail.id) ?? null;
  const detailOwned = detail != null && owned.has(detail.id);
  const detailEquipped = detail != null && detail.id === equippedId;
  const detailBusy = detail != null && (pending || submitting || awaitingId === detail.id);
  const detailCount = detail == null ? 0 : ownedCount(detail.id);
  const detailCollection = detail == null ? null : collectionByCoinId.get(detail.id);
  const detailShop = detail?.seriesId === 'gift'
    ? SHOP_STARTER_LINK
    : detailSet && (detail?.seriesId === '30th' || detail?.seriesId === 'tera') ? SHOP_COIN_LINK : null;
  // 旧素材的 source 仅是数字索引，不可伪装成商品链接。
  const officialSource = detail && /^https:\/\/www\.pokemon\.cn\/tcg\/product\/\d+\.html$/.test(detail.source) ? detail.source : null;

  function openDetail(coinId: string) {
    requestSerial.current++;
    setDetailId(coinId);
    setShowBack(false);
    setError(null);
  }

  function closeDetail() {
    requestSerial.current++;
    setDetailId(null);
    setShowBack(false);
    setError(null);
    setAwaitingId(null);
  }

  async function handleEquip() {
    if (detail == null || !detailOwned || detailEquipped || pending || submittingRef.current || awaitingId === detail.id) return;
    const revision = ++requestSerial.current;
    submittingRef.current = true;
    setError(null);
    setSubmitting(true);
    try {
      await onEquip(detail.id);
      // 不在这里伪造成功：等 equippedId prop 更新后才显示「使用中」。
      if (mountedRef.current && revision === requestSerial.current) setAwaitingId(detail.id);
    } catch (err) {
      if (mountedRef.current && revision === requestSerial.current) {
        setError(err instanceof Error && err.message ? err.message : '没能切换硬币，请稍后再试。');
      }
    } finally {
      submittingRef.current = false;
      if (mountedRef.current) setSubmitting(false);
    }
  }

  const detailNote = detailEquipped
    ? '这枚硬币正在使用，下一场对战以它出场。'
    : detailOwned ? '使用这枚硬币后，下一场对战生效。' : '尚未拥有，可翻面查看。';
  const acquisition = detail?.seriesId === '30th'
    ? '购买对应硬币套装，每套随机获得 2 枚。每枚普通款合计 99%，金色隐藏款合计 1%。本地按普通三色与图案等权、两枚独立模拟；图案单独概率及配装规则未公开，不设盒级保底，可重复获得。'
    : detail?.seriesId === 'tera'
      ? `购买对应${detail.pokemon ?? '宝可梦'}硬币套装，每套随机获得 1 枚。普通款合计 99%，金色隐藏款 1%；9 种普通款在本地等权抽取，可重复获得。`
      : detail?.seriesId === 'gift'
        ? `购买对应的${detail.name.split(' · ')[0]}豪华卡组套装附赠；此前买过对应套装也会自动补发。`
        : detail?.seriesId === 'legacy'
          ? '原有图样保留，尚未核实对应商品，暂不上架。'
          : '初始硬币，随账号附赠。';
  const heroSetName = setByCoinId.get(equipped.id)?.name ?? collectionByCoinId.get(equipped.id) ?? null;

  return (
    <section className={styles.coins} aria-label="硬币收藏">
      <div className={`a-rise ${styles.stage}`} style={{ '--a-delay': '20ms' } as CSSProperties}>
        <button type="button" className={styles.stageCoin} onClick={() => openDetail(equipped.id)} aria-label={`查看${equipped.name}，当前使用`}>
          <img src={equipped.frontImage} alt="" draggable={false} decoding="async" onError={event => coinImageFallback(event)} />
        </button>
        <div className={styles.stageText}>
          <p className={styles.stageStamp}>使用中</p>
          <h3 className={styles.stageName}>{equipped.name}</h3>
          <p className={styles.stageMeta}>
            <span className={styles.finishChip}>{equipped.finish}</span>
            {ownedCount(equipped.id) > 1 && <span className={styles.finishChip}>×{ownedCount(equipped.id)}</span>}
            {heroSetName && <span className={styles.stageSet}>{heroSetName}</span>}
          </p>
          <p className={styles.stageNote}>更换硬币后，下一场对战生效。</p>
        </div>
        <div className={styles.stageAside}>
          <p>已收藏 <strong>{ownedKinds}</strong> / {COINS.length} 种</p>
          <button type="button" className={styles.initialCoin} onClick={() => openDetail(initial.id)} aria-label="查看初始硬币，随账号附赠">
            <img src={initial.frontImage} alt="" loading="lazy" decoding="async" onError={event => coinImageFallback(event)} />
            <span>初始硬币<small>随账号附赠</small></span>
          </button>
        </div>
      </div>

      <section className={styles.album} aria-labelledby={albumHeadingId}>
        <div className={styles.seriesNav} role="group" aria-label="选择硬币系列">
          {albums.map(item => {
            const collected = item.coins.filter(coin => owned.has(coin.id)).length;
            return (
              <button key={item.id} type="button" className={styles.seriesButton}
                aria-pressed={item.id === album?.id} aria-controls={resultsId}
                onClick={() => selectSeries(item.id)}>
                <span>{SERIES_LABELS[item.id] ?? item.name}</span>
                <small>已拥有 {collected} / {item.coins.length}</small>
              </button>
            );
          })}
        </div>
        <div className={styles.albumPaper}>
          <header className={styles.albumHead}>
            <div>
              <h3 id={albumHeadingId} className={styles.albumName}>{album?.name ?? '硬币收藏册'}</h3>
              <p className={styles.albumNote}>{album?.note}</p>
            </div>
            <p className={styles.albumCount}>已拥有 <strong>{albumOwned}</strong> / {albumCoins.length} 种</p>
          </header>
          <div className={styles.filters}>
            <label className={styles.searchField}>
              <span>搜索本系列</span>
              <input type="search" value={query} placeholder="名称、图案编号或工艺" aria-controls={resultsId}
                onChange={event => { setQuery(event.target.value); setPage(1); }} />
            </label>
            {designs.length > 0 && (
              <label className={styles.filterField}>
                <span>图案</span>
                <select value={design} aria-controls={resultsId} onChange={event => { setDesign(event.target.value); setPage(1); }}>
                  <option value="">全部 {designs.length} 种图案</option>
                  {designs.map(number => <option key={number} value={number}>图案 {String(number).padStart(2, '0')}</option>)}
                </select>
              </label>
            )}
            {pokemonNames.length > 0 && (
              <label className={styles.filterField}>
                <span>宝可梦</span>
                <select value={pokemon} aria-controls={resultsId} onChange={event => { setPokemon(event.target.value); setPage(1); }}>
                  <option value="">全部 {pokemonNames.length} 只宝可梦</option>
                  {pokemonNames.map(name => <option key={name} value={name}>{name} · {albumCoins.filter(coin => coin.pokemon === name).length} 款</option>)}
                </select>
              </label>
            )}
            {album?.id !== 'legacy' && (
              <label className={styles.filterField}>
                <span>工艺</span>
                <select value={finish} aria-controls={resultsId} onChange={event => { setFinish(event.target.value); setPage(1); }}>
                  <option value="">全部工艺</option>
                  {finishes.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </label>
            )}
          </div>
          <div className={styles.filterFooter}>
            <label className={styles.ownedToggle}>
              <input type="checkbox" checked={onlyOwned} aria-controls={resultsId}
                onChange={event => { setOnlyOwned(event.target.checked); setPage(1); }} />
              <span>只看已拥有</span>
            </label>
            {hasFilters && <button type="button" className={styles.resetButton} onClick={resetFilters}>清除筛选</button>}
          </div>
        </div>
        <div id={resultsId} className={styles.trayFelt}>
          <p className={styles.resultSummary} role="status">
            {filtered.length === 0 ? '没有符合条件的硬币' : `找到 ${filtered.length} 种 · 第 ${currentPage} / ${pages} 页`}
          </p>
          {visibleCoins.length === 0 ? (
            <div className={styles.empty}>
              <p>{onlyOwned ? '当前条件下还没有已拥有的硬币。' : '试试其他图案、宝可梦或工艺。'}</p>
              <button type="button" className={styles.emptyReset} onClick={resetFilters}>查看本系列全部硬币</button>
            </div>
          ) : (
            <ul className={styles.slots}>
              {visibleCoins.map(coin => {
                const coinOwned = owned.has(coin.id);
                const coinEquipped = coin.id === equippedId;
                const count = ownedCount(coin.id);
                return (
                  <li key={coin.id} className={styles.slotItem}>
                    <button type="button" className={styles.slot}
                      data-state={coinEquipped ? 'equipped' : coinOwned ? 'owned' : 'locked'}
                      onClick={() => openDetail(coin.id)}
                      aria-label={`查看${coin.name}，${coinEquipped ? '使用中' : coinOwned ? '已拥有' : '未拥有'}${count > 1 ? `，拥有 ${count} 枚` : ''}`}>
                      <span className={styles.well} aria-hidden="true">
                        <img src={coin.frontImage} alt="" loading="lazy" decoding="async" width={108} height={108}
                          draggable={false} onError={event => coinImageFallback(event)} />
                        {coinEquipped ? <span className={styles.slotBadge}>使用中</span> : !coinOwned && <span className={styles.lockBadge}><LockIcon /></span>}
                        {count > 1 && <span className={styles.countBadge}>×{count}</span>}
                      </span>
                      <span className={styles.slotName}>{coinLabel(coin)}</span>
                      <span className={styles.slotFinish} data-secret={coin.secret || undefined}>{coin.finish}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {pages > 1 && (
            <nav className={styles.pagination} aria-label="硬币列表分页">
              <button type="button" disabled={currentPage === 1} aria-controls={resultsId} onClick={() => setPage(currentPage - 1)}>上一页</button>
              <span>{currentPage} / {pages}</span>
              <button type="button" disabled={currentPage === pages} aria-controls={resultsId} onClick={() => setPage(currentPage + 1)}>下一页</button>
            </nav>
          )}
        </div>
      </section>

      {detail && (
        <DuoDialog title={detail.name} onClose={closeDetail} className={styles.detailDialog}>
          <div className={styles.detailBody}>
            <div className={styles.viewerStage}>
              <button type="button" className={styles.flipBtn} aria-pressed={showBack}
                aria-label={showBack ? `查看${detail.name}正面` : `查看${detail.name}反面`}
                onClick={event => { setFlipAnimated(event.detail !== 0); setShowBack(value => !value); }}>
                <span className={styles.flipper} data-side={showBack ? 'back' : 'front'} data-instant={!flipAnimated || undefined}>
                  <img className={styles.faceFront} src={detail.frontImage} onError={event => coinImageFallback(event)}
                    alt={`${detail.name}正面`} aria-hidden={showBack} width={423} height={423} draggable={false} />
                  <img className={styles.faceBack} src={detail.backImage} onError={event => coinImageFallback(event, true)}
                    alt={`${detail.name}反面`} aria-hidden={!showBack} width={423} height={423} draggable={false} />
                </span>
              </button>
              <p className={styles.faceHint} aria-live="polite">点击硬币翻面 · 当前{showBack ? '反面' : '正面'}</p>
              <p className={styles.backNote}>收藏册内所有硬币共用同一款背面。</p>
            </div>
            <div className={styles.infoPanel}>
              <p className={styles.statusPlaque} data-state={detailEquipped ? 'equipped' : detailOwned ? 'owned' : 'locked'}>
                {detailEquipped ? '使用中' : detailOwned ? '已拥有' : '未拥有'}{detailCount > 1 ? ` ×${detailCount}` : ''}
              </p>
              <dl className={styles.specs}>
                <div className={styles.specRow}><dt>工艺</dt><dd>{detail.finish}</dd></div>
                {detail.designNumber != null && <div className={styles.specRow}><dt>图案</dt><dd>{String(detail.designNumber).padStart(2, '0')} / 30</dd></div>}
                {detail.pokemon && <div className={styles.specRow}><dt>宝可梦</dt><dd>{detail.pokemon}</dd></div>}
                <div className={styles.specRow}><dt>系列</dt><dd>{detailCollection ?? (detail.id === DEFAULT_COIN_ID ? '开局自带' : '—')}</dd></div>
                <div className={styles.specRow}><dt>背面</dt><dd>硬币通用纹样</dd></div>
              </dl>
              <p className={styles.detailNote}>{detailNote}</p>
              <div className={styles.acquisition}>
                <h4>获取方式</h4>
                {detailSet && <p className={styles.productName}>{detailSet.name}{detailSet.priceMinor != null ? ` · ${formatGameMoney(detailSet.priceMinor)} 游戏元 / 套` : ''}</p>}
                <p>{acquisition}</p>
                {officialSource && <a className={styles.sourceLink} href={officialSource} target="_blank" rel="noreferrer">查看官方商品说明（新窗口）</a>}
              </div>
              {detailShop && <Link className={styles.shopLink} to={detailShop}>{detail.seriesId === 'gift' ? '查看对应豪华卡组' : '查看随机硬币套装'}</Link>}
              {error && <p className={styles.error} role="alert">{error}</p>}
              <div className={styles.actions}>
                {detailOwned && !detailEquipped && (
                  <button type="button" className={styles.useBtn} onClick={handleEquip} disabled={detailBusy}>
                    {detailBusy ? '正在切换…' : '使用这枚'}
                  </button>
                )}
                <button type="button" className={styles.closeBtn} onClick={closeDetail}>关闭</button>
              </div>
            </div>
          </div>
        </DuoDialog>
      )}
    </section>
  );
}
