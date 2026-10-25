import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Format, GamePhase, GameSettings, SuperType } from 'ptcg-server';
import { useAuth } from '../context/AuthContext';
import { useCoreSession } from '../context/CoreSessionContext';
import { getDeck } from '../api/deckApi';
import { toGameSettingsPayload } from '../game/gameSettingsPayload';
import { isPlayerInGame, partitionMyGames } from '../games/myGamesClassify';
import { declineGameInvite } from '../games/myGamesActions';
import { getSocketManager } from '../socket/socketManager';
import { chineseCard } from './chineseCatalog';
import { duoPresets, rememberDuoDeck, selectDuoDeck, lookupDuoUser, duoFriendAction, type DuoPlayer, type DuoLookup } from './duoApi';
import { DuoVisibilityToggle } from './DuoVisibilityToggle';
import { ApiError } from '../api/apiError';
import { ApiErrorEnum } from 'ptcg-server';
import { useDuoRoom } from './useDuoRoom';
import { TrainerPortrait } from './TrainerPortrait';
import { DuoDialog } from './DuoDialog';
import { GameIcon } from './GameIcon';
import { onImageError } from '../components/imageFallback';
import { useParallax, useTilt } from './lobby/usePointerFX';
import { spawnRipple } from './lobby/ripple';
import { SceneBackdrop } from './lobby/SceneBackdrop';
import { Emblem } from './lobby/Emblem';
import { DeckStack } from './lobby/DeckStack';
import { SeatCard } from './lobby/SeatCard';
import { ChallengeLetter } from './lobby/ChallengeLetter';
import styles from './DuoHomePage.module.css';

export function DuoHomePage() {
  const { user, cardsInfo } = useAuth();
  const core = useCoreSession();
  const navigate = useNavigate();
  const { room, decks, setRoom, error, loading, syncRoom } = useDuoRoom();
  const [busy, setBusy] = useState(false);
  const [challengingId, setChallengingId] = useState(0);
  const [actionError, setActionError] = useState('');
  const [deckPicker, setDeckPicker] = useState(false);
  const [tab, setTab] = useState<'hall' | 'friends' | 'lookup'>('hall');
  const [searchName, setSearchName] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (tab === 'lookup') searchInputRef.current?.focus();
  }, [tab]);
  function openLookup() { setTab('lookup'); }
  const [found, setFound] = useState<DuoLookup | null>(null);
  const [searched, setSearched] = useState(false);
  const parallax = useParallax<HTMLDivElement>();
  const meTilt = useTilt<HTMLDivElement>(7);
  const me = room.players.find(player => player.userId === user?.userId);
  const selected = decks.find(deck => deck.id === me?.selectedDeckId);
  const validDecks = decks.filter(deck => deck.isValid && deck.format.includes(Format.UNLIMITED));
  const myGames = useMemo(() => partitionMyGames(core.games, core.clientId, user?.userId ?? 0), [core.games, core.clientId, user?.userId]);
  const incoming = myGames.incoming[0];
  const active = myGames.active[0];
  const outgoing = myGames.outgoing[0];
  const myBusy = !!(incoming || active || outgoing);
  const selectedReady = !!selected?.isValid && me?.deckReady !== false;
  const canChallenge = core.connected && !myBusy && selectedReady;
  /** 我方不可挑战的原因，直接显示在按钮 title 上，避免「按钮灰了但不说为什么」。 */
  const unavailableReason = !core.connected ? '尚未连接大厅'
    : myBusy ? '你已在对战中'
      : !selected ? '先在左侧选择一套出战卡组'
        : !selectedReady ? me?.deckUnavailableReason ?? '这套出战卡组不可用（需满足 60 张与持有量）'
          : '暂不可挑战';

  useEffect(() => {
    if (!user) return;
    void syncRoom();
  }, [user, core.games.length, core.clients.length, core.connected, syncRoom]);

  const others = useMemo(() => room.players
    .filter(player => player.userId !== user?.userId && player.connected)
    .map(player => ({ player, online: player.connected, busyPlayer: player.busy }))
    .sort((a, b) => Number(b.online && !b.busyPlayer) - Number(a.online && !a.busyPlayer) ||
      Number(b.online) - Number(a.online) || a.player.userId - b.player.userId), [room.players, user?.userId]);

  const onlineCount = others.filter(entry => entry.online).length;
  const readyToFight = others.filter(entry => entry.player.challengeable);
  const rest = others.filter(entry => !entry.player.challengeable);
  const busyCount = others.filter(entry => entry.busyPlayer).length;

  const pokemonNames = selected?.cards?.filter(name => cardsInfo?.cards.some(card => card.fullName === name && card.superType === SuperType.POKEMON)) ?? [];
  const preset = duoPresets.find(preset => selected?.name.startsWith(preset.name) && selected.cards?.includes(preset.cover));
  const featured = preset?.cover ?? pokemonNames[0];
  const art = featured ? chineseCard({ fullName: featured })?.image : undefined;

  async function chooseDeck(id: number) {
    if (!id || busy || !user || myBusy || challengingId) return false;
    setBusy(true); setActionError('');
    try {
      await selectDuoDeck(id);
      rememberDuoDeck(user.userId, id);
      setRoom(previous => ({ ...previous, players: previous.players.map(player => player.userId === user.userId ?
        { ...player, selectedDeckId: id, selectedDeckName: decks.find(deck => deck.id === id)?.name ?? '', deckReady: true } : player) }));
      setDeckPicker(false);
      await syncRoom(undefined, true);
      return true;
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : '卡组选择失败'); return false; }
    finally { setBusy(false); }
  }

  async function refreshLobby() {
    await core.refreshCore().catch(() => undefined);
    await syncRoom(undefined, true);
  }

  async function resumeInto(gameId: number) {
    if (busy) return;
    setBusy(true); setActionError('');
    try {
      const ok = await core.resumeGame(gameId);
      if (ok) { navigate(`/table/${gameId}`); return; }
      setActionError('无法恢复对战');
      await refreshLobby();
    } catch { setActionError('连接失败'); await syncRoom(); }
    finally { setBusy(false); }
  }

  async function declineIncoming(gameId: number) {
    if (busy) return;
    setBusy(true); setActionError('');
    try { await declineGameInvite(gameId); }
    catch { setActionError('操作失败'); }
    finally { await refreshLobby(); setBusy(false); }
  }

  async function cancelOutgoing(gameId: number) {
    if (busy) return;
    setBusy(true); setActionError('');
    try { await getSocketManager().emit('game:concede', { gameId }); }
    catch { setActionError('操作失败'); }
    finally { await refreshLobby(); setBusy(false); }
  }

  async function socialAction(action: 'send' | 'accept' | 'reject' | 'cancel' | 'remove', targetId: number) {
    if (busy) return;
    setBusy(true); setActionError('');
    try { await duoFriendAction(action, targetId); await refreshLobby(); }
    catch (error) { setActionError(error instanceof ApiError && error.code === ApiErrorEnum.REQUESTS_LIMIT_REACHED
      ? '操作过于频繁，请稍后再试' : '好友操作失败，请刷新后重试'); }
    finally { setBusy(false); }
  }

  async function search() {
    if (busy) return;
    setBusy(true); setActionError(''); setFound(null); setSearched(false);
    try { setFound((await lookupDuoUser(searchName.trim())).target); setSearched(true); }
    catch (error) { setActionError(error instanceof ApiError && error.code === ApiErrorEnum.REQUESTS_LIMIT_REACHED
      ? '查找过于频繁，请稍后再试' : '查找失败，请输入注册时的完整训练家名称'); }
    finally { setBusy(false); }
  }

  async function challenge(player: Pick<DuoPlayer, 'userId' | 'name' | 'label'>) {
    if (!canChallenge || !user || challengingId) return;
    setChallengingId(player.userId); setActionError('');
    try {
      const deck = (await getDeck(selected!.id)).deck;
      const info = await core.refreshCore();
      if (info.games.some(game => isPlayerInGame(game, info.clientId, user.userId))) {
        setActionError('你已在对战中');
        await syncRoom(); return;
      }
      // Resolve exact names on the server: hidden search results are intentionally absent from core.clients.
      const target = (await lookupDuoUser(player.name)).target;
      if (!target?.clientId || target.userId !== player.userId) {
        setActionError(`${player.label} 不可用`);
        await syncRoom(); return;
      }
      const settings = new GameSettings();
      settings.format = Format.UNLIMITED;
      settings.timeLimit = 0;
      settings.recordingEnabled = true;
      await core.createGame(deck.cards, toGameSettingsPayload(settings), target.clientId, deck.id);
      // 邀请尚未被接受时留在大厅，发起方也通过挑战信等待回信。
      await refreshLobby();
    } catch {
      setActionError('挑战失败');
      await refreshLobby();
    } finally { setChallengingId(0); }
  }

  const peerId = (incoming ?? active ?? outgoing)?.playerUserIds?.find(id => id !== user?.userId);
  const peer = [...room.players, ...(room.peers ?? [])].find(player => player.userId === peerId);
  const letterMode = incoming ? 'incoming' : active ? 'active' : 'outgoing';
  const hallWarming = loading && room.players.length === 0;

  return (
    <div className={styles.arena} ref={parallax.ref} onPointerMove={parallax.onPointerMove}>
      <SceneBackdrop />

      <div className={styles.content}>
        {/* 中央徽记：精灵球落桌 + 厅名 */}
        <header className={styles.hero}>
          <Emblem />
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>Pokémon TCG · A Table for Two</p>
            <h1 className={styles.heroTitle}>对战大厅</h1>
            <div className={styles.heroStats}>
              <div className={styles.plaque}>
                <strong className={styles.plaqueValue}>{onlineCount + 1}</strong>
                <span className={styles.plaqueLabel}>可见在线</span>
              </div>
              <div className={styles.plaque}>
                <strong className={styles.plaqueValue}>{readyToFight.length}</strong>
                <span className={styles.plaqueLabel}>可见可战</span>
              </div>
              <div className={styles.plaque}>
                <strong className={styles.plaqueValue}>{busyCount}</strong>
                <span className={styles.plaqueLabel}>可见牌局</span>
              </div>
            </div>
            <p className={styles.visibilityNote}>在线数含自己，其余仅统计可见的公开训练家与好友，不代表全站人数。</p>
          </div>
        </header>

        {/* 挑战信 / 牌局回执 */}
        {(incoming || active || outgoing) && (
          <ChallengeLetter
            mode={letterMode}
            myName={user?.name || ''}
            peerName={peer?.name || ''}
            peerLabel={peer?.label || '对手'}
            actionBusy={busy}
            setupPending={active?.phase === GamePhase.SETUP}
            onResume={() => void resumeInto((incoming ?? active)!.gameId)}
            onDecline={() => void declineIncoming(incoming!.gameId)}
            onCancel={() => void cancelOutgoing(outgoing!.gameId)}
          />
        )}

        <div className={styles.board}>
          {/* 我的席位 */}
          <aside className={styles.mySeat}>
            <div className={`${styles.meCard} ${styles.tiltCard}`} {...meTilt}>
              <div className={styles.meTop}>
                <div className={styles.mePortrait}>
                  <TrainerPortrait name={user?.name ?? ''} size={84} />
                </div>
                <div className={styles.meMeta}>
                  <span className={styles.meRole}>训练家证</span>
                  <strong className={styles.meName}>{me?.label ?? user?.name ?? '…'}</strong>
                  <span className={styles.meConn}>
                    <i className={`${styles.connDot} ${core.connected ? styles.connOn : ''}`} />
                    {core.connected ? '已连接大厅' : '连接中…'}
                  </span>
                </div>
              </div>
              <div className={styles.meRecord}>
                <div className={styles.meRecordItem}><strong>{me?.wins ?? 0}</strong><span>胜</span></div>
                <div className={styles.meRecordItem}><strong>{me?.losses ?? 0}</strong><span>负</span></div>
                <div className={styles.meRecordItem}><strong>{me?.draws ?? 0}</strong><span>平</span></div>
                <Link to="/records" className={styles.meRecordLink}>全部战绩</Link>
              </div>
              <div style={{ padding: '12px 18px' }}><DuoVisibilityToggle value={me?.duoPublic} onSaved={() => syncRoom(undefined, true)} /></div>
              <span className={styles.holoEdge} aria-hidden="true" />
              <span className={styles.glare} aria-hidden="true" />
            </div>

            {/* 出战卡组 */}
            <section className={styles.deckSection} data-tour="selected-deck">
              <div className={styles.deckHead}>
                <h2 className={styles.seatTitle}>出战卡组</h2>
                {selected && (
                  <button
                    type="button"
                    className={styles.ghostBtn}
                    onClick={() => setDeckPicker(true)}
                    disabled={busy || myBusy}
                  >
                    更换
                  </button>
                )}
              </div>

              {selected ? (
                <>
                  <DeckStack
                    art={art}
                    alt={selected.name}
                    onOpen={() => setDeckPicker(true)}
                    openDisabled={busy || myBusy}
                  />
                  <div className={styles.deckMeta}>
                    <div className={styles.deckTitleRow}>
                      <strong className={styles.deckName}>{selected.name}</strong>
                      <span className={`${styles.deckBadge} ${selectedReady ? styles.badgeReady : styles.badgeDraft}`}>
                        {selectedReady ? '已备战' : '不可出战'}
                      </span>
                    </div>
                    <span className={styles.deckCount}>{selected.cards?.length || 0} 张卡</span>
                    {!selectedReady && <p className={styles.deckIssue}>{me?.deckUnavailableReason ?? '卡组构筑或持有量未满足'}，请更换卡组或编辑检查。</p>}
                    <div className={styles.deckLinks}>
                      <Link to={`/deck/${selected.id}`}>编辑卡组 →</Link>
                    </div>
                  </div>
                </>
              ) : (
                <div className={styles.deckEmpty}>
                  <span className={styles.miniBall} aria-hidden="true" />
                  <p>还没有出战卡组</p>
                  <button
                    type="button"
                    className={styles.goldBtn}
                    onPointerDown={spawnRipple}
                    onClick={() => setDeckPicker(true)}
                  >
                    选择卡组
                  </button>
                </div>
              )}
            </section>
          </aside>

          {/* 挑战席位 */}
          <section className={styles.seats}>
            <div className={styles.seatsHead}>
              <div role="tablist" aria-label="大厅名单" className={styles.socialTabs}>
                {(['hall', 'friends', 'lookup'] as const).map((name, index) => <button key={name} type="button"
                  role="tab" aria-selected={tab === name} className={tab === name ? styles.goldBtn : styles.ghostBtn}
                  onClick={() => setTab(name)}>{['大厅', '好友', '查找'][index]}</button>)}
              </div>
              <span className={styles.seatsCount}>{readyToFight.length} 位可见可战</span>
            </div>
            {tab === 'hall' && readyToFight.length > 0 && <p className={styles.hint}>
              这里只展示公开训练家和你的好友。知道完整用户名？<button type="button" className={styles.ghostBtn} onClick={openLookup}>精确查找训练家</button>
            </p>}

            {(error || actionError) && (
              <div className={styles.errorNote} role="alert">
                <span className={styles.errorPin} aria-hidden="true" />
                {actionError || error}
              </div>
            )}

            {tab === 'lookup' && <div className={styles.socialPanel}>
              <form onSubmit={event => { event.preventDefault(); void search(); }} className={styles.socialTabs}>
                <label className={styles.socialSearch}><span className={styles.srOnly}>完整用户名</span>
                  <input ref={searchInputRef} aria-label="完整用户名" placeholder="输入完整用户名" value={searchName} maxLength={32}
                    onChange={event => { setSearchName(event.target.value); setFound(null); setSearched(false); }} />
                </label>
                <button type="submit" className={styles.goldBtn} disabled={busy || !searchName.trim()}>精确查找</button>
              </form>
              <p className={styles.hint}>不支持模糊搜索；知道完整用户名即可申请好友或发起挑战。</p>
              {searched && !found && <p className={styles.hint}>未找到此训练家</p>}
              {found && <div className={styles.socialRow}>
                <TrainerPortrait name={found.name} size={40} />
                <strong className={styles.rowName}>{found.name}</strong>
                <span className={styles.rowState}>{found.connected ? '在线' : '离线'}</span>
                {found.userId !== user?.userId && <>
                  <button type="button" className={styles.ghostBtn} disabled={busy || !canChallenge || !found.connected || !!challengingId}
                    title={!canChallenge ? unavailableReason : undefined}
                    onClick={() => void challenge({ ...found, label: found.name })}>挑战</button>
                  <button type="button" className={styles.ghostBtn} disabled={busy}
                    onClick={() => void socialAction('send', found.userId)}>申请好友</button>
                </>}
              </div>}
            </div>}
            {tab === 'friends' && <div className={styles.socialPanel}>
              <h2 className={styles.seatTitle}>已接受的好友</h2>
              {room.players.filter(player => player.isFriend).map(player => <div key={player.userId} className={styles.socialRow}>
                <TrainerPortrait name={player.name} size={40} /><strong className={styles.rowName}>{player.label}</strong>
                <span className={styles.rowState}>{player.busy ? '对战中' : player.connected ? '在线' : '离线'}</span>
                {!player.challengeable && player.connected && player.unavailableReason &&
                  <span className={styles.rowReason}>· {player.unavailableReason}</span>}
                <button type="button" className={styles.ghostBtn}
                  disabled={busy || !canChallenge || !player.challengeable || !!challengingId}
                  title={player.challengeable ? undefined : player.unavailableReason ?? unavailableReason}
                  onClick={() => void challenge(player)}>挑战</button>
                <button type="button" className={styles.ghostBtn} disabled={busy}
                  onClick={() => void socialAction('remove', player.userId)}>移除</button>
              </div>)}
              {!room.players.some(player => player.isFriend) && <p className={styles.hint}>还没有好友，可在查找中输入完整用户名申请。</p>}
              <h2 className={styles.seatTitle}>好友申请</h2>
              {(room.requests ?? []).map(request => <div key={request.id} className={styles.socialRow}>
                <strong>{request.name}</strong><span>{request.direction === 'incoming' ? '申请成为你的好友' : '等待对方接受'}</span>
                {request.direction === 'incoming' ? <>
                  <button type="button" className={styles.ghostBtn} disabled={busy} onClick={() => void socialAction('accept', request.id)}>接受</button>
                  <button type="button" className={styles.ghostBtn} disabled={busy} onClick={() => void socialAction('reject', request.id)}>拒绝</button>
                </> : <button type="button" className={styles.ghostBtn} disabled={busy} onClick={() => void socialAction('cancel', request.id)}>取消</button>}
              </div>)}
              {!room.requests?.length && <p className={styles.hint}>暂无待处理申请</p>}
            </div>}
            {tab === 'hall' && <>{hallWarming ? (
              <div className={styles.hallLoading}>
                <span className={`${styles.miniBall} ${styles.miniBallRock}`} aria-hidden="true" />
                <p>正在布置牌桌……</p>
              </div>
            ) : readyToFight.length > 0 ? (
              <>
                {!canChallenge && (
                  <p className={styles.hint}>
                    {unavailableReason}
                  </p>
                )}
                <div className={styles.seatsGrid}>
                  {readyToFight.map(({ player }, index) => (
                    <SeatCard
                      key={player.userId}
                      player={player}
                      index={index}
                      canChallenge={canChallenge}
                      blockedReason={canChallenge ? undefined : unavailableReason}
                      challenging={challengingId === player.userId}
                      actionBusy={busy}
                      onChallenge={() => void challenge(player)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.hallEmpty}>
                <span className={`${styles.miniBall} ${styles.miniBallRock}`} aria-hidden="true" />
                <p className={styles.hallEmptyTitle}>可见名单中暂时没有可挑战的训练家</p>
                <p className={styles.hallEmptySub}>这里只展示公开训练家和好友；未公开的训练家仍可用完整用户名查找。</p>
                <button type="button" className={styles.goldBtn} onClick={openLookup}>精确查找训练家</button>
              </div>
            )}

            {/* 在线但暂不可战；离线好友仅在好友 tab 保留 */}
            {rest.length > 0 && (
              <details className={styles.tray}>
                <summary>
                  <span>其他训练家</span>
                  <span className={styles.trayCount}>{rest.length}</span>
                </summary>
                <div className={styles.trayGrid}>
                  {rest.map(({ player, online, busyPlayer }) => (
                    <div
                      key={player.userId}
                      className={`${styles.trayCard} ${busyPlayer ? styles.trayBusy : styles.trayOff}`}
                    >
                      <TrainerPortrait name={player.name} size={40} />
                      <div className={styles.trayMeta}>
                        <strong>{player.label}</strong>
                        <span>{busyPlayer ? '对战中' : online ? player.unavailableReason ?? '暂不可挑战' : '离线'}</span>
                      </div>
                      <i className={`${styles.connDot} ${busyPlayer ? styles.connBusy : styles.connOff}`} aria-hidden="true" />
                    </div>
                  ))}
                </div>
              </details>
            )}
            </>}
          </section>
        </div>
      </div>

      {/* 卡组选择弹窗 */}
      {deckPicker && (
        <DuoDialog title="选择出战卡组" onClose={() => setDeckPicker(false)}>
          <div className={styles.picker}>
            {validDecks.length > 0 ? (
              <div className={styles.pickerGrid}>
                {validDecks.map(deck => {
                  const deckPokemon = deck.cards?.filter(name =>
                    cardsInfo?.cards.some(card => card.fullName === name && card.superType === SuperType.POKEMON)
                  ) ?? [];
                  const deckPreset = duoPresets.find(p => deck.name.startsWith(p.name) && deck.cards?.includes(p.cover));
                  const deckCover = deckPreset?.cover ?? deckPokemon[0];
                  const deckArt = deckCover ? chineseCard({ fullName: deckCover })?.image : undefined;
                  return (
                    <button
                      key={deck.id}
                      type="button"
                      className={`${styles.pickerCard} ${selected?.id === deck.id ? styles.pickerSelected : ''}`}
                      onPointerDown={spawnRipple}
                      onClick={() => void chooseDeck(deck.id)}
                      disabled={busy}
                    >
                      <span className={styles.pickerArt}>
                        <img src={deckArt || '/assets/duo-cardback.svg'} alt="" onError={onImageError} />
                        <span className={styles.holoSheet} aria-hidden="true" />
                      </span>
                      <span className={styles.pickerMeta}>
                        <strong>{deck.name}</strong>
                        <span>{deck.cards?.length || 0} 张</span>
                      </span>
                      {selected?.id === deck.id && (
                        <span className={styles.pickerCheck}><GameIcon name="check" size={13} /></span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className={styles.pickerEmpty}>
                <p>还没有可出战的卡组</p>
                <Link to="/deck" onClick={() => setDeckPicker(false)}>去创建卡组 →</Link>
              </div>
            )}
          </div>
        </DuoDialog>
      )}
    </div>
  );
}
