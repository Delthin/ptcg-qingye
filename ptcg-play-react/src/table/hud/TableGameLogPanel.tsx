import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { StateLog } from 'ptcg-server';
import type { Player } from 'ptcg-server';
import { GamePhase } from 'ptcg-server';
import type { LocalGameState } from '../types/localGameState';
import { TableChatComposer, type ChatSend } from './TableChat';
import { formatGameLogLine, logAccent } from './gameLogUtils';
import { cn } from '../../utils/cn';
import styles from './TableGameLogPanel.module.css';

export type TableGameLogPanelProps = {
  localGame: LocalGameState;
  clientId: number;
  players: Player[];
  onSendChat: ChatSend;
  /** When set, collapse state is controlled by the parent (e.g. to shrink the HUD column). */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
};

function logPlayerName(log: StateLog, players: Player[]): string {
  if (log.client === 0) {
    return 'System';
  }
  return players.find((p) => p.id === log.client)?.name ?? `Player ${log.client}`;
}

function isLogHidden(log: StateLog, clientId: number): boolean {
  return String(log.params?.private) === 'true' && log.client !== clientId && log.client !== 0;
}

export function TableGameLogPanel(props: TableGameLogPanelProps) {
  const { t } = useTranslation();
  const { localGame, clientId, players, onSendChat, collapsed: collapsedProp, onCollapsedChange } = props;
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = collapsedProp ?? internalCollapsed;
  const setCollapsed = (next: boolean) => {
    onCollapsedChange?.(next);
    if (collapsedProp === undefined) {
      setInternalCollapsed(next);
    }
  };
  const listRef = useRef<HTMLUListElement>(null);
  /** When true, new log lines snap the list to the bottom; scrolling up clears this. */
  const stickToBottomRef = useRef(true);

  const activeId =
    localGame.state.phase === GamePhase.PLAYER_TURN
      ? localGame.state.players[localGame.state.activePlayer]?.id
      : undefined;

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const thresholdPx = 56;
    const updateStick = () => {
      stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= thresholdPx;
    };
    updateStick();
    el.addEventListener('scroll', updateStick, { passive: true });
    return () => el.removeEventListener('scroll', updateStick);
  }, [collapsed]);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el || collapsed) return;
    if (stickToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [localGame.logs.length, collapsed]);

  return (
    <div className={cn(styles.root, collapsed && styles.rootCollapsed)}>
      <div className={styles.collapseBar}>
        <button
          type="button"
          className={styles.collapseBtn}
          aria-expanded={!collapsed}
          aria-controls="table-game-log-panel-body"
          title={
            collapsed
              ? t('REACT_SHOW_MESSAGES', { defaultValue: 'Show messages' })
              : t('REACT_HIDE_MESSAGES', { defaultValue: 'Hide messages' })
          }
          onClick={() => setCollapsed(!collapsed)}
        >
          <span className={cn(styles.chevron, collapsed && styles.chevronExpanded)} aria-hidden>
            {'\u25BC'}
          </span>
        </button>
      </div>

      {collapsed ? (
        <p className={styles.collapsedTitle}>{t('TABLE_LOGS')}</p>
      ) : (
        <div id="table-game-log-panel-body" className={styles.panelBody}>
          <h4 className={styles.header}>{t('TABLE_LOGS')}</h4>
          <ul ref={listRef} className={styles.list} aria-label={t('TABLE_LOGS')}>
            {localGame.logs.map((log, logIndex) => {
              if (isLogHidden(log, clientId)) {
                return null;
              }
              const name = logPlayerName(log, players);
              const isActiveSpeaker = log.client !== 0 && log.client === activeId;
              const line = formatGameLogLine(t, log);
              const ts = log.params?.timestamp != null ? String(log.params.timestamp) : '';
              return (
                <li key={`${log.id}-${logIndex}`} className={styles.row}>
                  <span
                    className={styles.dot}
                    data-accent={logAccent(log.message)}
                    aria-hidden="true"
                  />
                  {ts ? <span className={styles.ts}>[{ts}]</span> : null}
                  <span
                    className={cn(
                      styles.name,
                      name === 'System' && styles.nameSystem,
                      isActiveSpeaker && styles.nameActive,
                    )}
                  >
                    {name}:
                  </span>
                  <span>{line}</span>
                </li>
              );
            })}
          </ul>
          <div className={styles.footer}>
            <TableChatComposer canSend={!localGame.replay && !localGame.deleted && players.some(player => player.id === clientId)} onSendChat={onSendChat} />
          </div>
        </div>
      )}
    </div>
  );
}
