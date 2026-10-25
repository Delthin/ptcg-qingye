// Development-only in-memory API fixture. No login, tokens, sockets, database or real /v1 requests.
import { useEffect, useState, type ContextType } from 'react';
import { createRoot } from 'react-dom/client';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { GameLog, type UserInfo } from 'ptcg-server';
import '../src/i18n/i18n';
import '@fontsource/orbitron/latin-800.css';
import '@fontsource/urbanist/latin-600.css';
import '@fontsource/urbanist/latin-700.css';
import '@fontsource/urbanist/latin-800.css';
import '@fontsource/zcool-qingke-huangyou/chinese-simplified-400.css';
import '../src/styles/fonts.css';
import '../src/styles/design-system.css';
import '../src/styles/arena.css';
import '../src/index.css';
import '../src/duo/duo.css';
import { AuthContext } from '../src/context/AuthContext';
import layoutStyles from '../src/components/AppLayout.module.css';
import { EconomyProvider } from '../src/collection/EconomyContext';
import { CollectionPage } from '../src/collection/CollectionPage';
import { ShopPage } from '../src/collection/ShopPage';
import { COIN_SETS, DEFAULT_COIN_ID, coinById } from '../src/collection/coinCatalog';
import type { CoinReward, EconomySnapshot } from '../src/collection/economyTypes';
import coinPrintings from '../../ptcg-server/src/economy/coin-printings.json';
import { BoardCoinFlip } from '../src/table/board2d/BoardCoinFlip';
import { CoinReview3D } from './coin-review-3d';
import type { LocalGameState } from '../src/table/types/localGameState';

const makeSnapshot = (): EconomySnapshot => ({ version: 1, userId: 101, balanceMinor: 120000, holdings: [], packs: [], transactions: [],
  coins: { ownedIds: [DEFAULT_COIN_ID], equippedId: DEFAULT_COIN_ID, counts: { [DEFAULT_COIN_ID]: 1 } }, checkIn: { day: '2026-10-15', lastClaimDay: null, claimed: false, rewardMinor: 1000 },
  products: COIN_SETS.map(set => ({ ...set, kind: 'coin', coinIds: [...set.coinIds], coinDrawCount: set.coinDraw.count,
    packCount: set.includedPacks.reduce((count, pack) => count + pack.count, 0), cardsPerPack: 0, purchaseLimit: null,
    purchased: 0, available: true })) });
let state = makeSnapshot();
const requests: { path: string; body?: unknown }[] = [];
let failNext = false;
let holdNext = false;
let release: (() => void) | undefined;
let nextDraw: string[] | undefined;
let packSerial = 0;
const originalFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, location.origin);
  if (!url.pathname.startsWith('/v1/')) return originalFetch(input, init);
  const path = url.pathname, body = init?.body ? JSON.parse(String(init.body)) : undefined;
  requests.push({ path, body });
  if (holdNext) { holdNext = false; await new Promise<void>(resolve => { release = resolve; }); }
  if (failNext) { failNext = false; return Response.json({ error: '模拟请求失败' }, { status: 503 }); }
  if (path === '/v1/duo/economy' && (!init?.method || init.method === 'GET')) return Response.json(state);
  if (path === '/v1/duo/economy/purchase') {
    const product = state.products.find(p => p.id === body.productId);
    const definition = COIN_SETS.find(set => set.id === body.productId);
    if (!product || !definition || !product.available || !Number.isInteger(body.quantity) || body.quantity < 1 || body.quantity > 10 || product.priceMinor * body.quantity > state.balanceMinor) return Response.json({ error: '模拟购买校验失败' }, { status: 400 });
    // Deterministic UI fixture, NOT the production probability implementation.
    const draw = nextDraw ?? Array.from({ length: definition.coinDraw.count * body.quantity }, (_, n) => definition.coinDraw.groups[n % 2].coinIds[0]);
    nextDraw = undefined;
    if (draw.length !== definition.coinDraw.count * body.quantity || draw.some(id => !definition.coinIds.includes(id))) throw new Error('Invalid deterministic fixture draw');
    const counts = { ...state.coins!.counts! };
    const rewards: CoinReward[] = [];
    for (const coinId of draw) {
      const row = rewards.find(reward => reward.coinId === coinId);
      if (row) row.count++; else rewards.push({ coinId, count: 1, ownedBefore: counts[coinId] ?? 0 });
      counts[coinId] = (counts[coinId] ?? 0) + 1;
    }
    const holdings = state.holdings.map(row => ({ ...row }));
    for (const fixed of definition.fixedCards) {
      const existing = holdings.find(row => row.printingId === fixed.printingId);
      if (existing) existing.count += fixed.count * body.quantity;
      else holdings.push({ ...coinPrintings.find(row => row.printingId === fixed.printingId)!, count: fixed.count * body.quantity });
    }
    const packs = [...state.packs];
    for (const pack of definition.includedPacks) for (let n = 0; n < pack.count * body.quantity; n++) packs.push({ id: String(++packSerial).padStart(32, '0'), productId: pack.productId, name: pack.productId === '30th-6' ? '30周年庆典 · 6张装' : '太晶盛聚 · 10张装' });
    state = { ...state, balanceMinor: state.balanceMinor - product.priceMinor * body.quantity, holdings, packs,
      coins: { ...state.coins!, ownedIds: Object.keys(counts), counts },
      products: state.products.map(p => p === product ? { ...p, purchased: p.purchased + body.quantity } : p) };
    return Response.json({ snapshot: state, coinRewards: rewards });
  }
  if (path === '/v1/duo/economy/coins/equip') {
    if (!state.coins!.ownedIds.includes(body.coinId)) return Response.json({ error: '未拥有' }, { status: 400 });
    state = { ...state, coins: { ...state.coins!, equippedId: body.coinId } };
    return Response.json({ snapshot: state });
  }
  throw new Error(`Fixture blocked unexpected API: ${path}`);
};
const auth: NonNullable<ContextType<typeof AuthContext>> = { user: { userId: 101, name: '本地演示账户' } as UserInfo,
  token: null, cardsInfo: null, serverConfig: null, ready: true, apiUrlInput: '', isAuthenticated: true,
  login: async () => {}, register: async () => {}, logout: () => {}, setApiUrlOverride: () => {}, refreshSession: async () => {} };
const makeGame = (localId: number) => ({ localId, logs: [], state: { players: [
  { id: 1, name: '演示玩家', coinId: state.coins!.equippedId }, { id: 2, name: '对手', coinId: 'lugia-moon' }
] } } as unknown as LocalGameState);
function Fixture() {
  const [game, setGame] = useState(() => makeGame(1));
  const [generation, setGeneration] = useState(0);
  const startMatch = () => setGame(previous => makeGame(previous.localId + 1));
  const flip = (heads: boolean, actor = 1) => setGame(previous => ({ ...previous, logs: [...previous.logs,
    { id: (previous.logs.at(-1)?.id ?? 0) + 1, client: actor, timestamp: Date.now(), message: heads ? GameLog.LOG_PLAYER_FLIPS_HEADS : GameLog.LOG_PLAYER_FLIPS_TAILS,
      params: { name: actor === 1 ? '演示玩家' : '对手' } } ] }));
  useEffect(() => {
    Object.assign(window, { __coinReview: { requests, get snapshot() { return state; }, get game() { return game; },
      failNext: () => { failNext = true; }, holdNext: () => { holdNext = true; }, release: () => { release?.(); release = undefined; },
      reset: () => { release?.(); release = undefined; failNext = holdNext = false; state = makeSnapshot(); requests.length = 0; setGeneration(value => value + 1); setGame(makeGame(game.localId + 1)); },
      seedFirstSet: () => { state = makeSnapshot(); const ids = ['30th-pikachu-01-blue', '30th-pikachu-30-gold', 'tera-eevee-secret', '30th-deluxe-espeon']; state.coins!.ownedIds.push(...ids); for (const id of ids) state.coins!.counts![id] = id.endsWith('-blue') ? 3 : 1; setGeneration(value => value + 1); },
      setNextDraw: (ids: string[]) => { nextDraw = [...ids]; },
      startMatch, flip } });
  }, [game]);
  return <AuthContext.Provider value={auth}><EconomyProvider key={generation}><MemoryRouter initialEntries={['/collection?tab=coins']}><div className={layoutStyles.layout}>
    <header style={{ padding: '12px 20px', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', background: '#231b15', color: '#efe6d2' }}>
      <small>本地内存演示 · 不连接账户</small><Link style={{ color: 'inherit' }} to="/collection?tab=coins">收藏</Link><Link style={{ color: 'inherit' }} to="/shop?category=coin">商城</Link><Link style={{ color: 'inherit' }} to="/toss">抛币</Link><Link style={{ color: 'inherit' }} to="/toss-3d">3D 抛币</Link>
    </header>
    <Routes><Route path="/toss-3d" element={<CoinReview3D />} /><Route path="/collection" element={<CollectionPage />} /><Route path="/shop" element={<ShopPage />} />
      <Route path="/toss" element={<main className="a-page" style={{ minHeight: '80vh' }}><div className="a-wrap"><h1 className="a-hero-title">真实结果抛币演示</h1><p style={{ color: '#f0e5cb' }}>动画只呈现指定结果，不生成随机数。开始新对局才读取新装备。</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}><button className="a-btn" onClick={startMatch}>开始新对局</button><button className="a-btn" onClick={() => flip(true)}>正面</button><button className="a-btn" onClick={() => flip(false)}>反面</button><button className="a-btn" onClick={() => flip(false, 2)}>对手反面</button></div>
        <div style={{ position: 'relative', height: 400, marginTop: 18, borderRadius: 20, background: '#1b382d', boxShadow: 'inset 0 3px 20px #0007' }}><BoardCoinFlip game={game} /></div>
      </div></main>} /></Routes>
  </div></MemoryRouter></EconomyProvider></AuthContext.Provider>;
}
createRoot(document.getElementById('fixture')!).render(<Fixture />);
