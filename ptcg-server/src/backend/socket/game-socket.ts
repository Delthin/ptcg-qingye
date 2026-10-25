import { SandboxModifyPlayerAction } from '../../game/store/actions/sandbox-modify-player-action';
import { SandboxModifyGameStateAction } from '../../game/store/actions/sandbox-modify-game-state-action';
import { SandboxModifyCardAction } from '../../game/store/actions/sandbox-modify-card-action';
import { SandboxModifyPokemonAction } from '../../game/store/actions/sandbox-modify-pokemon-action';
import { ChangeAvatarAction } from '../../game/store/actions/change-avatar-action';
import { Client } from '../../game/client/client.interface';
import { CoreSocket } from './core-socket';
import { ApiErrorEnum } from '../common/errors';
import { Game } from '../../game/core/game';
import { State } from '../../game/store/state/state';
import { Core } from '../../game/core/core';
import { GameState } from '../interfaces/core.interface';
import { ResolvePromptAction } from '../../game/store/actions/resolve-prompt-action';
import { SocketCache } from './socket-cache';
import { SocketWrapper, Response } from './socket-wrapper';
import { GameStateBroadcaster } from './game-state-broadcaster';
import { SocketClient } from './socket-client';
import { ChatPayload, chatRateLimiter, parseChatMessage } from './chat-policy';
import { selfPlayFocusPlayerId } from '../../game/core/self-play-focus';
import { InvitePlayerPrompt } from '../../game/store/prompts/invite-player-prompt';
import { checkPlayableDeckOwnership, playableStoredDeck } from '../../economy/deck-ownership';
import { config } from '../../config';
import { Action, AddPlayerAction, AppendLogAction, AttackAction, CardTarget, ConcedeAction, GameLog, PassTurnAction, PlayCardAction, ReorderBenchAction, ReorderHandAction, RetreatAction, RetreatStartAction, UseAbilityAction, UseEnergyAbilityAction, UseStadiumAction, UseTrainerAbilityAction } from '../../game';

export class GameSocket {

  private cache: SocketCache;
  private client: Client;
  private socket: SocketWrapper;
  private core: Core;

  constructor(client: Client, socket: SocketWrapper, core: Core, cache: SocketCache) {
    this.cache = cache;
    this.client = client;
    this.socket = socket;
    this.core = core;

    // game listeners
    this.socket.addListener('game:join', this.joinGame.bind(this));
    this.socket.addListener('game:leave', this.leaveGame.bind(this));
    this.socket.addListener('game:rejoin', this.rejoinGame.bind(this));
    this.socket.addListener('game:concede', this.concedeGame.bind(this));
    this.socket.addListener('game:getStatus', this.getGameStatus.bind(this));
    this.socket.addListener('game:action:ability', this.ability.bind(this));
    this.socket.addListener('game:action:trainerAbility', this.trainerAbility.bind(this));
    this.socket.addListener('game:action:energyAbility', this.energyAbility.bind(this));
    this.socket.addListener('game:action:attack', this.attack.bind(this));
    this.socket.addListener('game:action:stadium', this.stadium.bind(this));
    this.socket.addListener('game:action:play', this.playGame.bind(this));
    this.socket.addListener('game:action:playCard', this.playCard.bind(this));
    this.socket.addListener('game:action:resolvePrompt', this.resolvePrompt.bind(this));
    this.socket.addListener('game:action:retreat', this.retreat.bind(this));
    this.socket.addListener('game:action:retreatStart', this.retreatStart.bind(this));
    this.socket.addListener('game:action:reorderBench', this.reorderBench.bind(this));
    this.socket.addListener('game:action:reorderHand', this.reorderHand.bind(this));
    this.socket.addListener('game:action:passTurn', this.passTurn.bind(this));
    this.socket.addListener('game:action:appendLog', this.appendLog.bind(this));
    this.socket.addListener('game:action:changeAvatar', this.changeAvatar.bind(this));
    // Sandbox actions
    this.socket.addListener('game:sandbox:modifyPlayer', this.sandboxModifyPlayer.bind(this));
    this.socket.addListener('game:sandbox:modifyGameState', this.sandboxModifyGameState.bind(this));
    this.socket.addListener('game:sandbox:modifyCard', this.sandboxModifyCard.bind(this));
    this.socket.addListener('game:sandbox:modifyPokemon', this.sandboxModifyPokemon.bind(this));
  }

  public onGameJoin(game: Game, client: Client): void {
    this.socket.emit(`game[${game.id}]:join`, { clientId: client.id });
  }

  public onGameLeave(game: Game, client: Client): void {
    this.socket.emit(`game[${game.id}]:leave`, { clientId: client.id });
  }

  /**
   * Legacy per-client path kept for non-broadcast callers.
   * Live games use GameStateBroadcaster (shared sanitize + rooms + diffs).
   */
  public onStateChange(_game: Game, _state: State): void {
    // no-op — Game.onStateChange → GameStateBroadcaster.broadcast
  }

  private joinGame(gameId: number, response: Response<GameState>): void {
    const game = this.core.games.find(g => g.id === gameId);
    if (game === undefined || game.expireInvitationIfNeeded()) {
      response('error', ApiErrorEnum.GAME_INVALID_ID);
      return;
    }
    this.cache.lastLogIdCache[game.id] = 0;
    try { this.core.joinGame(this.client, game); }
    catch { response('error', ApiErrorEnum.GAME_INVALID_ID); return; }
    this.joinBroadcastRooms(game);
    GameStateBroadcaster.emitFullToClient(this.client as SocketClient, game);
    response('ok', CoreSocket.buildGameState(game, this.client));
  }

  private leaveGame(gameId: number, response: Response<void>): void {
    const game = this.core.games.find(g => g.id === gameId);
    if (game === undefined) {
      response('error', ApiErrorEnum.GAME_INVALID_ID);
      return;
    }
    if (!this.canAccessGame(game)) { response('error', ApiErrorEnum.ACTION_INVALID); return; }
    GameStateBroadcaster.leaveRooms(this.client as SocketClient, gameId);
    delete this.cache.lastLogIdCache[game.id];
    this.core.leaveGame(this.client, game);
    response('ok');
  }

  private joinBroadcastRooms(game: Game): void {
    GameStateBroadcaster.joinRooms(this.client as SocketClient, game);
  }

  private async rejoinGame(params: { gameId: number }, response: Response<GameState>): Promise<void> {
    try {
      const gameId = params.gameId;

      // Find the game
      const game = this.core.games.find(g => g.id === gameId);
      if (!game || game.expireInvitationIfNeeded()) {
        response('error', ApiErrorEnum.GAME_INVALID_ID);
        return;
      }

      if (config.duo.enabled) {
        // join and rejoin share the same account-bound, conflict-checked recovery path.
        this.core.joinGame(this.client, game);
        this.cache.lastLogIdCache[game.id] = 0;
        this.joinBroadcastRooms(game);
        GameStateBroadcaster.emitFullToClient(this.client as SocketClient, game);
        response('ok', CoreSocket.buildGameState(game, this.client));
        return;
      }
      // An ID match alone is not evidence that this connection has recovered.
      const isAlreadyInGame = game.clients.includes(this.client) && !game.isPlayerDisconnected(this.client.id);
      if (isAlreadyInGame) {
        // Client is already in the game, just return the current state
        this.cache.lastLogIdCache[game.id] = 0;
        this.joinBroadcastRooms(game);
        response('ok', CoreSocket.buildGameState(game, this.client));
        return;
      }

      const playerId = game.getPlayerIdForUser(this.client.user.id);
      if (!playerId) {
        response('error', ApiErrorEnum.GAME_INVALID_ID);
        return;
      }

      // User is a player, check if they're disconnected
      const disconnectedPlayer = game.getDisconnectedPlayerInfo(playerId);

      if (!disconnectedPlayer) {
        // User is a player but not disconnected - they're already connected or never disconnected
        // Don't allow rejoin if they're not actually disconnected
        response('error', ApiErrorEnum.GAME_INVALID_ID);
        return;
      }

      // User is disconnected, attempt reconnection
      if (this.core.clients.some(other => other !== this.client && other.id === playerId)) {
        response('error', ApiErrorEnum.GAME_INVALID_ID);
        return;
      }
      if (this.client.id !== playerId) {
        this.client.id = playerId;
      }

      const reconnected = game.handlePlayerReconnection(this.client);

      if (reconnected) {
        // Successfully reconnected to the game
        this.cache.lastLogIdCache[game.id] = 0;
        if (!this.client.games.includes(game)) {
          this.client.games.push(game);
        }
        this.joinBroadcastRooms(game);
        // Force a full state so the client resets its diff base
        GameStateBroadcaster.emitFullToClient(this.client as SocketClient, game);
        response('ok', CoreSocket.buildGameState(game, this.client));
        return;
      } else {
        response('error', ApiErrorEnum.GAME_INVALID_ID);
        return;
      }

    } catch (error) {
      console.error('Error in rejoinGame:', error);
      response('error', ApiErrorEnum.SERVER_ERROR);
    }
  }

  private concedeGame(params: { gameId: number }, response: Response<void>): void {
    const gameId = params.gameId;
    const game = this.core.games.find(g => g.id === gameId);
    if (game === undefined) {
      response('error', ApiErrorEnum.GAME_INVALID_ID);
      return;
    }

    if (!this.canAccessGame(game)) { response('error', ApiErrorEnum.ACTION_INVALID); return; }
    try {
      const action = new ConcedeAction(this.actorIdForGameId(gameId));
      game.dispatch(this.client, action);
      response('ok');
    } catch (error) {
      console.error('Error in concedeGame:', error);
      response('error', ApiErrorEnum.SERVER_ERROR);
    }
  }

  private canAccessGame(game: Game): boolean {
    return !config.duo.enabled || (game.getPlayerIdForUser(this.client.user.id) === this.client.id && game.clients.includes(this.client));
  }

  private getGameStatus(gameId: number, response: Response<GameState>): void {
    const game = this.core.games.find(g => g.id === gameId);
    if (game === undefined) {
      response('error', ApiErrorEnum.GAME_INVALID_ID);
      return;
    }
    if (game.expireInvitationIfNeeded() || !this.canAccessGame(game)) {
      response('error', ApiErrorEnum.GAME_INVALID_ID); return;
    }
    response('ok', CoreSocket.buildGameState(game, this.client));
  }

  private dispatch(gameId: number, action: Action, response: Response<void>) {
    const game = this.core.games.find(g => g.id === gameId);
    if (game === undefined) {
      response('error', ApiErrorEnum.GAME_INVALID_ID);
      return;
    }
    if (!this.canAccessGame(game)) { response('error', ApiErrorEnum.ACTION_INVALID); return; }
    try {
      game.dispatch(this.client, action);
    } catch (error: any) {
      response('error', error.message);
      return;
    }
    response('ok');
  }

  private ability(params: { gameId: number, ability: string, target: CardTarget }, response: Response<void>) {
    const action = new UseAbilityAction(this.actorIdForGameId(params.gameId), params.ability, params.target);
    this.dispatch(params.gameId, action, response);
  }

  private trainerAbility(params: { gameId: number, ability: string, target: CardTarget }, response: Response<void>) {
    const action = new UseTrainerAbilityAction(this.actorIdForGameId(params.gameId), params.ability, params.target);
    this.dispatch(params.gameId, action, response);
  }

  private energyAbility(params: { gameId: number, ability: string, target: CardTarget }, response: Response<void>) {
    const action = new UseEnergyAbilityAction(this.actorIdForGameId(params.gameId), params.ability, params.target);
    this.dispatch(params.gameId, action, response);
  }

  private attack(params: { gameId: number, attack: string }, response: Response<void>) {
    const action = new AttackAction(this.actorIdForGameId(params.gameId), params.attack);
    this.dispatch(params.gameId, action, response);
  }

  private stadium(params: { gameId: number }, response: Response<void>) {
    const action = new UseStadiumAction(this.actorIdForGameId(params.gameId));
    this.dispatch(params.gameId, action, response);
  }

  private async playGame(params: { gameId: number, deck: string[], deckId?: number, printingIds?: (string | null)[], artworks?: { code: string; artworkId?: number }[], sleeveImagePath?: string }, response: Response<void>) {
    // Private-room joins must answer the addressed invitation, not this public join action.
    if (config.duo.enabled) { response('error', ApiErrorEnum.ACTION_INVALID); return; }
    try {
      const checked = params.deckId ? await playableStoredDeck(this.client.user.id, params.deckId)
        : await checkPlayableDeckOwnership(this.client.user.id, params.deck, params.printingIds);
      const action = new AddPlayerAction(this.client.id, this.client.user.name, checked.cards, undefined, params.deckId, params.sleeveImagePath, checked.appearances);
      this.dispatch(params.gameId, action, response);
    } catch { response('error', ApiErrorEnum.DECK_INVALID); }
  }

  private playCard(params: { gameId: number, handIndex: number, target: CardTarget }, response: Response<void>) {
    const action = new PlayCardAction(this.actorIdForGameId(params.gameId), params.handIndex, params.target);
    this.dispatch(params.gameId, action, response);
  }

  private async resolvePrompt(params: { gameId: number, id: number, result: any }, response: Response<void>) {
    const game = this.core.games.find(g => g.id === params.gameId);
    if (game === undefined) {
      response('error', ApiErrorEnum.GAME_INVALID_ID);
      return;
    }
    const prompt = game.state.prompts.find(p => p.id === params.id);
    if (prompt === undefined) {
      response('error', ApiErrorEnum.PROMPT_INVALID_ID);
      return;
    }

    if (game.expireInvitationIfNeeded()) { response('error', ApiErrorEnum.GAME_INVALID_ID); return; }
    if (config.duo.enabled && (!this.canAccessGame(game) || prompt.playerId !== this.client.id)) {
      response('error', ApiErrorEnum.ACTION_INVALID);
      return;
    }
    try {
      if (prompt instanceof InvitePlayerPrompt) {
        if (prompt.playerId !== this.actorIdForGameId(params.gameId)) {
          response('error', ApiErrorEnum.ACTION_INVALID);
          return;
        }
        if (params.result !== null) {
          const id = params.result?.deckId;
          if (config.duo.enabled && (!Number.isInteger(id) || id <= 0)) { response('error', ApiErrorEnum.DECK_INVALID); return; }
          const checked = id ? await playableStoredDeck(this.client.user.id, id)
            : await checkPlayableDeckOwnership(this.client.user.id, Array.isArray(params.result) ? params.result : params.result?.deck, params.result?.printingIds);
          if (game.expireInvitationIfNeeded() || !this.core.games.includes(game) ||
              !this.canAccessGame(game) || prompt.result !== undefined) {
            response('error', ApiErrorEnum.GAME_INVALID_ID); return;
          }
          params.result = { deck: checked.cards, deckId: id, appearances: checked.appearances };
        }
      }
      params.result = prompt.decode(params.result, game.state);
      if (prompt.validate(params.result, game.state) === false) {
        response('error', ApiErrorEnum.PROMPT_INVALID_RESULT);
        return;
      }
    } catch (error: any) {
      response('error', error);
      return;
    }

    const action = new ResolvePromptAction(params.id, params.result);
    this.dispatch(params.gameId, action, response);
  }

  private reorderBench(params: { gameId: number, from: number, to: number }, response: Response<void>) {
    const action = new ReorderBenchAction(this.actorIdForGameId(params.gameId), params.from, params.to);
    this.dispatch(params.gameId, action, response);
  }

  private reorderHand(params: { gameId: number, order: number[] }, response: Response<void>) {
    const action = new ReorderHandAction(this.actorIdForGameId(params.gameId), params.order);
    this.dispatch(params.gameId, action, response);
  }

  private retreat(params: { gameId: number, to: number }, response: Response<void>) {
    const action = new RetreatAction(this.actorIdForGameId(params.gameId), params.to);
    this.dispatch(params.gameId, action, response);
  }

  private retreatStart(params: { gameId: number }, response: Response<void>) {
    const action = new RetreatStartAction(this.actorIdForGameId(params.gameId));
    this.dispatch(params.gameId, action, response);
  }

  private passTurn(params: { gameId: number }, response: Response<void>) {
    const action = new PassTurnAction(this.actorIdForGameId(params.gameId));
    this.dispatch(params.gameId, action, response);
  }

  private appendLog(params: ChatPayload, response: Response<void>) {
    const game = this.core.games.find(g => g.id === params?.gameId);
    if (!game) { response('error', ApiErrorEnum.GAME_INVALID_ID); return; }
    // Require an authenticated, connected player seat, even outside duo mode.
    // Never use a client-provided sender or the self-play focus as chat identity.
    const playerId = game.getPlayerIdForUser(this.client.user.id);
    if (playerId === undefined || playerId !== this.client.id ||
        !game.clients.includes(this.client) || !game.state.players.some(p => p.id === playerId)) {
      response('error', ApiErrorEnum.ACTION_INVALID);
      return;
    }
    const message = parseChatMessage(params);
    if (!message) {
      response('error', ApiErrorEnum.CANNOT_SEND_MESSAGE);
      return;
    }
    if (!chatRateLimiter.allow(game, this.client.user.id)) {
      response('error', ApiErrorEnum.CANNOT_SEND_MESSAGE);
      return;
    }
    const logParams: Record<string, string> = { text: message.text, kind: message.kind };
    if (message.emoteId !== undefined) logParams.emoteId = message.emoteId;
    const action = new AppendLogAction(playerId, GameLog.LOG_TEXT, logParams);
    this.dispatch(game.id, action, response);
  }

  private changeAvatar(params: { gameId: number, avatarName: string }, response: Response<void>) {
    const action = new ChangeAvatarAction(this.actorIdForGameId(params.gameId), params.avatarName);
    this.dispatch(params.gameId, action, response);
  }

  private sandboxModifyPlayer(params: {
    gameId: number,
    targetPlayerId: number,
    modifications: any
  }, response: Response<void>) {
    // Validate admin role
    if (this.client.user.roleId !== 4) {
      response('error', ApiErrorEnum.ACTION_INVALID);
      return;
    }
    const action = new SandboxModifyPlayerAction(
      this.client.id,
      params.targetPlayerId,
      params.modifications
    );
    this.dispatch(params.gameId, action, response);
  }

  private sandboxModifyGameState(params: {
    gameId: number,
    modifications: any
  }, response: Response<void>) {
    // Validate admin role
    if (this.client.user.roleId !== 4) {
      response('error', ApiErrorEnum.ACTION_INVALID);
      return;
    }
    const action = new SandboxModifyGameStateAction(
      this.client.id,
      params.modifications
    );
    this.dispatch(params.gameId, action, response);
  }

  private sandboxModifyCard(params: {
    gameId: number,
    targetPlayerId: number,
    action: 'add' | 'remove' | 'move',
    cardName: string,
    fromZone?: string,
    toZone?: string,
    fromIndex?: number,
    toIndex?: number,
    prizeIndex?: number
  }, response: Response<void>) {
    // Validate admin role
    if (this.client.user.roleId !== 4) {
      response('error', ApiErrorEnum.ACTION_INVALID);
      return;
    }
    const action = new SandboxModifyCardAction(
      this.client.id,
      params.targetPlayerId,
      params.action,
      params.cardName,
      params.fromZone as any,
      params.toZone as any,
      params.fromIndex,
      params.toIndex,
      params.prizeIndex
    );
    this.dispatch(params.gameId, action, response);
  }

  private sandboxModifyPokemon(params: {
    gameId: number,
    targetPlayerId: number,
    location: 'active' | 'bench',
    benchIndex?: number,
    modifications: any
  }, response: Response<void>) {
    // Validate admin role
    if (this.client.user.roleId !== 4) {
      response('error', ApiErrorEnum.ACTION_INVALID);
      return;
    }
    const action = new SandboxModifyPokemonAction(
      this.client.id,
      params.targetPlayerId,
      params.location,
      params.modifications,
      params.benchIndex
    );
    this.dispatch(params.gameId, action, response);
  }

  public onTimerUpdate(game: Game, playerStats: any[]): void {
    this.socket.emit(`game[${game.id}]:timerUpdate`, { playerStats });
  }

  public onPlayerDisconnected(game: Game, disconnectedClient: Client): void {
    // Notify this client about the disconnection
    this.socket.emit(`game[${game.id}]:playerDisconnected`, {
      playerId: disconnectedClient.id,
      playerName: disconnectedClient.name,
      disconnectedAt: Date.now(),
      gamePhase: game.state.phase,
      isPaused: game.isPausedForDisconnection()
    });
  }

  public onPlayerReconnected(game: Game, reconnectedClient: Client): void {
    // Notify this client about the reconnection
    this.socket.emit(`game[${game.id}]:playerReconnected`, {
      playerId: reconnectedClient.id,
      playerName: reconnectedClient.name,
      reconnectedAt: Date.now(),
      gamePhase: game.state.phase,
      isPaused: game.isPausedForDisconnection()
    });
  }

  public onConnectionStatusUpdate(game: Game, connectionStatuses: Array<{ playerId: number, playerName: string, isConnected: boolean, disconnectedAt?: number }>): void {
    // Send connection status update to this client
    this.socket.emit(`game[${game.id}]:connectionStatusUpdate`, {
      connectionStatuses,
      gamePhase: game.state.phase,
      isPaused: game.isPausedForDisconnection()
    });
  }

  public onReconnectionTimeout(game: Game, playerId: number, playerName: string): void {
    // Notify this client about reconnection timeout
    this.socket.emit(`game[${game.id}]:reconnectionTimeout`, {
      playerId,
      playerName,
      timeoutAt: Date.now(),
      gamePhase: game.state.phase
    });
  }

  public onTimeoutWarning(game: Game, timeRemaining: number): void {
    // Send timeout warning to this client
    this.socket.emit(`game[${game.id}]:timeoutWarning`, {
      timeRemaining,
      gamePhase: game.state.phase
    });
  }

  private actorIdForGameId(gameId: number): number {
    const game = this.core.games.find(g => g.id === gameId);
    if (game === undefined || game.gameSettings.selfPlay !== true) {
      return this.client.id;
    }
    return selfPlayFocusPlayerId(game.state);
  }

  public dispose(): void {
    this.socket.removeListener('game:join');
    this.socket.removeListener('game:leave');
    this.socket.removeListener('game:rejoin');
    this.socket.removeListener('game:concede');
    this.socket.removeListener('game:getStatus');
    this.socket.removeListener('game:action:ability');
    this.socket.removeListener('game:action:trainerAbility');
    this.socket.removeListener('game:action:attack');
    this.socket.removeListener('game:action:stadium');
    this.socket.removeListener('game:action:play');
    this.socket.removeListener('game:action:playCard');
    this.socket.removeListener('game:action:resolvePrompt');
    this.socket.removeListener('game:action:retreat');
    this.socket.removeListener('game:action:retreatStart');
    this.socket.removeListener('game:action:reorderBench');
    this.socket.removeListener('game:action:reorderHand');
    this.socket.removeListener('game:action:passTurn');
    this.socket.removeListener('game:action:appendLog');
    this.socket.removeListener('game:action:changeAvatar');
    this.socket.removeListener('game:sandbox:modifyPlayer');
    this.socket.removeListener('game:sandbox:modifyGameState');
    this.socket.removeListener('game:sandbox:modifyCard');
    this.socket.removeListener('game:sandbox:modifyPokemon');
  }

}