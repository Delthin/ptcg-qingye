export const CHAT_EMOTES: Readonly<Record<string, string>> = Object.freeze({
  smile: '😊', wave: '👋', thinking: '🤔', clap: '👏',
  thanks: '🙏', gg: '🤝', wow: '😮', cheer: '🎉'
});

export type ChatPayload = { gameId: number; message?: unknown; kind?: unknown; emoteId?: unknown };
export type ChatMessage = { text: string; kind: 'text' | 'emote'; emoteId?: string };

/** Legacy callers without kind remain text messages. No client metadata is copied. */
export function parseChatMessage(payload: ChatPayload): ChatMessage | undefined {
  if (payload.kind === 'emote') {
    if (typeof payload.emoteId !== 'string' || !Object.prototype.hasOwnProperty.call(CHAT_EMOTES, payload.emoteId)) {
      return undefined;
    }
    return { text: CHAT_EMOTES[payload.emoteId], kind: 'emote', emoteId: payload.emoteId };
  }
  if (payload.kind !== undefined && payload.kind !== 'text') return undefined;
  if (typeof payload.message !== 'string') return undefined;
  const text = payload.message.trim();
  // Count Unicode code points, not UTF-16 units; React renders this as plain text.
  if (!text || Array.from(text).length > 120) return undefined;
  return { text, kind: 'text' };
}

/** Shared across sockets, keyed by the actual game and authenticated account.
 * Weak game keys release the history when the game is removed from Core. */
export class ChatRateLimiter {
  private readonly games = new WeakMap<object, Map<number, number[]>>();

  public allow(game: object, userId: number, now = Date.now()): boolean {
    let users = this.games.get(game);
    if (!users) { users = new Map(); this.games.set(game, users); }
    const history = (users.get(userId) || []).filter(time => now - time < 30000);
    if (history.length >= 8 || (history.length > 0 && now - history[history.length - 1] < 2000)) return false;
    history.push(now);
    users.set(userId, history);
    return true;
  }
}

export const chatRateLimiter = new ChatRateLimiter();
