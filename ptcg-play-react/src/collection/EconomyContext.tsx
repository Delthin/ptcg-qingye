import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { apiGet, apiPost } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { isCoinId } from './coinCatalog';
import { ownedByEffect, validateEconomySnapshot, validateOpening, validateCoinRewards, type CoinReward, type EconomyMutation, type EconomyOpening, type EconomySnapshot } from './economyTypes';

export const ECONOMY_API_ENABLED = import.meta.env.VITE_ECONOMY_API_ENABLED !== 'false';
type EconomyStatus = 'pending' | 'loading' | 'ready' | 'error';
interface EconomyValue {
  status: EconomyStatus;
  snapshot: EconomySnapshot | null;
  ownedCounts: ReadonlyMap<string, number>;
  busy: boolean;
  error: string;
  refresh: () => Promise<void>;
  purchase: (productId: string, quantity: number) => Promise<CoinReward[]>;
  openPacks: (packIds: string[]) => Promise<EconomyOpening>;
  claimCheckIn: () => Promise<void>;
  equipCoin: (coinId: string) => Promise<void>;
}
const EconomyContext = createContext<EconomyValue | null>(null);
const message = (error: unknown) => error instanceof Error ? error.message : '暂时无法连接收藏服务。';

/** Live account economy against the documented server contract; set VITE_ECONOMY_API_ENABLED=false to disable. */
export function EconomyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.userId ?? 0;
  const [snapshot, setSnapshot] = useState<EconomySnapshot | null>(null);
  const [status, setStatus] = useState<EconomyStatus>(ECONOMY_API_ENABLED ? 'loading' : 'pending');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(true);
  const serial = useRef(0);
  const lock = useRef(false);
  const request = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (!ECONOMY_API_ENABLED || !userId || lock.current) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const revision = ++serial.current;
    setStatus('loading'); setError('');
    try {
      const result = validateEconomySnapshot(await apiGet<EconomySnapshot>('/v1/duo/economy', { signal: controller.signal }), userId);
      if (mounted.current && revision === serial.current) { setSnapshot(result); setStatus('ready'); }
    } catch (e) {
      if (!controller.signal.aborted && mounted.current && revision === serial.current) { setError(message(e)); setStatus('error'); }
    }
  }, [userId]);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    return () => { mounted.current = false; serial.current++; request.current?.abort(); };
  }, [refresh]);

  // A failed snapshot (local server restarted, network blip) should recover on its own when the
  // trainer comes back to the tab instead of leaving the wallet stuck on a stale error state.
  useEffect(() => {
    if (status !== 'error') return;
    const retry = () => void refresh();
    window.addEventListener('focus', retry);
    return () => window.removeEventListener('focus', retry);
  }, [status, refresh]);

  const mutate = useCallback(async (path: string, body: unknown, openingRequired: boolean, retryNote = '如请求中断，请先刷新核对余额和未拆封，不要直接重复购买。') => {
    if (!ECONOMY_API_ENABLED || !userId || lock.current || status !== 'ready') throw new Error('收藏服务尚未就绪。');
    lock.current = true;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const revision = ++serial.current;
    setBusy(true); setError('');
    try {
      const result = await apiPost<EconomyMutation>(path, body, { signal: controller.signal });
      const next = validateEconomySnapshot(result.snapshot, userId);
      const opening = openingRequired ? validateOpening(result.opening) : undefined;
      const coinRewards = validateCoinRewards(result.coinRewards);
      if (coinRewards.some(reward => !next.coins?.ownedIds.includes(reward.coinId) ||
          next.coins.counts && next.coins.counts[reward.coinId] !== reward.ownedBefore + reward.count)) {
        throw new Error('硬币结果与收藏未同步，请刷新核对，不要重复购买。');
      }
      if (!mounted.current || revision !== serial.current) throw new Error('账号或页面已改变，请重新核对收藏。');
      // Inventory and wallet are server-confirmed before the reveal animation begins.
      setSnapshot(next);
      return { opening, coinRewards };
    } catch (e) {
      if (mounted.current && revision === serial.current) setError(`${message(e)} ${retryNote}`);
      throw e;
    } finally {
      lock.current = false;
      if (mounted.current && revision === serial.current) setBusy(false);
    }
  }, [userId, status]);

  const purchase = useCallback(async (productId: string, quantity: number) => {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) throw new Error('购买数量无效。');
    return (await mutate('/v1/duo/economy/purchase', { productId, quantity }, false)).coinRewards;
  }, [mutate]);
  const openPacks = useCallback(async (packIds: string[]) => {
    if (!packIds.length || packIds.length > 10 || new Set(packIds).size !== packIds.length) throw new Error('请选择 1–10 件未拆封。');
    return (await mutate('/v1/duo/economy/open', { packIds }, true)).opening!;
  }, [mutate]);
  /** Duplicate same-day claims are resolved server-side; the returned snapshot keeps the balance honest. */
  const claimCheckIn = useCallback(async () => {
    await mutate('/v1/duo/economy/check-in', {}, false, '如请求中断，请先刷新核对签到与余额；当天已签不会重复入账。');
  }, [mutate]);
  const equipCoin = useCallback(async (coinId: string) => {
    if (!isCoinId(coinId)) throw new Error('这枚硬币不在当前目录中。');
    await mutate('/v1/duo/economy/coins/equip', { coinId }, false, '如请求中断，请刷新收藏核对正在使用的硬币。');
  }, [mutate]);
  const ownedCounts = useMemo(() => ownedByEffect(snapshot?.holdings ?? []), [snapshot]);
  const value = useMemo(() => ({ status, snapshot, busy, error, ownedCounts, refresh, purchase, openPacks, claimCheckIn, equipCoin }), [status, snapshot, busy, error, ownedCounts, refresh, purchase, openPacks, claimCheckIn, equipCoin]);
  return <EconomyContext.Provider value={value}>{children}</EconomyContext.Provider>;
}
export function useEconomy(): EconomyValue {
  const value = useContext(EconomyContext);
  if (!value) throw new Error('EconomyProvider is required inside the signed-in application.');
  return value;
}
