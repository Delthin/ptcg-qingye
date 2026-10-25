import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FREE_BASIC_ENERGIES, canonicalFreePrintingId, type Card } from 'ptcg-server';
import { defaultEnergyCard } from '../deck-editor/energyPrintings';
import { useAuth } from '../context/AuthContext';
import { useDeckCardScanUrl } from '../context/CardImagesContext';
import { cardDisplayName, cardPattern, cardRarity, chineseCard, isChineseCard, rarityLabel } from '../duo/chineseCatalog';
import { DuoDialog } from '../duo/DuoDialog';
import { isBasicEnergy } from '../deck-editor/deckRules';
import { useEconomy } from './EconomyContext';
import { CoinCollection } from './CoinCollection';
import styles from './CollectionPage.module.css';
import cardSetNames from './cardSetNames.json';

// 来源名称取自 data/source/ptcg_chs_infos.json 的商品目录；缺少映射时不以卡内编号代替。
const sourceName = (set: string) => (cardSetNames as Record<string, string>)[set] ?? '来源待同步';
type Entry = { id: string; fullName: string; name: string; set: string; source: string; number: string; rarity?: string; image: string; count: number | null; free: boolean; supported: boolean };

/** 把稀有度标签归入卡册的六档配色，只影响卡槽描边与辉光，不参与任何筛选逻辑。 */
function rarityTier(rarity?: string): string {
  const value = rarity ?? '';
  if (/SAR|大师球纹样|★★/.test(value)) return 'secret';
  if (/SR|★|ACE/.test(value)) return 'ultra';
  if (/RR|精灵球纹样/.test(value)) return 'holo';
  if (/^R$|皮卡丘|经典卡/.test(value)) return 'rare';
  if (/^U$|●/.test(value)) return 'uncommon';
  return 'common';
}

export function CollectionPage() {
  const { cardsInfo, serverConfig, user } = useAuth();
  const economy = useEconomy();
  const [params, setParams] = useSearchParams();
  const showCoins = params.get('tab') === 'coins';
  const getScanUrl = useDeckCardScanUrl(serverConfig?.scansUrl);
  const ready = economy.status === 'ready' && !!economy.snapshot;
  const [catalogView, setCatalogView] = useState(false);
  const [search, setSearch] = useState('');
  const [rarity, setRarity] = useState('');
  const [limit, setLimit] = useState(80);
  const [selected, setSelected] = useState<Entry | null>(null);
  const engineCards = useMemo(() => new Map((cardsInfo?.cards ?? []).map(card => [card.fullName, card])), [cardsInfo]);
  const entries = useMemo<Entry[]>(() => {
    if (ready && !catalogView) return economy.snapshot!.holdings.map(p => {
      const engine = engineCards.get(p.engineFullName ?? '');
      return { id: p.printingId, fullName: p.engineFullName ?? '', name: p.name, set: p.set, source: sourceName(p.set), number: p.number, rarity: rarityLabel(p.rarity, p.pattern),
        image: p.image || (engine ? getScanUrl(engine) : '/assets/duo-cardback.svg'), count: p.count, free: !!canonicalFreePrintingId(p.printingId), supported: !!engine };
    });
    const defaults = FREE_BASIC_ENERGIES.flatMap(p => {
      const card = engineCards.get(p.engineFullName);
      return card ? [{ id: p.printingId, fullName: card.fullName, name: p.name, set: '免费默认', source: '免费默认', number: '',
        image: getScanUrl(defaultEnergyCard(card)), count: 0, free: true, supported: true }] : [];
    });
    const collectible = (economy.snapshot?.basicEnergyPrintings || []).filter(p => !canonicalFreePrintingId(p.printingId)).map(p => ({
      id: p.printingId, fullName: p.engineFullName || '', name: p.name, set: p.set, source: sourceName(p.set), number: p.number,
      rarity: rarityLabel(p.rarity, p.pattern), image: p.image || '/assets/duo-cardback.svg',
      count: ready ? economy.snapshot!.holdings.find(h => h.printingId === p.printingId)?.count || 0 : null,
      free: false, supported: !!p.engineFullName && engineCards.has(p.engineFullName),
    }));
    const ordinary = (cardsInfo?.cards ?? []).filter(c => isChineseCard(c) && !isBasicEnergy(c)).map((card: Card) => {
      const meta = chineseCard(card)!;
      return { id: card.fullName, fullName: card.fullName, name: cardDisplayName(card), set: meta.set, source: sourceName(meta.set), number: meta.number,
        rarity: rarityLabel(cardRarity(card), cardPattern(card)), image: getScanUrl(card), count: ready ? economy.ownedCounts.get(card.fullName) ?? 0 : null, free: false, supported: true };
    });
    return [...ordinary, ...defaults, ...collectible];
  }, [ready, catalogView, economy.snapshot, economy.ownedCounts, engineCards, cardsInfo, getScanUrl]);
  const rarities = useMemo(() => [...new Set(entries.flatMap(e => e.rarity ? [e.rarity] : []))].sort(), [entries]);
  const filtered = useMemo(() => entries.filter(e => (!rarity || e.rarity === rarity) &&
    [e.name, e.fullName, e.set, e.source, e.number].join(' ').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())), [entries, rarity, search]);
  useEffect(() => { setLimit(80); }, [search, rarity, catalogView]);
  const total = ready ? economy.snapshot!.holdings.reduce((sum, p) => sum + p.count, 0) : null;
  const distinct = ready ? economy.snapshot!.holdings.filter(p => p.count > 0).length : 0;
  const catalogSize = (cardsInfo?.cards ?? []).filter(isChineseCard).length;
  const progress = catalogSize ? Math.min(100, Math.round(distinct / catalogSize * 100)) : 0;
  return <div className="a-page"><div className="a-wrap">
    <header className={`a-rise ${styles.heading}`}>
      <div>
        <p className="a-hero-sub">CARD ARCHIVE / 03</p>
        <h1 className="a-hero-title">我的收藏</h1>
      </div>
      <Link className="a-btn-ghost" to="/deck">卡组 →</Link>
    </header>

    <div className={styles.collectionKinds} role="group" aria-label="收藏类别">
      <button type="button" aria-pressed={!showCoins} onClick={() => { setSelected(null); setParams({}); }}>卡牌</button>
      <button type="button" aria-pressed={showCoins} onClick={() => { setSelected(null); setParams({ tab: 'coins' }); }}>硬币</button>
    </div>

    {showCoins ? <>
      {economy.error && <p className={styles.errorNote} role="alert">{economy.error}<button className={styles.resync} onClick={() => void economy.refresh()}>重新同步</button></p>}
      {ready && economy.snapshot!.userId === user?.userId && economy.snapshot!.coins
        ? <CoinCollection key={user.userId} ownedIds={economy.snapshot!.coins!.ownedIds} equippedId={economy.snapshot!.coins!.equippedId} counts={economy.snapshot!.coins!.counts} pending={economy.busy} onEquip={economy.equipCoin} />
        : <section className="a-empty" aria-busy={economy.status === 'loading'}><h2 className="a-empty-title">{economy.status === 'loading' ? '正在同步硬币收藏…' : '硬币收藏暂不可用'}</h2><p className="a-empty-note">{ready ? '服务端尚未提供硬币收藏，请更新服务端后重试。' : '连接收藏服务后，可以查看和切换你拥有的硬币。'}</p><button className="a-btn" disabled={economy.busy} onClick={() => void economy.refresh()}>重新同步</button></section>}
    </> : <>
    <section className={`a-rise ${styles.bookplate}`}  style={{ '--a-delay': '70ms' } as CSSProperties}>
      <span className={styles.seal} aria-hidden="true"><i className={styles.sealBall} /></span>
      <div className={styles.bookplateMain}>
        <p className={styles.collector}>EX LIBRIS · {user?.name ?? '训练家'}</p>
        <strong className={styles.tally}>{ready ? `${distinct} 种 · ${total} 张` : '卡牌目录'}</strong>
        <p className={styles.bookplateNote}>{ready ? '个人收藏 · 按印刷版本' : '当前浏览卡牌目录，非个人库存'}</p>
        {ready && catalogSize > 0 && <div className={styles.progressRow} role="progressbar" aria-label="收藏进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <span className={styles.progress}><i className={styles.progressFill} style={{ width: `${progress}%` }} /></span>
          <span className={styles.progressLabel}>收录 {progress}% · {Math.min(distinct, catalogSize)}/{catalogSize}</span>
        </div>}
      </div>
      <Link to="/shop" className={`a-btn ${styles.shopLink}`}>商店 ↗</Link>
      <i className={styles.corner} aria-hidden="true" data-p="tl" />
      <i className={styles.corner} aria-hidden="true" data-p="tr" />
      <i className={styles.corner} aria-hidden="true" data-p="bl" />
      <i className={styles.corner} aria-hidden="true" data-p="br" />
    </section>

    {economy.error && <p className={`a-rise ${styles.errorNote}`} role="alert">{economy.error}<button className={styles.resync} onClick={() => void economy.refresh()}>重新同步</button></p>}

    <div className={`a-rise ${styles.album}`} style={{ '--a-delay': '140ms' } as CSSProperties}>
      <div className={styles.book}>
        <div className={styles.tabs} role="group" aria-label="收藏范围">
          <button type="button" className={styles.tab} disabled={!ready} aria-pressed={ready && !catalogView} onClick={() => setCatalogView(false)}>已拥有</button>
          <button type="button" className={styles.tab} aria-pressed={!ready || catalogView} onClick={() => setCatalogView(true)}>卡牌目录</button>
        </div>
        <section className={styles.paper} key={catalogView ? 'catalog' : 'owned'} aria-label={catalogView || !ready ? '卡牌目录' : '已拥有'}>
          <span className={styles.rings} aria-hidden="true"><i /><i /><i /></span>
          <i className={styles.corner} aria-hidden="true" data-p="tl" />
          <i className={styles.corner} aria-hidden="true" data-p="tr" />
          <i className={styles.corner} aria-hidden="true" data-p="bl" />
          <i className={styles.corner} aria-hidden="true" data-p="br" />

          <div className={styles.filters}>
            <label className={styles.search}>
              <span className={styles.srOnly}>搜索收藏卡牌</span>
              <input className="a-input" type="search" placeholder="找一张卡 · 名称或编号" value={search} onChange={event => setSearch(event.target.value)} />
            </label>
            <label className={styles.raritySelect}>
              <span className={styles.srOnly}>稀有度</span>
              <select className={styles.select} aria-label="稀有度筛选" value={rarity} onChange={event => setRarity(event.target.value)}>
                <option value="">全部稀有度</option>
                {rarities.map(r => <option value={r} key={r}>{r}</option>)}
              </select>
            </label>
            <span className={styles.resultCount}>{filtered.length} 种</span>
          </div>

          {filtered.length ? <div className={styles.grid}>{filtered.slice(0, limit).map((entry, index) => {
            const tier = rarityTier(entry.rarity);
            const owned = entry.free || entry.count === null || entry.count > 0;
            const shiny = tier === 'holo' || tier === 'ultra' || tier === 'secret';
            return <button type="button" className={`a-rise ${styles.pocket}`} style={{ '--a-delay': `${Math.min(index % 20, 17) * 45}ms` } as CSSProperties}
              data-tier={tier} data-owned={owned} key={entry.id} onClick={() => setSelected(entry)} aria-label={`查看 ${entry.name}，${entry.source}`} >
              <span className={styles.pocketWell}>
                <img className={styles.pocketArt} src={entry.image} alt={entry.name} loading="lazy" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/assets/duo-cardback.svg'; }} />
                {shiny && <i className={styles.holo} aria-hidden="true" />}
                <i className={styles.sheen} aria-hidden="true" />
              </span>
              <span className={styles.pocketCaption}>
                <strong>{entry.name}</strong>
                <span>
                  <span className={styles.sourceLabel} title={entry.source}>{entry.source}</span>
                  <i>{entry.rarity ?? '待同步'}</i>
                  <span className={styles.countPlate}>{entry.free ? '免费' : entry.count === null ? '持有 —' : `× ${entry.count}`}</span>
                </span>
              </span>
            </button>;
          })}</div> : <div className={`a-empty ${styles.empty}`}>
            <span className={styles.emptyMark} aria-hidden="true"><span className="duo-ball" /></span>
            <h2 className="a-empty-title">{search || rarity ? '无匹配结果' : '这本册子还空着'}</h2>
            <p className="a-empty-note">{search || rarity ? '换个关键词或稀有度，再翻一页试试。' : '卡槽都在等第一张卡——去商店拆几包，插进最近的口袋。'}</p>
            {search || rarity ? <button className="a-btn" onClick={() => { setSearch(''); setRarity(''); }}>清除筛选</button> : <Link to="/shop" className="a-btn">去商店</Link>}
          </div>}

          {filtered.length > limit && <div className={styles.pageFoot}>
            <button className="a-btn" onClick={() => setLimit(n => n + 80)}>继续翻卡册 · 还有 {filtered.length - limit} 种</button>
          </div>}
        </section>
      </div>
    </div>

    </>}
    {selected && !showCoins && <DuoDialog title={selected.name} className={styles.detailDialog} onClose={() => setSelected(null)}>
      <div className={styles.printingDetail}>
        <div className={styles.printingStage}>
          <img src={selected.image} alt={selected.name} />
        </div>
        <div className={styles.printingInfo}>
          <span className={styles.rarityBadge}>{selected.rarity ?? '稀有度待同步'}</span>
          <p>来源：{selected.source}</p>
          <strong className={styles.countPlaque}>{selected.free ? '基础能量 · 免费使用' : selected.count === null ? '持有数量待接入' : `持有 ${selected.count} 张`}</strong>
          <p className={styles.dialogNote}>{selected.supported ? '同一批卡可以用于多套卡组；同名数量规则仍按对战效果核对。' : '这张卡暂时无法用于对战，请先不要加入卡组使用。'}</p>
        </div>
      </div>
      <div className={styles.dialogActions}>
        <button className="a-btn-ghost" onClick={() => setSelected(null)}>关闭</button>
        <Link className="a-btn" to="/deck">前往卡组管理</Link>
      </div>
    </DuoDialog>}
  </div></div>;
}
