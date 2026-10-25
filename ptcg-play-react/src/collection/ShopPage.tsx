import { useMemo, useState, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDeckCardScanUrl } from '../context/CardImagesContext';
import { cardDisplayName, cardRarity, chineseCard, isChineseCard } from '../duo/chineseCatalog';
import { DuoDialog } from '../duo/DuoDialog';
import { duoPresets } from '../duo/duoApi';
import { useEconomy, ECONOMY_API_ENABLED } from './EconomyContext';
import { formatGameMoney, type CoinReward, type EconomyOpening, type ShopProduct } from './economyTypes';
import { DeckOpeningStage } from './DeckOpeningStage';
import { PackOpeningStage } from './PackOpeningStage';
import { rarityEffect } from './rarityEffects';
import { onImageError } from '../components/imageFallback';
import styles from './ShopPage.module.css';
import { coinById, coinImageFallback } from './coinCatalog';

function CoinSetArtwork({ ids, cover }: { ids: string[]; cover?: string }) {
  if (cover) return <span className={styles.showBox}>
    <span className={styles.boxEdge} aria-hidden="true" />
    <img className={styles.showBoxFace} src={cover} alt="" loading="lazy" decoding="async" onError={onImageError} />
    <span className={styles.packSheen} aria-hidden="true" />
  </span>;
  return <span className={styles.coinTray}>{ids.slice(0, 3).map(id => <img key={id} src={coinById(id).frontImage} alt="" loading="lazy" onError={event => coinImageFallback(event)} />)}</span>;
}

function coinExamples(ids: readonly string[]): string[] {
  const ordinary = [...new Map(ids.filter(id => !coinById(id).secret).map(id => [coinById(id).finish, id])).values()].slice(0, 3);
  const secret = ids.find(id => coinById(id).secret);
  return secret ? [...ordinary, secret] : ordinary;
}

const kindNames = { booster: '补充包', starter: '预组', party: '对战派对', box: '盒装', coin: '硬币套装' };
/** 货架错峰入场的延迟值，配合全局 a-rise 动画。 */
const rise = (delay: number) => ({ '--a-delay': `${delay}ms` }) as CSSProperties;

export function ShopPage() {
  const economy = useEconomy();
  const { cardsInfo, serverConfig } = useAuth();
  const getScanUrl = useDeckCardScanUrl(serverConfig?.scansUrl);
  const cards = useMemo(() => new Map((cardsInfo?.cards ?? []).map(c => [c.fullName, c])), [cardsInfo]);
  const catalog = useMemo(() => (cardsInfo?.cards ?? []).filter(isChineseCard), [cardsInfo]);
  const [selected, setSelected] = useState<ShopProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category');
  const kindFilter: 'all' | ShopProduct['kind'] = category && Object.hasOwn(kindNames, category) ? category as ShopProduct['kind'] : 'all';
  const setKindFilter = (kind: 'all' | ShopProduct['kind']) => setSearchParams(kind === 'all' ? {} : { category: kind });
  const [opening, setOpening] = useState<{ result: EconomyOpening; preview: boolean } | null>(null);
  const [stockOpen, setStockOpen] = useState(true);
  const [notice, setNotice] = useState('');
  const [coinRewards, setCoinRewards] = useState<CoinReward[]>([]);
  const ready = economy.status === 'ready' && !!economy.snapshot;
  const checkIn = economy.snapshot?.checkIn;
  async function claim() {
    if (!ready || !checkIn || checkIn.claimed || economy.busy) return;
    setNotice('');
    try { await economy.claimCheckIn(); setNotice(`签到成功，+${formatGameMoney(checkIn.rewardMinor)} 游戏元已入账。`); }
    catch { /* Provider reports the server verdict; never adjust a local balance. */ }
  }
  const packs = useMemo(() => {
    const groups = new Map<string, { name: string; ids: string[]; deck: boolean }>();
    for (const pack of economy.snapshot?.packs ?? []) {
      const group = groups.get(pack.productId) ?? { name: pack.name, ids: [], deck: !!pack.deck };
      group.ids.push(pack.id); groups.set(pack.productId, group);
    }
    return [...groups.entries()];
  }, [economy.snapshot]);
  function imageFor(fullName: string, image?: string) {
    const card = cards.get(fullName);
    return image || (card ? getScanUrl(card) : '/assets/duo-cardback.svg');
  }
  /** 未开卡包用该商品的官方卡包图，取不到才退回占位方块。 */
  function coverOf(productId: string): string | undefined {
    return economy.snapshot?.products.find(product => product.id === productId)?.coverImage;
  }
  function previewOpen(count: 1 | 10) {
    if (!catalog.length) return;
    // Curated examples show each available effect tier. Never manufacture rarity or imply odds.
    const pools = (['foil', 'prism', 'crown'] as const).map(tier => catalog.filter(card => rarityEffect(cardRarity(card)) === tier));
    const samples = Array.from({ length: count * 5 }, (_, i) => {
      const pool = i % 5 >= 2 ? pools[i % 5 - 2] : undefined;
      const card = pool?.length ? pool[Math.floor(i / 5) % pool.length] : catalog[(i * 7) % catalog.length];
      const meta = chineseCard(card)!;
      return { printingId: `preview:${card.fullName}`, engineFullName: card.fullName, name: cardDisplayName(card),
        set: meta.set, number: meta.number, rarity: cardRarity(card), count: 1, ownedBefore: 0 };
    });
    setOpening({ result: { id: `preview-${Date.now()}`, cards: samples }, preview: true });
  }
  async function openOwned(ids: string[]) {
    if (economy.busy || !ready) return;
    setNotice('');
    try { setOpening({ result: await economy.openPacks(ids), preview: false }); }
    catch { /* Authoritative error and refresh guidance are supplied by the provider. */ }
  }
  async function buy() {
    if (!selected || !ready || economy.busy) return;
    setNotice('');
    setCoinRewards([]);
    try {
      const rewards = await economy.purchase(selected.id, quantity);
      setCoinRewards(rewards);
      setNotice(selected.kind === 'coin' ? '购买成功，硬币已入收藏，随附物品已同步。' : selected.prebuiltDeck ? `购买成功，卡组和补充包已放进未拆封。${rewards.length ? '附赠硬币已入收藏。' : ''}` : '购买成功，卡牌与未拆封已同步。');
      setSelected(null);
    }
    catch { /* Never deduct a local balance or manufacture cards after an error. */ }
  }
  const products = economy.snapshot?.products ?? [];
  /** Only offer categories the catalogue actually sells, in a stable booster → starter → party → box order. */
  const kinds = useMemo(() => (['booster', 'starter', 'party', 'box', 'coin'] as const).filter(kind => products.some(product => product.kind === kind)), [products]);
  const visibleProducts = kindFilter === 'all' ? products : products.filter(product => product.kind === kindFilter);
  const cost = selected ? selected.priceMinor * quantity : 0;
  const withinLimit = !!selected && (selected.purchaseLimit === null || selected.purchased + quantity <= selected.purchaseLimit);
  const affordable = ready && Number.isSafeInteger(cost) && cost <= economy.snapshot!.balanceMinor;
  const canBuy = !!selected?.available && ready && withinLimit && affordable && !economy.busy;
  /** 商品详情纸面上的规格行：只拼装真实存在的字段。 */
  const detailSpec = selected ? [
    kindNames[selected.kind],
    selected.kind === 'coin' ? `${selected.coinDrawCount ? '随机' : '固定'}硬币 ${selected.coinDrawCount ?? selected.coinIds?.length ?? 0} 枚` : '',
    selected.packCount === undefined ? '' : `${selected.packCount} 包`,
    selected.kind === 'coin' ? `${selected.coinIds?.length ?? 0} 种候选款式` : selected.cardsPerPack === undefined ? '' : `每包 ${selected.cardsPerPack} 张`,
  ].filter(Boolean).join(' · ') : '';
  return <div className={`a-page ${styles.shop}`}>
    <div className="a-wrap">
      <header className={styles.masthead}>
        <div className={styles.mastTitle}>
          <h1 className="a-hero-title">补给站</h1>
          <span className={styles.mastRule} aria-hidden="true" />
        </div>
        <Link to="/collection" className="a-btn-ghost">收藏 →</Link>
      </header>
      {!ECONOMY_API_ENABLED && <section className={`a-rise ${styles.demoBay}`} aria-label="开包体验">
        <div className={styles.demoCopy}>
          <span className={styles.demoBadge}>开包演示 · 不扣款 / 不入收藏</span>
          <div className={styles.demoActions}>
            <button type="button" className="a-btn" disabled={!catalog.length} onClick={() => previewOpen(1)}>剪开一包 ↗</button>
            <button type="button" className={styles.linkBtn} disabled={!catalog.length} onClick={() => previewOpen(10)}>十连体验 →</button>
          </div>
          <small className={styles.demoFine}>展示各稀有度效果 · 非商品规格或出率</small>
        </div>
        <button type="button" className={styles.demoObject} disabled={!catalog.length} onClick={() => previewOpen(1)} aria-label="拆开演示卡包">
          <span className={styles.demoOrbit} aria-hidden="true" />
          <span className={styles.demoPack}>
            <span className={styles.packEdge} aria-hidden="true" />
            <img className={styles.demoPackArt} src="/assets/duo-cardback.svg" alt="" />
            <span className={styles.packSheen} aria-hidden="true" />
          </span>
          <img className={styles.demoCard} src={imageFor(duoPresets[0].cover)} alt="" />
          <span className={styles.demoSeal} aria-hidden="true">✂<small>拆封</small></span>
        </button>
      </section>}
      <section className={`a-rise ${styles.counter}`} style={rise(60)}>
        <div className={styles.register}>
          <span className={styles.coin} aria-hidden="true">币</span>
          <div className={styles.registerRead}>
            <span className={styles.registerLabel}>柜台余额</span>
            <div className={styles.registerAmount}>
              {ready ? <><strong className={styles.registerValue}>{formatGameMoney(economy.snapshot!.balanceMinor)}</strong><small className={styles.registerUnit}>游戏元</small></> : <strong className={styles.registerStatus}>{economy.status === 'error' ? '钱包同步失败' : ECONOMY_API_ENABLED ? '正在同步钱包…' : '商品暂未上架'}</strong>}
            </div>
            <span className={styles.registerNote}>{ready ? '仅游戏内货币' : ECONOMY_API_ENABLED ? '等待服务器同步' : '可先体验开包演示'}</span>
          </div>
        </div>
        <div className={styles.counterSide}>
          {ready && checkIn && (checkIn.claimed ? <span className={styles.checkInDone} role="status">今日已签到</span> : <button type="button" className={`a-btn ${styles.checkInBtn}`} disabled={economy.busy} onClick={() => void claim()}>每日签到 +{formatGameMoney(checkIn.rewardMinor)} 游戏元</button>)}
          {economy.status !== 'pending' && <button type="button" className={styles.linkBtn} disabled={economy.busy} onClick={() => void economy.refresh()}>重新同步</button>}
        </div>
      </section>
      {economy.error && <p className={styles.alertNote} role="alert">{economy.error}</p>}
      {notice && <p className={styles.receiptNote} role="status">{notice} {notice.includes('硬币') && <Link to="/collection?tab=coins">查看硬币收藏</Link>}</p>}
      {coinRewards.length > 0 && <section className={styles.coinReceipt} aria-label="本次获得的硬币" role="status">
        <h2>本次获得的硬币</h2>
        <ul>{coinRewards.map(reward => <li key={reward.coinId}>
          <img src={coinById(reward.coinId).frontImage} alt="" onError={event => coinImageFallback(event)} />
          <span><strong>{coinById(reward.coinId).name}</strong><small>{reward.ownedBefore === 0 ? '新入收藏' : '重复获得'} · +{reward.count} 枚 · 共 {reward.ownedBefore + reward.count} 枚</small></span>
        </li>)}</ul>
        <Link to="/collection?tab=coins" className="a-btn-ghost">查看或使用硬币</Link>
      </section>}
      {/* 未拆封：卡包与预组都先在这里；预组拆开才知道抽到哪一套 */}
      <details className={`a-rise ${styles.stockDetails}`} style={rise(100)} open={stockOpen}
        onToggle={event => setStockOpen(event.currentTarget.open)}>
        <summary className={styles.stockSummary}>
          <span className={styles.stockCaret} aria-hidden="true" />
          <span className={styles.stockTitle}>未拆封</span>
          <span className={styles.stockBadge}>{ready ? `${economy.snapshot!.packs.length} 件` : '数量待同步'}</span>
          <span className={styles.stockSub}>拆开后才进收藏</span>
        </summary>
        <div className={styles.stockBody}>
          {packs.length ? <div className={styles.case}>
            <div className={styles.caseInner}>
              {packs.map(([id, pack], index) => <article key={id} className={`a-rise ${styles.packGroup}`} style={rise(140 + Math.min(index * 70, 280))}>
                <button type="button" className={styles.packHit} disabled={!ready || economy.busy} onClick={() => void openOwned(pack.ids.slice(0, 1))} aria-label={pack.deck ? `拆开一件预组：${pack.name}` : `拆开一包：${pack.name}`}>
                  <span className={styles.packStack}>
                    <span className={styles.packBehind} aria-hidden="true" />
                    <span className={styles.packBehindSecond} aria-hidden="true" />
                    <span className={styles.packEdge} aria-hidden="true" />
                    {coverOf(id) ? <img className={styles.packFace} src={coverOf(id)} alt="" onError={onImageError} /> : <span className={styles.packFaceFallback} aria-hidden="true" />}
                    <span className={styles.packSheen} aria-hidden="true" />
                    {pack.deck && <span className={styles.packRibbon} aria-hidden="true">预组</span>}
                  </span>
                  <span className={styles.packCount} aria-hidden="true">{pack.ids.length}</span>
                </button>
                <div className={styles.packMeta}>
                  <strong className={styles.packName}>{pack.name}</strong>
                  <small className={styles.packSub}>{pack.deck ? `${pack.ids.length} 套未拆` : `${pack.ids.length} 包未开`}</small>
                  <div className={styles.packActions}>
                    {pack.deck
                      ? <button type="button" className={`a-btn ${styles.packBtn}`} disabled={!ready || economy.busy} onClick={() => void openOwned(pack.ids.slice(0, 1))}>拆开一套</button>
                      : <>
                        <button type="button" className={`a-btn-ghost ${styles.packBtn}`} disabled={!ready || economy.busy} onClick={() => void openOwned(pack.ids.slice(0, 1))}>拆 1 包</button>
                        {pack.ids.length > 1 && <button type="button" className={`a-btn ${styles.packBtn}`} disabled={!ready || economy.busy} onClick={() => void openOwned(pack.ids.slice(0, 10))}>拆 {Math.min(10, pack.ids.length)} 包</button>}
                      </>}
                  </div>
                </div>
              </article>)}
            </div>
            <span className={styles.caseGlass} aria-hidden="true" />
          </div> : <p className={styles.stockEmpty}>{ready ? '还没买卡包或预组' : ECONOMY_API_ENABLED ? '未拆封等待同步' : '库存待接入 · 演示包不计入库存'}</p>}
        </div>
      </details>
      <section className={styles.goodsSection} aria-label="商品陈列">
        <div className="a-section">
          <h2 className="a-section-title">商品陈列</h2>
        </div>
        {kinds.length > 1 && <div className={`a-rise ${styles.controls}`} style={rise(120)}>
          <div className={styles.shelfLabels} role="group" aria-label="商品类别">
            <button type="button" className={styles.shelfLabel} aria-pressed={kindFilter === 'all'} onClick={() => setKindFilter('all')}>全部商品</button>
            {kinds.map(kind => <button type="button" key={kind} className={styles.shelfLabel} aria-pressed={kindFilter === kind} onClick={() => setKindFilter(kind)}>{kindNames[kind]}</button>)}
          </div>
          <span className={styles.count}>{visibleProducts.length} 件</span>
        </div>}
        {visibleProducts.length ? <div className={styles.bins}>
          {visibleProducts.map((product, index) => {
            const offShelf = !product.available;
            const limitReached = product.purchaseLimit !== null && product.purchased >= product.purchaseLimit;
            return <div key={product.id} className={`a-rise ${styles.binRise}`} style={rise(160 + Math.min(index * 45, 300))}>
              {/* 整格即详情入口：只打开详情，绝不直接购买；售罄/限购达标也允许查看。 */}
              <button type="button" className={styles.binButton} onClick={() => { setSelected(product); setQuantity(1); }}
                aria-label={`查看商品详情：${product.name}，${formatGameMoney(product.priceMinor)} 游戏元${offShelf ? '，暂未上架' : limitReached ? '，已达限购' : ''}`}>
                <span className={styles.binStage} data-kind={product.kind} data-unavailable={offShelf || undefined}>
                  <span className={styles.binShow} aria-hidden="true">
                    <span className={styles.showShadow} />
                    {product.kind === 'coin' ? <CoinSetArtwork ids={product.coinIds ?? []} cover={product.coverImage} /> : (product.kind === 'starter' || product.kind === 'box') ? <span className={styles.showBox}>
                      <span className={styles.boxEdge} aria-hidden="true" />
                      <img className={styles.showBoxFace} src={product.coverImage ?? '/assets/duo-cardback.svg'} alt="" onError={onImageError} />
                      <span className={styles.packSheen} aria-hidden="true" />
                    </span> : <span className={styles.showPack}>
                      <span className={styles.packEdge} aria-hidden="true" />
                      <img className={styles.showPackFace} src={product.coverImage ?? '/assets/duo-cardback.svg'} alt="" onError={onImageError} />
                      <span className={styles.packSheen} aria-hidden="true" />
                    </span>}
                  </span>
                  <span className={styles.priceTag} aria-hidden="true"><strong>{formatGameMoney(product.priceMinor)}</strong><small>游戏元</small></span>
                  {product.purchaseLimit !== null && <span className={styles.limitStamp} aria-hidden="true">已购 {product.purchased}/{product.purchaseLimit}</span>}
                  {(offShelf || limitReached) && <span className={styles.binChip} aria-hidden="true">{offShelf ? '暂未上架' : '已达限购'}</span>}
                </span>
                <span className={styles.binName}>{product.name}</span>
              </button>
            </div>;
          })}
        </div> : ready ? <p className={styles.stockEmpty}>这个类别暂时没有商品。</p> : null}
      </section>
      {selected && <DuoDialog title={selected.name} className={styles.dialog} onClose={() => { if (!economy.busy) setSelected(null); }}>
        <div className={styles.detailBody}>
          <div className={styles.detailStage} data-kind={selected.kind} data-unavailable={!selected.available || undefined}>
            <span className={styles.detailShow} aria-hidden="true">
              <span className={styles.showShadow} />
              {selected.kind === 'coin' ? <CoinSetArtwork ids={selected.coinIds ?? []} cover={selected.coverImage} /> : (selected.kind === 'starter' || selected.kind === 'box') ? <span className={styles.showBox}>
                <span className={styles.boxEdge} aria-hidden="true" />
                <img className={styles.showBoxFace} src={selected.coverImage ?? '/assets/duo-cardback.svg'} alt="" onError={onImageError} />
                <span className={styles.packSheen} aria-hidden="true" />
              </span> : <span className={styles.showPack}>
                <span className={styles.packEdge} aria-hidden="true" />
                <img className={styles.showPackFace} src={selected.coverImage ?? '/assets/duo-cardback.svg'} alt="" onError={onImageError} />
                <span className={styles.packSheen} aria-hidden="true" />
              </span>}
            </span>
            <span className={styles.priceTag} aria-hidden="true"><strong>{formatGameMoney(selected.priceMinor)}</strong><small>游戏元</small></span>
            {!selected.available && <span className={styles.binChip} aria-hidden="true">暂未上架</span>}
          </div>
          <div className={styles.detailPaper}>
            <span className={styles.detailSpec}>{detailSpec}</span>
            {selected.description.split(/\n+/).filter(paragraph => paragraph.trim()).map((paragraph, index) => <p key={index} className={styles.detailDesc}>{paragraph}</p>)}
            {selected.coinIds?.length ? <div className={styles.coinContents}>
              <p>{selected.coinDrawCount ? `以下为候选款式示例，每套随机获得 ${selected.coinDrawCount} 枚，并非获得全部 ${selected.coinIds.length} 款。` : '购买附赠以下硬币：'}</p>
              <div className={styles.coinSamples}>{coinExamples(selected.coinIds).map(id => <figure key={id}><img src={coinById(id).frontImage} alt={coinById(id).name} loading="lazy" onError={event => coinImageFallback(event)} /><figcaption>{coinById(id).finish}</figcaption></figure>)}</div>
              <Link to="/collection?tab=coins">查看完整硬币图鉴</Link>
            </div> : null}
            {selected.purchaseLimit !== null && <p className={styles.detailLimit}>每人限购 {selected.purchaseLimit} 件 · 已购 {selected.purchased} 件</p>}
            {selected.rulesNote && <p className={styles.detailRules}>{selected.rulesNote}</p>}
            {selected.prebuiltDeck && <p className={styles.detailPre}>购买后先放进「未拆封」，拆开才知道抽到哪一套。随机封入款可重复购买，按等概率抽取。</p>}
            {!selected.available && <p className={styles.detailOff} role="note">{selected.unavailableReason || '该商品暂时无法购买，商品信息仍可查看。'}</p>}
          </div>
        </div>
        <div className={styles.dock}>
          <div className={styles.dockRow}>
            <label className={styles.qtyField}>购买数量<select className={styles.qtySelect} value={quantity} disabled={economy.busy} onChange={event => setQuantity(Number(event.target.value))}><option value={1}>1 件</option>{(selected.kind === 'booster' || selected.kind === 'coin') && <option value={10}>10 件（不是一盒）</option>}</select></label>
            <p className={styles.purchaseTotal}>合计 <strong>{formatGameMoney(cost)} 游戏元</strong></p>
          </div>
          {(!withinLimit || !affordable) && <p className="duo-error" role="alert">{!withinLimit ? '这次购买会超出商品限购次数。' : '游戏元不足。'}</p>}
          {economy.error && <p className="duo-error" role="alert">{economy.error}</p>}
          <div className="duo-dialog-actions">
            <button type="button" className="a-btn-ghost" disabled={economy.busy} onClick={() => setSelected(null)}>先不买</button>
            <button type="button" className="a-btn" disabled={!canBuy} onClick={() => void buy()}>{economy.busy ? '正在核对购买…' : '确认用游戏元购买'}</button>
          </div>
        </div>
      </DuoDialog>}
      {opening && (opening.result.kind === 'deck'
        ? <DeckOpeningStage opening={opening.result} boxArt={coverOf(opening.result.productId)} imageFor={imageFor} onClose={() => setOpening(null)} />
        : <PackOpeningStage key={opening.result.id} opening={opening.result} preview={opening.preview} imageFor={imageFor} onClose={() => setOpening(null)} />)}
    </div>
  </div>;
}
