import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Player, StateLog } from 'ptcg-server';
import { isLogHidden, logPlayerName } from './gameLogUtils';
import { DuoSwitch } from '../../duo/DuoSwitch';
import styles from './TableChat.module.css';

export type ChatSend = (message: string, emoteId?: string) => Promise<void>;
const EMOTES = [
  ['smile', '😊', '微笑'], ['wave', '👋', '招手'], ['thinking', '🤔', '思考'], ['clap', '👏', '鼓掌'],
  ['thanks', '🙏', '感谢'], ['gg', '🤝', '好对局'], ['wow', '😮', '惊喜'], ['cheer', '🎉', '庆祝'],
] as const;
const PHRASES = ['你好', '请多指教', '稍等一下', '打得漂亮', '谢谢', '好对局'];

export function chatLogText(log: StateLog): string {
  if (log.params?.kind === 'emote') {
    const emote = EMOTES.find(([id]) => id === log.params?.emoteId);
    if (emote) return emote[1];
  }
  return typeof log.params?.text === 'string' ? log.params.text : '';
}

/** Also used by the legacy log input: all sending paths wait for server ack. */
export function TableChatComposer({ canSend, onSendChat }: { canSend: boolean; onSendChat: ChatSend }) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const composing = useRef(false);
  const inFlight = useRef(false);
  const input = useRef<HTMLTextAreaElement>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const count = Array.from(draft.trim()).length;
  const send = async (message: string, emoteId?: string, clearDraft = false) => {
    if (!canSend || inFlight.current || composing.current) return;
    const text = message.trim();
    if (!emoteId && (!text || Array.from(text).length > 120)) {
      setError('请输入 1–120 个字（按 Unicode 码点计数）。');
      return;
    }
    inFlight.current = true;
    setSending(true);
    setError('');
    try {
      await onSendChat(text, emoteId);
      if (mounted.current && clearDraft) setDraft('');
    } catch {
      if (mounted.current) setError('发送失败，草稿已保留。请检查连接或稍后重试：每 2 秒一次，30 秒内最多 8 条。');
    } finally {
      inFlight.current = false;
      if (mounted.current) setSending(false);
    }
  };
  return <div className={styles.composer}>
    <div className={styles.emotes} aria-label="预设表情">
      {EMOTES.map(([id, emoji, label]) => <button key={id} type="button" title={label} aria-label={label} disabled={!canSend || sending} onClick={() => void send('', id)}>{emoji}</button>)}
    </div>
    <div className={styles.phrases} aria-label="快捷语">
      {PHRASES.map(phrase => <button key={phrase} type="button" disabled={!canSend || sending} onClick={() => void send(phrase)}>{phrase}</button>)}
    </div>
    <textarea ref={input} aria-label="聊天消息" placeholder={canSend ? '输入中文消息，Enter 发送，Shift+Enter 换行' : '旁观与回放只可查看聊天'} rows={2} value={draft} disabled={!canSend || sending}
      onChange={e => setDraft(e.target.value)}
      onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }}
      onKeyDown={e => {
        if (e.key === 'Enter' && !e.shiftKey && !composing.current && !e.nativeEvent.isComposing && e.nativeEvent.keyCode !== 229) {
          e.preventDefault();
          void send(draft, undefined, true);
        }
      }} />
    <div className={styles.sendRow}><span data-invalid={count > 120}>{count}/120</span><button type="button" disabled={!canSend || sending || count === 0 || count > 120} onClick={() => void send(draft, undefined, true)}>{sending ? '发送中…' : '发送'}</button></div>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
  </div>;
}

export type TableChatProps = {
  logs: StateLog[];
  liveLogs: StateLog[];
  players: Player[];
  clientId: number;
  topPlayerId: number;
  canSend: boolean;
  isReplay: boolean;
  muted: boolean;
  onMutedChange: (muted: boolean) => void;
  onSendChat: ChatSend;
};

export function TableChat({ logs, liveLogs, players, clientId, topPlayerId, canSend, isReplay, muted, onMutedChange, onSendChat }: TableChatProps) {
  const [open, setOpen] = useState(false);
  const [bubble, setBubble] = useState<StateLog | null>(null);
  const seenId = useRef(Math.max(0, ...liveLogs.map(log => log.id)));
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const history = useRef<HTMLUListElement>(null);
  const messages = logs.filter(log => log.message === 'LOG_TEXT' && !isLogHidden(log, clientId) && (!muted || log.client === clientId)).slice(-100);

  useEffect(() => {
    const fresh = liveLogs.filter(log => log.id > seenId.current);
    seenId.current = Math.max(seenId.current, ...liveLogs.map(log => log.id));
    if (isReplay) { setBubble(null); return; }
    const newest = fresh.filter(log => log.message === 'LOG_TEXT' && !isLogHidden(log, clientId) && (!muted || log.client === clientId)).at(-1);
    if (newest) setBubble(newest);
  }, [liveLogs, isReplay, muted, clientId]);
  useEffect(() => {
    if (!bubble) return;
    const timeout = window.setTimeout(() => setBubble(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [bubble]);
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLTextAreaElement>('textarea:not(:disabled)')?.focus();
  }, [open]);
  useEffect(() => {
    const list = history.current;
    if (open && list) list.scrollTop = list.scrollHeight;
  }, [open, logs, muted]);
  const close = () => { setOpen(false); button.current?.focus(); };

  return <>
    <button ref={button} type="button" className={styles.chatButton} aria-expanded={open} aria-controls="table-chat-panel" onClick={() => setOpen(value => !value)}>💬 聊天</button>
    {!isReplay && bubble && (!muted || bubble.client === clientId) ? <div className={`${styles.bubble} ${bubble.client === topPlayerId ? styles.bubbleTop : styles.bubbleBottom}`} aria-live="polite"><strong>{logPlayerName(bubble, players)}</strong><span>{chatLogText(bubble)}</span></div> : null}
    {createPortal(<div ref={panel} id="table-chat-panel" hidden={!open} className={styles.panel} role="dialog" aria-labelledby="table-chat-title" onKeyDown={e => {
      if (e.key === 'Escape' && !e.nativeEvent.isComposing) { e.stopPropagation(); close(); }
    }}>
      <header><h2 id="table-chat-title">局内交流{isReplay ? ' · 回放' : ''}</h2><button type="button" aria-label="关闭聊天" onClick={close}>关闭</button></header>
      <DuoSwitch checked={muted} onChange={onMutedChange}>本局静音对方</DuoSwitch>
      <ul ref={history} className={styles.history} aria-label="最近聊天记录">
        {messages.length ? messages.map(log => <li key={log.id} data-self={log.client === clientId}><strong>{logPlayerName(log, players)}{log.client === clientId ? '（我）' : ''}</strong><span>{chatLogText(log)}</span></li>) : <li className={styles.empty}>{muted ? '对方消息已静音' : '暂无聊天记录'}</li>}
      </ul>
      <TableChatComposer canSend={canSend} onSendChat={onSendChat} />
      <p className={styles.note}>交流不影响游戏规则。静音只对本局生效。</p>
    </div>, document.body)}
  </>;
}
