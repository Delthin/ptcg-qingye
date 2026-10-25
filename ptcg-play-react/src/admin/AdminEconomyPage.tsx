import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDeckCardScanUrl } from '../context/CardImagesContext';
import { ApiError } from '../api/apiError';
import { adminGrant, getAdminUserSnapshot, searchAdminCatalog, searchAdminUsers, type AdminGrantPayload, type AdminUserSummary } from './adminEconomyApi';
import { formatGameMoney, parseGameMoneyToMinor, type EconomySnapshot, type OwnedPrinting } from '../collection/economyTypes';
import styles from './admin.module.css';

const MAX_GRANT_KINDS = 50;
const MAX_COUNT_PER_CARD = 999;
interface GrantRow extends OwnedPrinting { countText: string }
type Feedback = { kind: 'success' | 'error' | 'unknown'; text: string } | null;

function roleName(roleId: number): string {
  if (roleId === 4) return '管理员';
  if (roleId === 1) return '已封禁';
  return `角色 ${roleId}`;
}
function formatTime(value: string | number | null): string {
  if (value === null) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('zh-CN', { hour12: false });
}
function unknownOutcome(error: unknown): boolean {
  // A timeout or a request that never reached a verdict may still have been applied server-side.
  return !(error instanceof ApiError) || error.timeout || error.message === 'Network error' || String(error.code) === 'ECONOMY_FAILED';
}
function errorText(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return '请求失败，请稍后重试。';
}

/** Role-4 economy console. Target snapshots live only in this page's local state. */
export function AdminEconomyPage() {
  const { user, cardsInfo, serverConfig } = useAuth();
  const getScanUrl = useDeckCardScanUrl(serverConfig?.scansUrl);
  const engineCards = useMemo(() => new Map((cardsInfo?.cards ?? []).map(card => [card.fullName, card])), [cardsInfo]);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<AdminUserSummary[] | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [target, setTarget] = useState<AdminUserSummary | null>(null);
  const [snapshot, setSnapshot] = useState<EconomySnapshot | null>(null);
  const [targetLoading, setTargetLoading] = useState(false);
  const [targetError, setTargetError] = useState('');
  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogCards, setCatalogCards] = useState<OwnedPrinting[] | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [grantRows, setGrantRows] = useState<GrantRow[]>([]);
  const [amountText, setAmountText] = useState('');
  const [reason, setReason] = useState('');
  const [granting, setGranting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const usersCtrl = useRef<AbortController | null>(null);
  const targetCtrl = useRef<AbortController | null>(null);
  const catalogCtrl = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const grantLock = useRef(false);
  const targetRef = useRef<AdminUserSummary | null>(null);
  targetRef.current = target;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      usersCtrl.current?.abort();
      targetCtrl.current?.abort();
      catalogCtrl.current?.abort();
    };
  }, []);

  if (user?.roleId !== 4) return <Navigate to="/games" replace />;

  function imageFor(card: Pick<OwnedPrinting, 'engineFullName' | 'image'>): string {
    if (card.image) return card.image;
    const engine = card.engineFullName ? engineCards.get(card.engineFullName) : undefined;
    return engine ? getScanUrl(engine) : '/assets/duo-cardback.svg';
  }

  function searchUsers(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    setFeedback(null);
    usersCtrl.current?.abort();
    if (!q) { setUsers(null); setUsersError(''); setUsersLoading(false); return; }
    const controller = new AbortController();
    usersCtrl.current = controller;
    setUsersLoading(true); setUsersError('');
    searchAdminUsers(q, controller.signal).then(result => {
      if (!mounted.current || controller.signal.aborted) return;
      setUsers(result); setUsersLoading(false);
    }).catch(error => {
      if (!mounted.current || controller.signal.aborted) return;
      setUsersError(errorText(error)); setUsersLoading(false);
    });
  }

  function loadTargetSummary(next: AdminUserSummary) {
    if (grantLock.current) return;
    if (targetRef.current?.userId !== next.userId) { setAmountText(''); setGrantRows([]); setReason(''); }
    targetRef.current = next;
    targetCtrl.current?.abort();
    const controller = new AbortController();
    targetCtrl.current = controller;
    setTarget(next); setSnapshot(null); setTargetError(''); setTargetLoading(true);
    setFeedback(null);
    getAdminUserSnapshot(next.userId, controller.signal).then(result => {
      if (!mounted.current || controller.signal.aborted) return;
      // A stale response for a previously selected account must not leak into the new target.
      if (targetRef.current?.userId !== next.userId) return;
      setSnapshot(result); setTargetLoading(false);
    }).catch(error => {
      if (!mounted.current || controller.signal.aborted) return;
      if (targetRef.current?.userId !== next.userId) return;
      setTargetError(errorText(error)); setTargetLoading(false);
    });
  }

  function refreshTarget() {
    if (target && !targetLoading) loadTargetSummary(target);
  }

  function searchCatalog() {
    const q = catalogQuery.trim();
    catalogCtrl.current?.abort();
    if (!q) { setCatalogCards(null); setCatalogError(''); setCatalogLoading(false); return; }
    const controller = new AbortController();
    catalogCtrl.current = controller;
    setCatalogLoading(true); setCatalogError('');
    searchAdminCatalog(q, controller.signal).then(result => {
      if (!mounted.current || controller.signal.aborted) return;
      setCatalogCards(result); setCatalogLoading(false);
    }).catch(error => {
      if (!mounted.current || controller.signal.aborted) return;
      setCatalogError(errorText(error)); setCatalogLoading(false);
    });
  }

  function addGrantCard(card: OwnedPrinting) {
    setFeedback(null);
    setGrantRows(rows => {
      const existing = rows.find(row => row.printingId === card.printingId);
      if (existing) {
        const count = Math.min(MAX_COUNT_PER_CARD, (parseInt(existing.countText, 10) || 0) + 1);
        return rows.map(row => row.printingId === card.printingId ? { ...row, countText: String(count) } : row);
      }
      if (rows.length >= MAX_GRANT_KINDS) return rows;
      return [...rows, { ...card, count: 0, countText: '1' }];
    });
  }
  function setGrantCount(printingId: string, countText: string) {
    setGrantRows(rows => rows.map(row => row.printingId === printingId ? { ...row, countText: countText.replace(/[^\d]/g, '').slice(0, 3) } : row));
  }
  function removeGrantCard(printingId: string) {
    setGrantRows(rows => rows.filter(row => row.printingId !== printingId));
  }

  const amountMinor = amountText.trim() ? parseGameMoneyToMinor(amountText) : null;
  const amountInvalid = !!amountText.trim() && amountMinor === null;
  const cardCounts = grantRows.map(row => ({ row, count: parseInt(row.countText, 10) }));
  const cardsInvalid = cardCounts.some(({ count }) => !Number.isInteger(count) || count < 1 || count > MAX_COUNT_PER_CARD);
  const reasonValid = reason.trim().length > 0 && reason.trim().length <= 120;
  const hasPayload = amountMinor !== null || grantRows.length > 0;
  const canSubmit = !!target && target.roleId !== 1 && snapshot?.userId === target.userId && !targetLoading &&
    !granting && feedback?.kind !== 'unknown' && hasPayload && !amountInvalid && !cardsInvalid && reasonValid;

  function submitGrant(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit || !target || grantLock.current) return;
    grantLock.current = true;
    const payload: AdminGrantPayload = { targetUserId: target.userId, reason: reason.trim() };
    if (amountMinor !== null) payload.amountMinor = amountMinor;
    if (grantRows.length) payload.cards = cardCounts.map(({ row, count }) => ({ printingId: row.printingId, count }));
    const requested = target;
    const detail = [
      amountMinor !== null ? `${formatGameMoney(amountMinor)} 游戏元` : '',
      grantRows.length ? `${grantRows.length} 种卡（共 ${cardCounts.reduce((sum, { count }) => sum + count, 0)} 张）` : '',
    ].filter(Boolean).join(' · ');
    setGranting(true); setFeedback(null);
    adminGrant(payload).then(result => {
      grantLock.current = false;
      if (!mounted.current) return;
      setGranting(false);
      setUsers(rows => rows?.map(row => row.userId === requested.userId ? { ...row, balanceMinor: result.balanceMinor, holdingCount: result.holdings.length, packCount: result.packs.length } : row) ?? null);
      if (targetRef.current?.userId !== requested.userId) {
        // Applied to the previously selected account; keep the console honest instead of mixing states.
        setFeedback({ kind: 'success', text: `已发放给 ${requested.name}（#${requested.userId}）：${detail}。当前显示的是新选中的账号，请如需核对可重新选择。` });
        return;
      }
      setSnapshot(result);
      setAmountText(''); setGrantRows([]); setReason('');
      setFeedback({ kind: 'success', text: `已发放给 ${requested.name}（#${requested.userId}）：${detail}。最新余额 ${formatGameMoney(result.balanceMinor)} 游戏元。` });
    }).catch(error => {
      grantLock.current = false;
      if (!mounted.current) return;
      setGranting(false);
      if (unknownOutcome(error)) {
        setFeedback({ kind: 'unknown', text: `发放请求结果未知（${errorText(error)}）。请先点「刷新」核对 ${requested.name} 的余额与收藏，确认前不要重复提交。` });
        return;
      }
      setFeedback({ kind: 'error', text: `发放失败：${errorText(error)}` });
    });
  }

  const holdings = snapshot?.holdings ?? [];
  const totalCards = holdings.reduce((sum, printing) => sum + printing.count, 0);
  const packGroups = (() => {
    const groups = new Map<string, { name: string; count: number }>();
    for (const pack of snapshot?.packs ?? []) {
      const group = groups.get(pack.productId) ?? { name: pack.name, count: 0 };
      group.count += 1; groups.set(pack.productId, group);
    }
    return [...groups.values()];
  })();

  return <div className={`a-page ${styles.page}`}>
    <div className={`a-wrap ${styles.wrap}`}>
      <header className={styles.heading}>
        <div className={styles.headingText}>
          <h1 className="a-section-title">经济管理</h1>
          <span className="a-section-meta">管理员 · 经济系统</span>
        </div>
        <Link to="/games" className="a-btn-ghost">回大厅 →</Link>
      </header>
      <div className={styles.layout}>
        <section className={styles.panel} aria-label="搜索用户">
          <div className={styles.plate}>
            <h2>搜索用户</h2>
            <form className={styles.searchForm} onSubmit={searchUsers}>
              <input type="search" className={`a-input ${styles.input}`} placeholder="按用户名搜索" value={query} onChange={event => setQuery(event.target.value)} aria-label="用户名关键词" />
              <button type="submit" className="a-btn" disabled={usersLoading}>{usersLoading ? '搜索中…' : '搜索'}</button>
            </form>
        {usersError && <p className="duo-error" role="alert">{usersError}</p>}
        {usersLoading && <p className={styles.hint}>正在搜索…</p>}
            {users && !usersLoading && (users.length ? <ul className={styles.userList}>
          {users.map(row => <li key={row.userId}>
            <button type="button" className={styles.userRow} aria-pressed={target?.userId === row.userId} data-selected={target?.userId === row.userId || undefined}
              disabled={granting} onClick={() => loadTargetSummary(row)}>
              <span className={styles.userIdentity}><strong>{row.name}</strong><small>#{row.userId} · {roleName(row.roleId)}</small></span>
              <span className={styles.userStats}>
                <span>{formatGameMoney(row.balanceMinor)} 游戏元</span>
                <span>收藏 {row.holdingCount} 种</span>
                <span>未拆封 {row.packCount}</span>
              </span>
              <small className={styles.lastSeen}>最近在线 {formatTime(row.lastSeen)}</small>
            </button>
          </li>)}
            </ul> : <p className={styles.hint}>没有匹配的用户。</p>)}
            {!users && !usersLoading && !usersError && <p className={styles.hint}>输入名称关键词后搜索，选中一行查看目标账号的经济状态。</p>}
          </div>
        </section>

        <section className={styles.panel} aria-label="目标账号与发放">
          <div className={styles.plate}>
            <h2>{target ? `${target.name} · #${target.userId}` : '目标账号'}</h2>
        {target ? <>
          <div className={styles.targetBar}>
            <span className={target.roleId === 4 ? styles.roleTagAdmin : target.roleId === 1 ? styles.roleTagBanned : styles.roleTag}>{roleName(target.roleId)}</span>
            <button type="button" className="duo-text-link" onClick={refreshTarget} disabled={targetLoading || granting}>{targetLoading ? '正在刷新…' : '刷新目标数据'}</button>
          </div>
          {targetError && <p className="duo-error" role="alert">{targetError}</p>}
          {targetLoading && <p className={styles.hint}>正在读取目标账号…</p>}
          {snapshot && <div className={styles.statGrid}>
            <div className={styles.stat}><small>余额</small><strong>{formatGameMoney(snapshot.balanceMinor)} <i>游戏元</i></strong></div>
            <div className={styles.stat}><small>收藏</small><strong>{holdings.length} <i>种 · {totalCards} 张</i></strong></div>
            <div className={styles.stat}><small>未拆封</small><strong>{snapshot.packs.length} <i>件</i></strong></div>
            <div className={styles.stat}><small>今日签到</small><strong>{snapshot.checkIn.claimed ? '已签' : '未签'}</strong></div>
          </div>}
          {snapshot && <>
            <h3 className={styles.subTitle}>收藏明细</h3>
            {holdings.length ? <ul className={styles.holdingList}>
              {holdings.map(printing => <li key={printing.printingId} data-empty={printing.count === 0 || undefined}>
                <img src={imageFor(printing)} alt="" loading="lazy" />
                <span className={styles.holdingName}>{printing.name}<small>{printing.set} · {printing.number}{printing.engineFullName === null ? ' · 未实现对战效果' : ''}</small></span>
                <strong>× {printing.count}</strong>
              </li>)}
            </ul> : <p className={styles.hint}>该账号还没有收藏记录。</p>}
            {packGroups.length ? <><h3 className={styles.subTitle}>未拆封</h3><ul className={styles.packList}>
              {packGroups.map(pack => <li key={pack.name}>{pack.name}<strong>× {pack.count}</strong></li>)}
            </ul></> : null}
          </>}
          <h3 className={styles.subTitle}>发放</h3>
          <form onSubmit={submitGrant}>
              <label className={styles.field}>发放游戏元（可留空）<span className={styles.fieldRow}>
                <input type="text" className={`a-input ${styles.input}`} inputMode="decimal" placeholder="如 12.34，精确到分" value={amountText} disabled={granting}
                  onChange={event => { setAmountText(event.target.value); setFeedback(null); }} aria-invalid={amountInvalid || undefined} />
              <span className={styles.fieldHint}>{amountText.trim() ? amountMinor !== null ? `= ${amountMinor} 分` : '金额格式无效' : ''}</span>
            </span></label>
            {amountInvalid && <p className="duo-error" role="alert">金额需为正数，整数最多 7 位、小数最多 2 位（精确到分，不做浮点换算）。</p>}
            <label className={styles.field}>发放原因（必填）<input type="text" className={`a-input ${styles.input}`} maxLength={120} placeholder="如：活动补偿 / 测试发钱" value={reason} disabled={granting}
              onChange={event => { setReason(event.target.value); setFeedback(null); }} aria-invalid={reason.trim() ? undefined : true} /></label>
            <fieldset className={styles.fieldset} disabled={granting}>
              <legend>按名称 / 编号搜索印刷卡并发放（最多 {MAX_GRANT_KINDS} 种）</legend>
              <div className={styles.searchForm}>
                <input type="search" className={`a-input ${styles.input}`} placeholder="卡名或编号，如 皮卡丘 / 025" value={catalogQuery}
                  onChange={event => setCatalogQuery(event.target.value)}
                  onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); searchCatalog(); } }} aria-label="卡牌关键词" />
                <button type="button" className={`a-btn ${styles.miniBtn}`} disabled={catalogLoading} onClick={searchCatalog}>{catalogLoading ? '搜索中…' : '搜索卡牌'}</button>
              </div>
              {catalogError && <p className="duo-error" role="alert">{catalogError}</p>}
              {catalogCards && !catalogLoading && (catalogCards.length ? <>
                <p className={styles.hint}>最多显示 80 条，当前 {catalogCards.length} 条；「未实现效果」的卡发放后不能用于对战。</p>
                <ul className={styles.catalogList}>
                  {catalogCards.map(card => <li key={card.printingId}>
                    <img src={imageFor(card)} alt="" loading="lazy" />
                    <span className={styles.holdingName}>{card.name}<small>{card.set} · {card.number}{card.engineFullName === null ? ' · 未实现效果' : ''}</small></span>
                    <button type="button" className={`a-btn ${styles.miniBtn}`} disabled={grantRows.length >= MAX_GRANT_KINDS && !grantRows.some(row => row.printingId === card.printingId)} onClick={() => addGrantCard(card)}>加入发放</button>
                  </li>)}
                </ul>
              </> : <p className={styles.hint}>没有匹配的印刷卡。</p>)}
              {grantRows.length ? <ul className={styles.grantList}>
                {grantRows.map(row => <li key={row.printingId}>
                  <span className={styles.holdingName}>{row.name}<small>{row.set} · {row.number}{row.engineFullName === null ? ' · 未实现效果' : ''}</small></span>
                  <label className={styles.countField}>张数<input type="text" className={`a-input ${styles.countInput}`} inputMode="numeric" value={row.countText} disabled={granting}
                    onChange={event => setGrantCount(row.printingId, event.target.value)} aria-label={`${row.name} 发放张数`} /></label>
                  <button type="button" className={`duo-text-link ${styles.removeLink}`} disabled={granting} onClick={() => removeGrantCard(row.printingId)}>移除</button>
                </li>)}
              </ul> : <p className={styles.hint}>还没有选择要发放的卡。</p>}
            </fieldset>
            {cardsInvalid && <p className="duo-error" role="alert">每张卡的发放张数需为 1–{MAX_COUNT_PER_CARD} 的整数。</p>}
            {target && <p className={styles.submitSummary}>将发放给 <strong>{target.name}（#{target.userId}）</strong>
              {amountMinor !== null && <>：{formatGameMoney(amountMinor)} 游戏元</>}
              {grantRows.length > 0 && <>：{grantRows.length} 种卡共 {cardCounts.reduce((sum, { count }) => sum + (Number.isInteger(count) ? count : 0), 0)} 张</>}
              。</p>}
            {feedback && <p className={feedback.kind === 'success' ? styles.successNote : 'duo-error'} role={feedback.kind === 'success' ? 'status' : 'alert'}>{feedback.text}</p>}
            <div className={styles.submitRow}>
              <button type="submit" className={`a-btn ${styles.grantBtn}`} disabled={!canSubmit}>
                {granting ? '正在发放…' : target ? `确认发放给 ${target.name}` : '先选择目标用户'}
              </button>
            </div>
          </form>
        </> : <p className={styles.hint}>先在左侧搜索并选择一个用户，再查看余额、收藏与未拆封，或发放游戏元与卡牌。</p>}
          </div>
        </section>
      </div>
    </div>
  </div>;
}
