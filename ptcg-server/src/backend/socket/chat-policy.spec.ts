import { CHAT_EMOTES, ChatRateLimiter, parseChatMessage } from './chat-policy';

describe('chat policy', () => {
  it('preserves Chinese and HTML as opaque text, including legacy messages', () => {
    expect(parseChatMessage({ gameId: 1, message: '  你好 <b>朋友</b> {{text}}  ' })).toEqual({
      kind: 'text', text: '你好 <b>朋友</b> {{text}}'
    });
  });

  it('accepts exactly 120 Unicode code points, including astral emoji', () => {
    expect(parseChatMessage({ gameId: 1, message: '😊'.repeat(120) })?.text).toBe('😊'.repeat(120));
    expect(parseChatMessage({ gameId: 1, message: '中'.repeat(120) })?.text).toBe('中'.repeat(120));
    expect(parseChatMessage({ gameId: 1, message: '😊'.repeat(121) })).toBeUndefined();
  });

  it('rejects empty, oversized, non-string and unknown-kind messages', () => {
    for (const message of ['', ' \n ', '中'.repeat(121), {}, 42, null, undefined]) {
      expect(parseChatMessage({ gameId: 1, message })).toBeUndefined();
    }
    expect(parseChatMessage({ gameId: 1, message: '你好', kind: 'html' })).toBeUndefined();
  });

  it('only accepts own whitelist emote IDs, never magic text or prototype keys', () => {
    expect(Object.keys(CHAT_EMOTES).length).toBe(8);
    expect(parseChatMessage({ gameId: 1, kind: 'emote', emoteId: 'wave', message: '<script>' })).toEqual({
      text: '👋', kind: 'emote', emoteId: 'wave'
    });
    for (const emoteId of ['__proto__', 'toString', 'constructor', '👋', 'bad', 1, undefined]) {
      expect(parseChatMessage({ gameId: 1, kind: 'emote', emoteId })).toBeUndefined();
    }
    expect(parseChatMessage({ gameId: 1, message: ':emote:wave' })).toEqual({ text: ':emote:wave', kind: 'text' });
  });

  it('enforces 2-second cooldown per account and game without extending it on rejection', () => {
    const limiter = new ChatRateLimiter();
    const game = {};
    expect(limiter.allow(game, 10, 0)).toBe(true);
    expect(limiter.allow(game, 10, 1999)).toBe(false);
    expect(limiter.allow(game, 10, 2000)).toBe(true);
    expect(limiter.allow(game, 11, 2000)).toBe(true);
    expect(limiter.allow({}, 10, 2000)).toBe(true);
  });

  it('caps a burst at 8 messages per rolling 30 seconds and recovers at the boundary', () => {
    const limiter = new ChatRateLimiter();
    const game = {};
    for (let i = 0; i < 8; i++) expect(limiter.allow(game, 10, i * 2000)).toBe(true);
    expect(limiter.allow(game, 10, 16000)).toBe(false);
    expect(limiter.allow(game, 10, 29999)).toBe(false);
    expect(limiter.allow(game, 10, 30000)).toBe(true);
  });
});
