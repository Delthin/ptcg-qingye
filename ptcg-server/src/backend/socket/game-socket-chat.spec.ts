import { GameSocket } from './game-socket';
import { ApiErrorEnum } from '../common/errors';
import { AppendLogAction } from '../../game/store/actions/append-log-action';
import { GameLog } from '../../game/game-message';
import { ChatPayload } from './chat-policy';
import { Response } from './socket-wrapper';
import { Store } from '../../game/store/store';
import { Player } from '../../game/store/state/player';
import { GamePhase } from '../../game/store/state/state';

describe('game:action:appendLog chat boundary', () => {
  let client: any;
  let game: any;
  let core: any;
  let handlers: Record<string, (params: ChatPayload, response: Response<void>) => void>;
  let response: jasmine.Spy;
  let now: number;

  function attach(connection: any) {
    const listeners: typeof handlers = {};
    new GameSocket(connection, {
      addListener: (event: string, handler: any) => { listeners[event] = handler; }
    } as any, core, {} as any);
    return listeners;
  }

  beforeEach(() => {
    now = 1000;
    spyOn(Date, 'now').and.callFake(() => now);
    client = { id: 7, user: { id: 42, name: '甲' } };
    game = {
      id: 9, clients: [client],
      state: { players: [{ id: 7 }, { id: 8 }] },
      getPlayerIdForUser: (id: number) => id === 42 ? 7 : undefined,
      dispatch: jasmine.createSpy('dispatch')
    };
    core = { games: [game] };
    handlers = attach(client);
    response = jasmine.createSpy('response');
  });

  it('returns immediately on every illegal length/type, never dispatching or acking ok', () => {
    for (const message of ['', '  ', '中'.repeat(121), 'x'.repeat(257), null, {}, 3]) {
      response.calls.reset();
      handlers['game:action:appendLog']({ gameId: 9, message }, response);
      expect(response.calls.count()).toBe(1);
      expect(response).toHaveBeenCalledWith('error', ApiErrorEnum.CANNOT_SEND_MESSAGE);
      expect(game.dispatch).not.toHaveBeenCalled();
    }
  });

  it('dispatches one compatible LOG_TEXT action, deriving sender only from auth', () => {
    handlers['game:action:appendLog']({ gameId: 9, message: '你好 <b>世界</b>', sender: 8, params: { private: true } } as any, response);
    expect(game.dispatch.calls.count()).toBe(1);
    const [sender, action] = game.dispatch.calls.mostRecent().args;
    expect(sender).toBe(client);
    expect(action instanceof AppendLogAction).toBe(true);
    expect(action.id).toBe(7);
    expect(action.message).toBe(GameLog.LOG_TEXT);
    expect(action.params).toEqual({ kind: 'text', text: '你好 <b>世界</b>' });
    expect(response).toHaveBeenCalledWith('ok');
  });

  it('rejects outsiders, unjoined connections, observers and accounts impersonating a player ID', () => {
    const cases = [
      { id: 8, user: { id: 999 } },
      { id: 7, user: { id: 999 } },
      { id: 99, user: { id: 42 } },
      { id: 7, user: { id: 42 } }
    ];
    for (const connection of cases) {
      response.calls.reset();
      game.clients = connection === cases[3] ? [] : [connection];
      attach(connection)['game:action:appendLog']({ gameId: 9, message: '不能发送' }, response);
      expect(response).toHaveBeenCalledWith('error', ApiErrorEnum.ACTION_INVALID);
      expect(game.dispatch).not.toHaveBeenCalled();
    }
    game.state.players = [{ id: 8 }];
    game.clients = [client];
    handlers['game:action:appendLog']({ gameId: 9, message: '没有席位' }, response);
    expect(game.dispatch).not.toHaveBeenCalled();
  });

  it('rejects missing/invalid game IDs (including replay IDs)', () => {
    for (const gameId of [0, 1234, NaN]) {
      handlers['game:action:appendLog']({ gameId, message: '回放不发送' }, response);
    }
    expect(game.dispatch).not.toHaveBeenCalled();
    expect(response.calls.count()).toBe(3);
    expect(response).toHaveBeenCalledWith('error', ApiErrorEnum.GAME_INVALID_ID);
  });

  it('uses explicit emote metadata and does not dispatch invalid emotes', () => {
    handlers['game:action:appendLog']({ gameId: 9, kind: 'emote', emoteId: 'constructor' }, response);
    expect(game.dispatch).not.toHaveBeenCalled();
    handlers['game:action:appendLog']({ gameId: 9, kind: 'emote', emoteId: 'clap' }, response);
    expect(game.dispatch.calls.mostRecent().args[1].params).toEqual({ kind: 'emote', emoteId: 'clap', text: '👏' });
  });

  it('shares cooldown and burst limits across connections of the same account', () => {
    const other = { id: 7, user: { id: 42 } };
    game.clients.push(other);
    const otherHandlers = attach(other);
    handlers['game:action:appendLog']({ gameId: 9, message: '第一条' }, response);
    otherHandlers['game:action:appendLog']({ gameId: 9, message: '绕过冷却' }, response);
    expect(game.dispatch.calls.count()).toBe(1);
    expect(response.calls.mostRecent().args).toEqual(['error', ApiErrorEnum.CANNOT_SEND_MESSAGE]);
    for (let i = 1; i < 8; i++) {
      now += 2000;
      otherHandlers['game:action:appendLog']({ gameId: 9, message: '合法间隔' }, response);
    }
    now += 2000;
    handlers['game:action:appendLog']({ gameId: 9, message: '超过突发限制' }, response);
    expect(game.dispatch.calls.count()).toBe(8);
    expect(response.calls.mostRecent().args).toEqual(['error', ApiErrorEnum.CANNOT_SEND_MESSAGE]);
  });

  it('preserves the existing log format and adds no rules effects or board changes', () => {
    const changed = jasmine.createSpy('stateChange');
    const store = new Store({ onStateChange: changed });
    store.state.phase = GamePhase.PLAYER_TURN;
    const player = new Player(); player.id = 7; player.name = '甲';
    store.state.players = [player];
    const { logs: ignoredLogs, ...before } = store.state;
    const expectedBoard = JSON.stringify(before);
    const reduceEffect = spyOn(store, 'reduceEffect').and.callThrough();
    const result = store.dispatch(new AppendLogAction(7, GameLog.LOG_TEXT, { text: '👏', kind: 'emote', emoteId: 'clap' }));
    const { logs, ...after } = result;
    expect(JSON.stringify(after)).toBe(expectedBoard);
    expect(logs.length).toBe(1);
    expect(logs[0].id).toBe(1);
    expect(logs[0].client).toBe(7);
    expect(logs[0].message).toBe(GameLog.LOG_TEXT);
    expect(logs[0].params.text).toBe('👏');
    expect(typeof logs[0].params.timestamp).toBe('string');
    expect(logs[0].params.emoteId).toBe('clap');
    expect(reduceEffect).not.toHaveBeenCalled();
    expect(changed.calls.count()).toBe(1);
  });

  it('keeps the error ack when dispatch fails instead of reporting success', () => {
    game.dispatch.and.throwError('test dispatch failure');
    handlers['game:action:appendLog']({ gameId: 9, message: '草稿应保留' }, response);
    expect(response.calls.count()).toBe(1);
    expect(response.calls.mostRecent().args).toEqual(['error', 'test dispatch failure']);
  });
});
