import { checkPlayableDeckOwnership, playableStoredDeck } from '../../economy/deck-ownership';
import { CardAppearance } from '../../game/store/card/free-basic-energy';
import { GameSettings, StateSerializer, coerceGameSettings } from '../../game';
import { Client } from '../../game/client/client.interface';
import { Game } from '../../game/core/game';
import { isActiveListGame } from '../../game/core/game-list-utils';
import { GamePhase, State } from '../../game/store/state/state';
import { Deck, User } from '../../storage';
import { config } from '../../config';
import { Format } from '../../game/store/card/card-types';
import { Core } from '../../game/core/core';
import { CoreInfo, GameInfo, PlayerInfo, GameState, UserInfo } from '../interfaces/core.interface';
import { SocketCache } from './socket-cache';
import { SocketWrapper, Response } from './socket-wrapper';
import { deepCompare } from '../../utils/utils';
import { Base64 } from '../../utils';
import { ApiErrorEnum } from '../common/errors';
import { GameStateBroadcaster, isSocketClient, viewerFromSocketClient } from './game-state-broadcaster';

export class CoreSocket {

  private client: Client;
  private socket: SocketWrapper;
  private core: Core;
  private cache: SocketCache;
  private visibleClients = new Set<number>();

  private canSeeGame(game: Game): boolean {
    return !config.duo.enabled || game.getPlayerIdForUser(this.client.user.id) != null ||
      game.clients.some(client => client.user.id === this.client.user.id) ||
      game.state.prompts.some(prompt => prompt.type === 'Invite player' && prompt.playerId === this.client.id);
  }

  constructor(client: Client, socket: SocketWrapper, core: Core, cache: SocketCache) {
    this.cache = cache;
    this.client = client;
    this.socket = socket;
    this.core = core;

    // core listeners
    this.socket.addListener('core:getInfo', this.getCoreInfo.bind(this));
    this.socket.addListener('core:createGame', this.createGame.bind(this));
    this.socket.addListener('core:createSelfPlayGame', this.createSelfPlayGame.bind(this));
  }

  public onConnect(client: Client): void {
    if (!this.core.canSeeDuoUser(this.client.user.id, client.user) || this.visibleClients.has(client.id)) return;
    this.visibleClients.add(client.id);
    this.socket.emit('core:join', {
      clientId: client.id,
      user: CoreSocket.buildUserInfo(client.user)
    });
  }

  public onDisconnect(client: Client): void {
    if (!this.visibleClients.delete(client.id)) return;
    this.socket.emit('core:leave', client.id);
  }

  public onGameAdd(game: Game): void {
    if (!isActiveListGame(game) || !this.canSeeGame(game)) {
      return;
    }
    this.cache.lastLogIdCache[game.id] = 0;
    this.cache.gameInfoCache[game.id] = CoreSocket.buildGameInfo(game);
    this.socket.emit('core:createGame', this.cache.gameInfoCache[game.id]);
  }

  public onGameDelete(game: Game): void {
    delete this.cache.gameInfoCache[game.id];
    delete this.cache.lastLogIdCache[game.id];
    this.socket.emit('core:deleteGame', game.id);
  }

  public onStateChange(game: Game, state: State): void {
    if (!this.canSeeGame(game)) return;
    const gameInfo = CoreSocket.buildGameInfo(game);
    const gameInfoChanged = !deepCompare(gameInfo, this.cache.gameInfoCache[game.id]);

    if (!gameInfoChanged) {
      return;
    }

    if (!isActiveListGame(game)) {
      delete this.cache.gameInfoCache[game.id];
      this.socket.emit('core:deleteGame', game.id);
      return;
    }

    this.cache.gameInfoCache[game.id] = gameInfo;
    this.socket.emit('core:gameInfo', gameInfo);
  }

  public onUsersUpdate(users: User[]): void {
    const core = this.client.core;
    if (core === undefined) {
      return;
    }

    const me = users.find(u => u.id === this.client.user.id);
    if (me !== undefined) {
      this.client.user = me;
    }

    for (const connected of core.clients) {
      if (core.canSeeDuoUser(this.client.user.id, connected.user)) this.onConnect(connected);
      else if (this.visibleClients.delete(connected.id)) this.socket.emit('core:leave', connected.id);
    }
    const userInfos = users.filter(user => core.canSeeDuoUser(this.client.user.id, user)).map(u => {
      const connected = core.clients.some(c => c.user.id === u.id);
      return CoreSocket.buildUserInfo(u, connected);
    });
    this.socket.emit('core:usersInfo', userInfos);
  }

  private buildCoreInfo(): CoreInfo {
    for (const game of [...this.core.games]) game.expireInvitationIfNeeded();
    const reconnectableGameId = this.core.getReconnectableGameId(this.client.user.id);
    const visible = this.core.clients.filter(client => this.core.canSeeDuoUser(this.client.user.id, client.user));
    this.visibleClients = new Set(visible.map(client => client.id));
    return {
      clientId: this.client.id,
      clients: visible.map(client => ({
        clientId: client.id,
        userId: client.user.id
      })),
      users: visible.map(client => CoreSocket.buildUserInfo(client.user)),
      games: this.core.games.filter(game => isActiveListGame(game) && this.canSeeGame(game)).map(game => CoreSocket.buildGameInfo(game)),
      ...(reconnectableGameId !== undefined && { reconnectableGameId })
    };
  }

  private getCoreInfo(data: void, response: Response<CoreInfo>): void {
    response('ok', this.buildCoreInfo());
  }

  private async createGame(params: { printingIds?: (string | null)[], deck: string[], gameSettings: GameSettings, clientId?: number, artworks?: { code: string; artworkId?: number }[], deckId?: number, sleeveImagePath?: string },
    response: Response<GameState>): Promise<void> {
    const gameSettings = coerceGameSettings(params.gameSettings);
    // Validate that only admins can enable sandbox mode
    if (gameSettings.sandboxMode && this.client.user.roleId !== 4) {
      response('error', ApiErrorEnum.ACTION_INVALID);
      return;
    }

    let appearances: (CardAppearance | null)[] | undefined;
    let invited = this.core.clients.find(c => c.id === params.clientId);
    if (config.duo.enabled && invited) {
      const userId = invited.user.id;
      invited = [...this.core.clients].reverse().find(client => client.user.id === userId);
    }
    if (config.duo.enabled) {
      if (!invited || invited.user.id === this.client.user.id ||
          this.client.user.roleId === 1 || invited.user.roleId === 1) {
        response('error', ApiErrorEnum.ACTION_INVALID);
        return;
      }
      if (!Number.isInteger(params.deckId) || (params.deckId || 0) <= 0) {
        response('error', ApiErrorEnum.DECK_INVALID);
        return;
      }
      const invitedUserId = invited.user.id;
      const targetUser = await User.findOne(invitedUserId);
      const targetDeck = targetUser?.duoDeckId == null ? undefined : await Deck.findOne({
        where: { id: targetUser.duoDeckId, user: { id: invitedUserId } }
      });
      const actor = await User.findOne(this.client.user.id);
      if (!targetUser || targetUser.roleId === 1 || !actor || actor.roleId === 1 || !targetDeck?.isValid) {
        response('error', ApiErrorEnum.ACTION_INVALID); return;
      }
      let checked;
      try {
        checked = await playableStoredDeck(this.client.user.id, params.deckId);
        await playableStoredDeck(invitedUserId, targetDeck.id);
      } catch { response('error', ApiErrorEnum.DECK_INVALID); return; }
      appearances = checked.appearances;
      invited = [...this.core.clients].reverse().find(client => client.user.id === invitedUserId);
      if (!invited || !this.core.clients.includes(this.client)) {
        response('error', ApiErrorEnum.ACTION_INVALID);
        return;
      }
      // Use the stored deck, not a client-supplied list. Check occupancy after the await.
      const participants = [this.client.user.id, invited.user.id];
      if (!this.core.clients.includes(invited) || this.core.games.some(game =>
        game.state.phase !== GamePhase.FINISHED && participants.some(id =>
          game.getPlayerIdForUser(id) != null || game.clients.some(client => client.user.id === id)))) {
        response('error', ApiErrorEnum.ACTION_INVALID);
        return;
      }
      params.deck = checked.cards;
      gameSettings.timeLimit = 0;
      gameSettings.format = Format.UNLIMITED;
      gameSettings.recordingEnabled = true;
      gameSettings.sandboxMode = false;
      gameSettings.selfPlay = false;
      gameSettings.rules = new GameSettings().rules;
    }

    if (!config.duo.enabled) {
      try {
        const checked = params.deckId ? await playableStoredDeck(this.client.user.id, params.deckId)
          : await checkPlayableDeckOwnership(this.client.user.id, params.deck, params.printingIds);
        params.deck = checked.cards;
        appearances = checked.appearances;
      } catch { response('error', ApiErrorEnum.DECK_INVALID); return; }
    }

    // Check if the invited client is a bot with format restrictions
    if (invited && this.isBotClient(invited)) {
      const botClient = invited as any; // Cast to access bot-specific methods
      if (!botClient.isFormatAllowed(gameSettings.format)) {
        response('error', ApiErrorEnum.INVALID_FORMAT);
        return;
      }
    }

    if (!this.core.clients.includes(this.client) || invited && !this.core.clients.includes(invited)) {
      response('error', ApiErrorEnum.ACTION_INVALID); return;
    }
    const game = this.core.createGame(this.client, params.deck, gameSettings, invited, params.deckId, undefined, params.sleeveImagePath, appearances);
    response('ok', CoreSocket.buildGameState(game, this.client));
  }

  private async createSelfPlayGame(
    params: {
      deck: string[];
      secondDeck: string[];
      printingIds?: (string | null)[];
      secondPrintingIds?: (string | null)[];
      gameSettings: GameSettings;
      deckId?: number;
      secondDeckId?: number;
      sleeveImagePath?: string;
      secondSleeveImagePath?: string;
    },
    response: Response<GameState>,
  ): Promise<void> {
    if (config.duo.enabled) { response('error', ApiErrorEnum.ACTION_INVALID); return; }
    const gameSettings = coerceGameSettings(params.gameSettings);
    if (gameSettings.sandboxMode && this.client.user.roleId !== 4) {
      response('error', ApiErrorEnum.ACTION_INVALID);
      return;
    }
    let first, second;
    try {
      first = params.deckId ? await playableStoredDeck(this.client.user.id, params.deckId)
        : await checkPlayableDeckOwnership(this.client.user.id, params.deck, params.printingIds);
      second = params.secondDeckId ? await playableStoredDeck(this.client.user.id, params.secondDeckId)
        : await checkPlayableDeckOwnership(this.client.user.id, params.secondDeck, params.secondPrintingIds);
    } catch { response('error', ApiErrorEnum.DECK_INVALID); return; }
    if (!this.core.clients.includes(this.client)) { response('error', ApiErrorEnum.ACTION_INVALID); return; }
    const game = this.core.createSelfPlayGame(
      this.client,
      first.cards,
      second.cards,
      gameSettings,
      params.deckId,
      params.secondDeckId,
      params.sleeveImagePath,
      params.secondSleeveImagePath,
      first.appearances,
      second.appearances
    );
    response('ok', CoreSocket.buildGameState(game, this.client));
  }

  public static buildUserInfo(user: User, connected: boolean = true): UserInfo {
    return {
      connected,
      userId: user.id,
      name: user.name,
      email: config.duo.enabled ? '' : user.email,
      registered: user.registered,
      lastSeen: user.lastSeen,
      ranking: user.ranking,
      rank: user.getRank(),
      lastRankingChange: user.lastRankingChange,
      avatarFile: user.avatarFile,
      roleId: user.roleId
    };
  }

  private static buildGameInfo(game: Game): GameInfo {
    const state = game.state;
    const players: PlayerInfo[] = state.players.map(player => ({
      clientId: player.id,
      name: player.name,
      prizes: player.prizes.reduce((sum, cardList) => sum + cardList.cards.length, 0),
      deck: player.deck.cards.length
    }));
    const invitePrompt = state.prompts.find(
      p => p.type === 'Invite player' && p.result === undefined
    );
    const pendingInvite =
      state.phase === GamePhase.WAITING_FOR_PLAYERS && invitePrompt !== undefined;
    return {
      gameId: game.id,
      phase: state.phase,
      turn: state.turn,
      activePlayer: state.activePlayer,
      players,
      playerUserIds: game.getPlayerUserIds(),
      format: game.format,
      pendingInvite: pendingInvite || undefined,
      inviteeClientId: pendingInvite ? invitePrompt!.playerId : undefined
    };
  }

  public static buildGameState(game: Game, client?: Client): GameState {
    let stateData: string;
    if (client && isSocketClient(client)) {
      stateData = GameStateBroadcaster.buildSanitizedStateData(
        game,
        viewerFromSocketClient(client)
      );
      GameStateBroadcaster.joinRooms(client, game);
    } else {
      const serializer = new StateSerializer();
      const serializedState = serializer.serialize(game.state);
      const base64 = new Base64();
      stateData = base64.encode(serializedState);
    }
    return {
      gameId: game.id,
      stateData,
      clientIds: game.clients.map(c => c.id),
      recordingEnabled: game.gameSettings.recordingEnabled,
      timeLimit: game.gameSettings.timeLimit,
      playerStats: game.playerStats,
      format: game.format
    };
  }

  public dispose(): void {
    this.socket.removeListener('core:getInfo');
    this.socket.removeListener('core:createGame');
    this.socket.removeListener('core:createSelfPlayGame');
  }

  private isBotClient(client: Client): boolean {
    // Check if the client has bot-specific methods
    return 'isFormatAllowed' in client && 'getAllowedFormats' in client;
  }
}