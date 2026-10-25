import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { GamePhase, type Card } from 'ptcg-server';
import { useAuth } from '../context/AuthContext';
import { useDeckCardScanUrl } from '../context/CardImagesContext';
import { DuoDialog } from '../duo/DuoDialog';
import { ShellButton } from '../components/ui/ShellButton';
import { BoardInteractionService } from '../table/BoardInteractionService';
import { Board2DCanvas } from '../table/board2d/Board2DCanvas';
import type { Board3dGameActions } from '../table/board3d/board3dGameActions';
import { TablePrimaryActionProvider } from '../table/hud/TablePrimaryAction';
import { TableBoardOverlay } from '../table/hud/TableBoardOverlay';
import { TablePromptLayer } from '../table/prompts/TablePromptLayer';
import { gameStateToLocal, mergeStateChange } from '../table/gameSessionUtils';
import type { LocalGameState } from '../table/types/localGameState';
import { getTutorial, isTutorialMismatch, restartTutorial, tutorialAction, tutorialErrorMessage,
  type TutorialEngineAction, type TutorialOperation, type TutorialState } from './tutorialApi';
import styles from './TutorialPage.module.css';
import { ECONOMY_API_ENABLED, useEconomy } from '../collection/EconomyContext';
import { appConfig } from '../env/config';
import { starterGifts, starterGiftSeenKey } from './starterGifts';
import { TutorialRewardScene } from './TutorialRewardScene';

const EMPTY_CATALOG: Card[] = [];
const YOU = 1;

/** Only the transport differs from TablePage: all card, drag, menu and prompt UI is live-table UI. */
export function TutorialPage() {
  const navigate = useNavigate();
  const { user, cardsInfo, serverConfig } = useAuth();
  const economy = useEconomy();
  const gifts = useMemo(() => starterGifts(economy.snapshot, user?.userId ?? 0, appConfig.apiUrl), [economy.snapshot, user?.userId]);
  const giftSeenKey = starterGiftSeenKey(user?.userId ?? 0, gifts);
  const giftsSeen = useMemo(() => {
    try { return !!giftSeenKey && localStorage.getItem(giftSeenKey) === '1'; } catch { return false; }
  }, [giftSeenKey]);
  const giftStatus = !ECONOMY_API_ENABLED ? 'empty' : economy.status === 'error' ? 'error' :
    economy.status !== 'ready' || economy.snapshot?.userId !== user?.userId ? 'loading' : gifts.length ? 'ready' : 'empty';
  const catalog = cardsInfo?.cards ?? EMPTY_CATALOG;
  const getScanUrl = useDeckCardScanUrl(serverConfig?.scansUrl);
  const [tutorial, setTutorial] = useState<TutorialState | null>(null);
  const [localGame, setLocalGame] = useState<LocalGameState | null>(null);
  const [loadError, setLoadError] = useState('');
  const [hint, setHint] = useState('');
  const [pending, setPending] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [promptAttempt, setPromptAttempt] = useState(0);
  const [exitOpen, setExitOpen] = useState(false);
  const lessonRef = useRef<HTMLElement | null>(null);
  const [lessonHeight, setLessonHeight] = useState(0);
  const generationRef = useRef(0);
  const sessionKey = `${user?.userId}:${reloadNonce}`;
  const activeSessionRef = useRef(sessionKey);
  activeSessionRef.current = sessionKey;
  const pendingRef = useRef(false);
  const tutorialRef = useRef<TutorialState | null>(null);
  const boardInteraction = useMemo(() => new BoardInteractionService(), [user?.userId, reloadNonce]);

  const apply = useCallback((next: TutorialState) => {
    tutorialRef.current = next;
    setTutorial(next);
    setLocalGame(previous => {
      if (next.stage !== 'battle' || !next.battle) return null;
      // Keep the live board's local identity: accepted sub-actions must not reset drafts/animations.
      return previous ? mergeStateChange(previous, next.battle.stateData, next.battle.playerStats, false) : gameStateToLocal(next.battle);
    });
  }, []);

  useLayoutEffect(() => {
    const generation = ++generationRef.current;
    const controller = new AbortController();
    pendingRef.current = false; tutorialRef.current = null;
    setTutorial(null); setLocalGame(null); setPending(false); setLoadError(''); setHint(''); setExitOpen(false);
    void getTutorial(controller.signal).then(next => {
      if (generation === generationRef.current) apply(next);
    }).catch(error => {
      if (!controller.signal.aborted && generation === generationRef.current) setLoadError(tutorialErrorMessage(error));
    });
    return () => { controller.abort(); generationRef.current++; boardInteraction.endBoardSelection(); };
  }, [user?.userId, reloadNonce, apply, boardInteraction]);

  useEffect(() => {
    if (tutorial?.stage === 'home') navigate('/games', { replace: true });
  }, [tutorial?.stage, navigate]);

  useEffect(() => {
    if (localGame) boardInteraction.updateGameLogs(localGame.logs);
  }, [localGame, boardInteraction]);

  useLayoutEffect(() => {
    const lesson = lessonRef.current;
    if (!lesson) return;
    const measure = () => setLessonHeight(Math.ceil(lesson.getBoundingClientRect().height));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(lesson);
    return () => observer.disconnect();
  }, [tutorial?.stage, loadError]);

  useLayoutEffect(() => {
    const name = tutorial?.instruction?.target === 'hand' ? tutorial.instruction.cardFullName : undefined;
    if (!name || !localGame) return;
    const index = localGame.state.players[0].hand.cards.findIndex(card => card.fullName === name);
    const frame = requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[data-board2d-hand="bottom"] [data-hand-index="${index}"]`)
        ?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'auto' });
    });
    return () => cancelAnimationFrame(frame);
  }, [tutorial?.step, tutorial?.instruction, localGame]);

  const send = useCallback(async (operation: TutorialOperation, action?: TutorialEngineAction): Promise<void> => {
    const current = tutorialRef.current;
    if (activeSessionRef.current !== sessionKey) throw new Error('教学会话已切换。');
    if (!current) throw new Error('教学还未加载。');
    // Never report a concurrent action as success: the live board needs rejection for rollback.
    if (pendingRef.current) throw new Error('上一项操作正在保存，请稍候。');
    pendingRef.current = true; setPending(true); setHint('');
    const generation = generationRef.current;
    const isCurrent = () => generation === generationRef.current && activeSessionRef.current === sessionKey;
    try {
      // Reward presentation reads existing registration receipts; it never grants again.
      if (operation === 'finish') await economy.refresh();
      if (!isCurrent()) throw new Error('教学会话已切换。');
      const next = await tutorialAction({ version: current.version, step: current.step, revision: current.revision, operation, action });
      if (!isCurrent()) throw new Error('教学会话已切换。');
      apply(next);
    } catch (error) {
      if (isCurrent()) {
        if (isTutorialMismatch(error)) {
          try {
            const fresh = await getTutorial();
            if (isCurrent()) apply(fresh);
          } catch { /* Keep the last accepted board; user can retry. */ }
        }
        if (isCurrent()) {
          const message = tutorialErrorMessage(error);
          const instruction = tutorialRef.current?.instruction;
          setHint(instruction && !isTutorialMismatch(error)
            ? `${message} 当前操作：${instruction.description}` : message);
          // A failed board-selection confirmation ends its local selection; re-arm the same prompt.
          setPromptAttempt(attempt => attempt + 1);
        }
      }
      throw error;
    } finally {
      if (isCurrent()) { pendingRef.current = false; setPending(false); }
    }
  }, [apply, sessionKey, economy.refresh]);

  const gameActions = useMemo<Board3dGameActions>(() => {
    const act = (action: TutorialEngineAction) => send('act', action);
    const unsupported = async () => {
      if (activeSessionRef.current !== sessionKey) throw new Error('教学会话已切换。');
      const message = '这一步不使用特性或场地，请按教学说明操作。';
      setHint(message);
      throw new Error(message);
    };
    return {
      playCardAction: (_gameId, handIndex, target) => act({ type: 'playCard', handIndex, target }),
      resolvePrompt: (_gameId, id, result) => act({ type: 'resolvePrompt', id, result }),
      retreatStart: () => act({ type: 'retreatStart' }),
      retreatAction: (_gameId, to) => act({ type: 'retreat', to }),
      attack: (_gameId, attack) => act({ type: 'attack', attack }),
      ability: unsupported, trainerAbility: unsupported, energyAbility: unsupported, stadium: unsupported,
    };
  }, [send, sessionKey]);

  // The prompt layer has no optimistic card flight and invokes callbacks with `void`.
  // Consume rejection at this UI boundary only; the transport/board adapter always rejects.
  const onResolvePrompt = useCallback((id: number, result: unknown) => {
    void promptAttempt; // Identity change re-arms an unchanged prompt after a rejected selection.
    return gameActions.resolvePrompt(-1, id, result).catch(() => undefined);
  }, [gameActions, promptAttempt]);
  const onPassTurn = useCallback(() => send('act', { type: 'passTurn' }), [send]);
  const operate = async (operation: TutorialOperation, leave = false) => {
    try { await send(operation); if (leave) navigate('/games'); }
    catch { /* send displays the error and retains the current accepted state. */ }
  };

  const recover = async () => {
    if (pendingRef.current) return;
    const generation = generationRef.current;
    pendingRef.current = true; setPending(true);
    try {
      await restartTutorial();
      if (generation === generationRef.current) navigate('/games');
    } catch (error) {
      if (generation === generationRef.current) setLoadError(tutorialErrorMessage(error));
    } finally {
      if (generation === generationRef.current) { pendingRef.current = false; setPending(false); }
    }
  };

  if (loadError) return <CenterShell><h1>教学暂时不可用</h1><p role="alert">{loadError}</p>
    <ShellButton disabled={pending} onClick={() => navigate('/games')}>返回大厅</ShellButton>
    <ShellButton disabled={pending} onClick={() => setReloadNonce(n => n + 1)}>重试</ShellButton>
    <ShellButton variant="secondary" disabled={pending} onClick={() => void recover()}>从主页导览重新开始</ShellButton></CenterShell>;
  if (!tutorial || tutorial.stage === 'home') return <CenterShell><p>正在布置教学牌桌……</p></CenterShell>;
  if (tutorial.stage === 'skipped') return <CenterShell><h1>教学已暂停</h1><p>已确认的操作都已保存，可以继续之前的对局。</p>
    <ShellButton disabled={pending} onClick={() => void operate('resume')}>继续教学</ShellButton>
    <ShellButton variant="secondary" onClick={() => navigate('/games')}>返回大厅</ShellButton>{hint && <p role="alert">{hint}</p>}</CenterShell>;
  if (tutorial.stage === 'done') {
    const markSeen = () => {
      if (giftStatus === 'ready' && giftSeenKey) {
        try { localStorage.setItem(giftSeenKey, '1'); } catch { /* Presentation can replay; ownership never changes. */ }
      }
    };
    const leaveReward = (path: string) => { markSeen(); navigate(path); };
    return <TutorialRewardScene key={`${user?.userId}:${giftSeenKey ?? 'pending'}`} gifts={gifts} status={giftStatus}
      animate={!giftsSeen} error={hint || economy.error} onRetry={() => void economy.refresh()}
      onViewDecks={() => leaveReward('/deck')} onViewCollection={() => leaveReward('/collection')}
      onDone={() => leaveReward('/games')} onRestart={() => { if (!pending) { markSeen(); void operate('restart', true); } }} />;
  }
  if (!localGame) return <CenterShell><p>教学牌桌尚未加载。</p></CenterShell>;

  const bottomPlayer = localGame.state.players[0];
  const topPlayer = localGame.state.players[1];
  const finished = localGame.state.phase === GamePhase.FINISHED;
  const instruction = tutorial.instruction;
  return <TablePrimaryActionProvider key={`${user?.userId}:${reloadNonce}`}>
    <div className={styles.root} style={{ '--table-prompt-top': `${lessonHeight + 8}px` } as CSSProperties}>
      <header ref={lessonRef} className={styles.lesson}>
        <div className={styles.heading}>
          <span className={styles.progress}>教学 · {Math.min(tutorial.step + 1, tutorial.battleTotal)} / {tutorial.battleTotal}</span>
          <strong>{instruction?.title ?? '教学对局获胜'}</strong>
          <ShellButton variant="secondary" disabled={pending} onClick={() => setExitOpen(true)}>退出</ShellButton>
        </div>
        <p className={styles.instruction}>{instruction?.description ?? '对手没有替补宝可梦，按正式规则获胜。'}</p>
        <details className={styles.help}><summary>操作说明与规则</summary><p>电脑和洗牌固定，卡牌拖动、卡牌菜单、目标选择和确认均与正式对局相同。手机直接向上拖动手牌到目标；横向滑动浏览手牌。短屏可上下滑动桌垫查看远端区域，点牌可查看放大详情。只有本步允许的动作可以保存，错误落点会回弹。完成攻击或结束回合使用正式桌上的控件。</p><p>拿完全部奖赏、对手没有场上宝可梦，或对手回合开始无牌可抽，均可获胜。本教学不消耗游戏元、不占收藏、不计入正式战绩。</p></details>
        {hint && <p className={styles.error} role="alert">{hint}</p>}
        <span className={styles.saving} role="status">{pending ? '保存中…' : '已确认的操作会自动保存'}</span>
      </header>
      <section className={styles.table} aria-label="教学牌桌" aria-busy={pending}>
        <Board2DCanvas gameState={localGame} topPlayer={topPlayer} bottomPlayer={bottomPlayer}
          topPlayerHand={topPlayer.hand} bottomPlayerHand={bottomPlayer.hand} clientId={YOU} catalog={catalog}
          boardInteraction={boardInteraction} gameActions={gameActions} onPassTurn={onPassTurn} />
        <TableBoardOverlay localGame={localGame} clientId={YOU} topPlayer={topPlayer} bottomPlayer={bottomPlayer}
          isPlaying isObserver={false} onPassTurn={() => { void onPassTurn().catch(() => undefined); }}
          onLeave={() => setExitOpen(true)} onSwitchSides={() => {}}
          onSendChat={async () => { throw new Error('教学对局没有聊天通道。'); }}
          chatEnabled={false} contained chatClientId={0} onReplayStep={() => {}} boardFps={null} />
        <TablePromptLayer localGame={localGame} clientId={YOU} catalog={catalog} getScanUrl={getScanUrl}
          boardInteraction={boardInteraction} onResolvePrompt={onResolvePrompt} />
      </section>
      {exitOpen && <DuoDialog title="离开教学对局？" onClose={() => setExitOpen(false)}>
        <p>已确认的每个操作都已保存，中途提示也可以恢复。未确认的拖动与选择不会保存。</p>
        <div className={styles.actions}>
          <ShellButton variant="secondary" onClick={() => setExitOpen(false)}>继续教学</ShellButton>
          <ShellButton variant="secondary" disabled={pending} onClick={() => navigate('/games')}>稍后再学</ShellButton>
          <ShellButton disabled={pending} onClick={() => void operate('skip', true)}>跳过教学</ShellButton>
        </div>
        {hint && <p role="alert">{hint}</p>}
      </DuoDialog>}
      {finished && !exitOpen && <DuoDialog title="教学对局完成！" onClose={() => navigate('/games')}>
        <p>对手最后一只宝可梦昏厥，没有替补。你已按正式规则赢得教学对局。</p>
        <div className={styles.actions}>
          <ShellButton variant="secondary" disabled={pending} onClick={() => navigate('/games')}>稍后再学</ShellButton>
          <ShellButton disabled={pending} onClick={() => void operate('finish')}>完成教学</ShellButton>
        </div>
        {hint && <p role="alert">{hint}</p>}
      </DuoDialog>}
    </div>
  </TablePrimaryActionProvider>;
}

function CenterShell({ children }: { children: ReactNode }) {
  return <div className={styles.center}><div className={styles.centerCard}>{children}</div></div>;
}
