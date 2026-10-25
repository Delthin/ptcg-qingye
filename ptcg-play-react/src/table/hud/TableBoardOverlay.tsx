import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Player, StateLog } from 'ptcg-server';
import type { LocalGameState } from '../types/localGameState';
import { TablePlayerBar } from './TablePlayerBar';
import { TablePlayerActions } from './TablePlayerActions';
import { TableThemePicker } from './TableThemePicker';
import { TableBgmPicker } from './TableBgmPicker';
import { TableReplayControls } from './TableReplayControls';
import { TableGameLogToasts } from './TableGameLogToasts';
import { TableGameLogsPrompt } from './TableGameLogsPrompt';
import { TableChat, type ChatSend } from './TableChat';
import { AdminSpectatorControls, type AdminSpectatorReveal } from './AdminSpectatorControls';
import styles from './TableBoardOverlay.module.css';

export type TableBoardOverlayProps = {
  localGame: LocalGameState;
  clientId: number;
  topPlayer: Player;
  bottomPlayer: Player;
  isPlaying: boolean;
  isObserver: boolean;
  showAdminSpectatorControls?: boolean;
  adminSpectatorReveal?: AdminSpectatorReveal;
  onAdminSpectatorRevealChange?: (next: AdminSpectatorReveal) => void;
  onPassTurn: () => void;
  onLeave: () => void;
  onSwitchSides: () => void;
  onSendChat: ChatSend;
  chatClientId: number;
  /** Private HTTP teaching sessions have no chat transport. */
  chatEnabled?: boolean;
  /** Anchor HUD below an external lesson header rather than to the viewport. */
  contained?: boolean;
  onReplayStep: (position: number, state: LocalGameState['state'], logs: LocalGameState['logs']) => void;
  boardFps: number | null;
};

export function TableBoardOverlay(props: TableBoardOverlayProps) {
  const { t } = useTranslation();
  const [logsOpen, setLogsOpen] = useState(false);
  const [sessionLogs, setSessionLogs] = useState<StateLog[]>([]);
  const [chatMuted, setChatMuted] = useState(false);
  useEffect(() => { setChatMuted(false); setLogsOpen(false); }, [props.localGame.gameId]);
  const { localGame, clientId, topPlayer, bottomPlayer, isPlaying, isObserver, onLeave, onSwitchSides, onSendChat, onReplayStep, showAdminSpectatorControls, adminSpectatorReveal, onAdminSpectatorRevealChange } = props;
  const timeLimit = localGame.timeLimit ?? 0;
  const topStats = localGame.playerStats?.find(s => s.clientId === topPlayer.id);
  const bottomStats = localGame.playerStats?.find(s => s.clientId === bottomPlayer.id);
  useEffect(() => { setSessionLogs([]); }, [localGame.localId]);
  useEffect(() => {
    setSessionLogs(previous => {
      const byId = new Map(previous.map(log => [log.id, log]));
      for (const log of localGame.logs) byId.set(log.id, log);
      return [...byId.values()].sort((a,b) => a.id-b.id);
    });
  }, [localGame.logs]);
  const chatClientId = props.chatClientId;
  const visibleLogs = sessionLogs.filter(log => !chatMuted || log.message !== 'LOG_TEXT' || log.client === chatClientId);
  // Chat has its own bubbles; never replay chat as game-log toast notifications.
  const toastGame = { ...localGame, logs: localGame.logs.filter(log => log.message !== 'LOG_TEXT') };
  return <div className={`${styles.root} ${props.contained ? styles.contained : ''}`}>
    {timeLimit > 0 ? <>
      <div className={styles.clockTop}><TablePlayerBar player={topPlayer} isActive={false} playerStats={topStats} timeLimit={timeLimit} clockOnly /></div>
      <div className={styles.clockSelf}><TablePlayerBar player={bottomPlayer} isActive={false} playerStats={bottomStats} timeLimit={timeLimit} clockOnly /></div>
    </> : null}
    <div className={styles.toolbar}>
      <TableThemePicker />
      <TableBgmPicker />
      {props.chatEnabled !== false && <TableChat key={localGame.gameId} logs={localGame.replay ? localGame.logs : sessionLogs} liveLogs={localGame.logs} players={localGame.state.players} clientId={chatClientId} topPlayerId={topPlayer.id}
        canSend={!localGame.replay && !localGame.deleted && chatClientId !== 0 && localGame.state.players.some(player => player.id === chatClientId)}
        isReplay={!!localGame.replay} muted={chatMuted} onMutedChange={setChatMuted} onSendChat={onSendChat} />}
      <button type="button" className={styles.logsButton} aria-label={t('TABLE_LOGS')} aria-expanded={logsOpen} onClick={() => setLogsOpen(true)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 5c4-1 7 0 9 2 2-2 5-3 9-2v14c-4-1-7 0-9 2-2-2-5-3-9-2V5Z" /><path d="M12 7v14" /></svg>
      </button>
      <TablePlayerActions localGame={localGame} clientId={clientId} isPlaying={isPlaying} isObserver={isObserver} onPassTurn={props.onPassTurn} onLeave={onLeave} onSwitchSides={onSwitchSides} />
    </div>
    {!localGame.replay ? <div className={styles.eventColumn}><TableGameLogToasts localGame={toastGame} clientId={clientId} players={localGame.state.players} contained={props.contained} /></div> : null}
    {localGame.replay ? <div className={styles.replayControls}><TableReplayControls localGame={localGame} replay={localGame.replay} onStep={onReplayStep} /></div> : null}
    {logsOpen ? <TableGameLogsPrompt logs={localGame.replay ? localGame.logs.filter(log => !chatMuted || log.message !== 'LOG_TEXT' || log.client === chatClientId) : visibleLogs} localGame={localGame} clientId={clientId} players={localGame.state.players} onClose={() => setLogsOpen(false)} /> : null}
    {showAdminSpectatorControls && adminSpectatorReveal && onAdminSpectatorRevealChange ? <div className={styles.adminSpectatorControls}>
      <AdminSpectatorControls reveal={adminSpectatorReveal} onRevealChange={onAdminSpectatorRevealChange} />
    </div> : null}
  </div>;
}
