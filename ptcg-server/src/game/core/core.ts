import { AddPlayerAction } from '../store/actions/add-player-action';
import { CleanerTask } from '../tasks/cleaner-task';
import { Client } from '../client/client.interface';
import { GameError } from '../game-error';
import { GameMessage, GameCoreError } from '../game-message';
import { Game } from './game';
import { GameSettings, coerceGameSettings } from './game-settings';
import { InvitePlayerAction } from '../store/actions/invite-player-action';
import { Messager } from './messager';
import { RankingCalculator } from './ranking-calculator';
import { Scheduler, generateId } from '../../utils';
import { config } from '../../config';
import { Format } from '../store/card/card-types';
import { AbortGameAction } from '../store/actions/abort-game-action';
import { AbortGameReason } from '../store/actions/abort-game-action';
import { GamePhase } from '../store/state/state';
import { BotManager } from '../bots/bot-manager';
import { ReconnectionManager } from '../../backend/services/reconnection-manager';
import { ReconnectionConfig } from '../../backend/interfaces/reconnection.interface';
import { logger } from '../../utils/logger';
import { User, Friend, FriendStatus } from '../../storage';
import { coinById, DEFAULT_COIN_ID, ownedCoinState } from '../../economy/coin-ownership';
import { serializedTransaction } from '../../storage/transaction';

export class Core {
  public clients: Client[] = [];
  public games: Game[] = [];
  private duoFriends = new Map<number, Set<number>>();
  private equippedCoins = new Map<number, string>();

  /** Only socket-handshake DB validation and the committed equip endpoint populate this cache. */
  public updateEquippedCoin(userId: number, coinId: string): void {
    const equippedId = coinById.has(coinId) ? coinId : DEFAULT_COIN_ID;
    this.equippedCoins.set(userId, equippedId);
    for (const client of this.clients) {
      if (client.user.id === userId) client.user.equippedCoinId = equippedId;
    }
  }

  /** Complete before the socket handshake succeeds, so game creation can remain synchronous. */
  public async prepareUserCoins(user: User): Promise<void> {
    const coins = await serializedTransaction(User.getRepository().manager.connection, async manager => {
      const stored = await manager.findOne(User, user.id);
      if (!stored || stored.roleId === 1) throw new GameError(GameMessage.ERROR_CLIENT_NOT_CONNECTED);
      return ownedCoinState(manager, stored);
    });
    user.equippedCoinId = coins.equippedId;
    this.updateEquippedCoin(user.id, coins.equippedId);
  }

  public getEquippedCoin(client: Client): string {
    if (this.isBotClient(client)) return DEFAULT_COIN_ID;
    return this.equippedCoins.get(client.user.id) || DEFAULT_COIN_ID;
  }
  private duoPresenceTask: Promise<void> = Promise.resolve();

  public canSeeDuoUser(observerId: number, target: User): boolean {
    return !config.duo.enabled || (target.roleId !== 1 &&
      (observerId === target.id || target.duoPublic || !!this.duoFriends.get(observerId)?.has(target.id)));
  }

  /** Serialize privacy refreshes so an older snapshot cannot re-expose a hidden user. */
  public refreshDuoPresence(): Promise<void> {
    if (!config.duo.enabled) return Promise.resolve();
    const current = this.duoPresenceTask.catch(() => undefined).then(() => this.reconcileDuoPresence());
    this.duoPresenceTask = current;
    return current;
  }

  private async reconcileDuoPresence(): Promise<void> {
    const ids = Array.from(new Set(this.clients.map(client => client.user.id)));
    const users = ids.length ? await User.findByIds(ids) : [];
    const friends = ids.length ? await Friend.createQueryBuilder('f')
      .where('(f.user_id IN (:...ids) OR f.friend_id IN (:...ids)) AND f.status = :status',
        { ids, status: FriendStatus.ACCEPTED }).getMany() : [];
    const relations = new Map<number, Set<number>>();
    for (const row of friends) {
      if (!relations.has(row.user_id)) relations.set(row.user_id, new Set());
      if (!relations.has(row.friend_id)) relations.set(row.friend_id, new Set());
      relations.get(row.user_id)!.add(row.friend_id);
      relations.get(row.friend_id)!.add(row.user_id);
    }
    this.duoFriends = relations;
    for (const client of this.clients) {
      const user = users.find(row => row.id === client.user.id);
      if (user) {
        // A presence query may have started before an equip committed. Keep the validated live selection.
        user.equippedCoinId = this.getEquippedCoin(client);
        client.user = user;
      }
    }
    this.emit(client => client.onUsersUpdate(users));
  }
  public messager: Messager;
  private botManager: BotManager;
  private reconnectionManager: ReconnectionManager;
  private inactiveCleanupIntervalRef: NodeJS.Timeout | undefined;
  private lastClientId = 0;
  private lastGameId = 0;

  private allocateGameId(): number {
    if (!config.duo.enabled) return generateId(this.games);
    // Stale links cannot point at a newly created table after deletion/restart.
    this.lastGameId = Math.max(Date.now(), this.lastGameId + 1);
    return this.lastGameId;
  }

  constructor(reconnectionConfig?: ReconnectionConfig) {
    this.messager = new Messager(this);
    this.botManager = BotManager.getInstance();

    const defaultConfig: ReconnectionConfig = {
      preservationTimeoutMs: 5 * 60 * 1000,
      maxAutoReconnectAttempts: 3,
      reconnectIntervals: [5000, 10000, 15000],
      healthCheckIntervalMs: 30 * 1000,
      cleanupIntervalMs: 60 * 1000,
      maxPreservedSessionsPerUser: 1,
      disconnectForfeitMs: 60 * 1000
    };
    this.reconnectionManager = new ReconnectionManager(reconnectionConfig || defaultConfig);

    const cleanerTask = new CleanerTask(this);
    cleanerTask.startTasks();
    this.startRankingDecrease();
    this.startInactiveGameCleanup();
  }

  public getBotManager(): BotManager {
    return this.botManager;
  }

  public getReconnectionManager(): ReconnectionManager {
    return this.reconnectionManager;
  }

  /**
   * Returns the game id the user can rejoin if they have a disconnected slot (for core:getInfo).
   */
  public getReconnectableGameId(userId: number): number | undefined {
    for (const game of this.games) {
      const playerId = game.getPlayerIdForUser(userId);
      if (playerId !== undefined && game.isPlayerDisconnected(playerId) && game.state.phase !== GamePhase.FINISHED) {
        return game.id;
      }
    }
    return undefined;
  }

  public async connect(client: Client): Promise<Client> {
    const foreignSlot = this.games.some(game => game.state.players.some(player =>
      player.id === client.id && game.getPlayerIdForUser(client.user.id) !== player.id));
    if (client.id === 0 || this.clients.some(c => c.id === client.id) || foreignSlot) {
      // A disconnected player slot remains reserved; never recycle it for another user/window.
      const ids = [this.lastClientId, ...this.clients.map(c => c.id),
        ...this.games.flatMap(game => game.state.players.map(player => player.id))];
      client.id = Math.max(...ids) + 1;
    }
    this.lastClientId = Math.max(this.lastClientId, client.id);
    client.core = this;
    client.games = [];

    // Add client to the core
    this.clients.push(client);

    if (config.duo.enabled) await this.refreshDuoPresence();
    if (!this.clients.includes(client)) return client; // It may disconnect during the async refresh.
    // Emit connection events to notify other clients
    this.emit(c => c.onConnect(client));

    // Send updated user list to all clients to show the new user as online
    this.broadcastUserUpdates();

    return client;
  }

  public async disconnect(client: Client, reason: string = 'unknown'): Promise<void> {
    const index = this.clients.indexOf(client);
    if (index === -1) {
      throw new GameError(GameMessage.ERROR_CLIENT_NOT_CONNECTED);
    }

    // Handle disconnection for all games without removing them
    client.games.forEach(game => {
      const isPlayer = game.state.players.some(player => player.id === client.id);
      if (isPlayer) {
        game.handlePlayerDisconnection(client);
        return;
      }

      const gameClientIndex = game.clients.indexOf(client);
      if (gameClientIndex !== -1) {
        game.clients.splice(gameClientIndex, 1);
        this.emit(c => c.onGameLeave(game, client));
      }
    });
    client.games = [];

    // Remove client from core
    this.clients.splice(index, 1);
    client.core = undefined;

    // Notify other clients
    this.emit(c => c.onDisconnect(client));

    // Send updated user list to all clients to show the user as offline
    this.broadcastUserUpdates();
  }

  public createGame(
    client: Client,
    deck: string[],
    gameSettings: GameSettings = new GameSettings(),
    invited?: Client,
    deckId1?: number,
    deckId2?: number,
    sleeveImagePath1?: string,
    appearances?: (import('../store/card/free-basic-energy').CardAppearance | null)[]
  ): Game {
    gameSettings = coerceGameSettings(gameSettings);
    if (this.clients.indexOf(client) === -1) {
      throw new GameError(GameMessage.ERROR_CLIENT_NOT_CONNECTED);
    }
    if (invited && this.clients.indexOf(invited) === -1) {
      throw new GameError(GameMessage.ERROR_CLIENT_NOT_CONNECTED);
    }

    // Check if either client is a bot with format restrictions
    if (invited && this.isBotClient(invited)) {
      const botClient = invited as any; // Cast to access bot-specific methods
      if (!botClient.isFormatAllowed(gameSettings.format)) {
        throw new GameError(GameCoreError.ERROR_BOT_FORMAT_NOT_ALLOWED);
      }
    }

    if (this.isBotClient(client)) {
      const botClient = client as any; // Cast to access bot-specific methods
      if (!botClient.isFormatAllowed(gameSettings.format)) {
        throw new GameError(GameCoreError.ERROR_BOT_FORMAT_NOT_ALLOWED);
      }
    }
    if (gameSettings.format === Format.RETRO) {
      gameSettings.rules.attackFirstTurn = true;
      gameSettings.rules.firstTurnDrawCard = false;
      gameSettings.rules.supporterCleanupAtEndTurn = true;
    }
    if (gameSettings.format === Format.RSPK) {
      gameSettings.rules.attackFirstTurn = true;
      gameSettings.rules.firstTurnDrawCard = false;
      gameSettings.rules.supporterCleanupAtEndTurn = true;
    }
    if (gameSettings.format === Format.BW) {
      gameSettings.rules.attackFirstTurn = true;
      gameSettings.rules.firstTurnDrawCard = true;
      gameSettings.rules.firstTurnUseSupporter = true;
    }
    const game = new Game(this, this.allocateGameId(), gameSettings);
    this.games.push(game);
    game.dispatch(client, new AddPlayerAction(client.id, client.name, deck, undefined, deckId1, sleeveImagePath1, appearances));
    if (invited) {
      game.dispatch(client, new InvitePlayerAction(invited.id, invited.name));
    }
    if (this.games.indexOf(game) !== -1) {
      this.emit(c => c.onGameAdd(game));
      this.joinGame(client, game);
      if (invited) {
        this.joinGame(invited, game);
      }
    }
    return game;
  }

  public createSelfPlayGame(
    client: Client,
    deck1: string[],
    deck2: string[],
    gameSettings: GameSettings = new GameSettings(),
    deckId1?: number,
    deckId2?: number,
    sleeveImagePath1?: string,
    sleeveImagePath2?: string,
    appearances1?: (import('../store/card/free-basic-energy').CardAppearance | null)[],
    appearances2?: (import('../store/card/free-basic-energy').CardAppearance | null)[]
  ): Game {
    gameSettings = coerceGameSettings(gameSettings);
    if (this.clients.indexOf(client) === -1) {
      throw new GameError(GameMessage.ERROR_CLIENT_NOT_CONNECTED);
    }

    if (this.isBotClient(client)) {
      const botClient = client as any;
      if (!botClient.isFormatAllowed(gameSettings.format)) {
        throw new GameError(GameCoreError.ERROR_BOT_FORMAT_NOT_ALLOWED);
      }
    }

    gameSettings.selfPlay = true;

    if (gameSettings.format === Format.RETRO) {
      gameSettings.rules.attackFirstTurn = true;
      gameSettings.rules.firstTurnDrawCard = false;
      gameSettings.rules.supporterCleanupAtEndTurn = true;
    }
    if (gameSettings.format === Format.RSPK) {
      gameSettings.rules.attackFirstTurn = true;
      gameSettings.rules.firstTurnDrawCard = false;
      gameSettings.rules.supporterCleanupAtEndTurn = true;
    }
    if (gameSettings.format === Format.BW) {
      gameSettings.rules.attackFirstTurn = true;
      gameSettings.rules.firstTurnDrawCard = true;
      gameSettings.rules.firstTurnUseSupporter = true;
    }

    const taken = new Set(this.clients.map(c => c.id));
    let opponentId = generateId(this.clients);
    while (taken.has(opponentId) || opponentId === client.id) {
      opponentId += 1;
    }

    const game = new Game(this, this.allocateGameId(), gameSettings);
    this.games.push(game);
    game.dispatch(client, new AddPlayerAction(client.id, client.name, deck1, undefined, deckId1, sleeveImagePath1, appearances1));
    game.dispatch(
      client,
      new AddPlayerAction(opponentId, `${client.name} (2)`, deck2, undefined, deckId2, sleeveImagePath2, appearances2)
    );
    game.initSelfPlay(client.user.id);

    if (this.games.indexOf(game) !== -1) {
      this.emit(c => c.onGameAdd(game));
      this.joinGame(client, game);
    }
    return game;
  }

  public createGameWithDecks(
    client: Client,
    deck: string[],
    gameSettings: GameSettings = new GameSettings(),
    client2: Client,
    deck2: string[],
    artworksMap1?: { [code: string]: { imageUrl: string; holoType?: string } },
    artworksMap2?: { [code: string]: { imageUrl: string; holoType?: string } },
    deckId1?: number,
    deckId2?: number,
    sleeveImagePath1?: string,
    sleeveImagePath2?: string,
    appearances1?: (import('../store/card/free-basic-energy').CardAppearance | null)[],
    appearances2?: (import('../store/card/free-basic-energy').CardAppearance | null)[]
  ): Game {
    gameSettings = coerceGameSettings(gameSettings);
    if (this.clients.indexOf(client) === -1) {
      throw new GameError(GameMessage.ERROR_CLIENT_NOT_CONNECTED);
    }
    if (this.clients.indexOf(client2) === -1) {
      throw new GameError(GameMessage.ERROR_CLIENT_NOT_CONNECTED);
    }

    console.log(`[Matchmaking] Match created between ${client.name} and ${client2.name} (Format: ${gameSettings.format})`);
    if (gameSettings.format === Format.RETRO) {
      gameSettings.rules.attackFirstTurn = true;
      gameSettings.rules.firstTurnDrawCard = false;
      gameSettings.rules.supporterCleanupAtEndTurn = true;
    }
    if (gameSettings.format === Format.RSPK) {
      gameSettings.rules.attackFirstTurn = true;
      gameSettings.rules.firstTurnDrawCard = false;
      gameSettings.rules.supporterCleanupAtEndTurn = true;
    }
    if (gameSettings.format === Format.BW) {
      gameSettings.rules.attackFirstTurn = true;
      gameSettings.rules.firstTurnDrawCard = true;
      gameSettings.rules.firstTurnUseSupporter = true;
    }
    const game = new Game(this, this.allocateGameId(), gameSettings);
    this.games.push(game);
    game.dispatch(client, new AddPlayerAction(client.id, client.name, deck, artworksMap1, deckId1, sleeveImagePath1, appearances1));
    game.dispatch(client, new AddPlayerAction(client2.id, client2.name, deck2, artworksMap2, deckId2, sleeveImagePath2, appearances2));
    if (this.games.indexOf(game) !== -1) {
      this.emit(c => c.onGameAdd(game));
      this.joinGame(client, game);
      this.joinGame(client2, game);
    }
    return game;
  }

  public joinGame(client: Client, game: Game): void {
    if (this.clients.indexOf(client) === -1) {
      throw new GameError(GameMessage.ERROR_CLIENT_NOT_CONNECTED);
    }
    if (this.games.indexOf(game) === -1) {
      throw new GameError(GameMessage.ERROR_GAME_NOT_FOUND);
    }
    if (config.duo.enabled) {
      game.registerPlayer(client);
      const playerId = game.getPlayerIdForUser(client.user.id);
      if (playerId === undefined) throw new GameError(GameMessage.ERROR_GAME_NOT_FOUND);
      if (game.isPlayerDisconnected(playerId)) {
        if (this.clients.some(other => other !== client && other.id === playerId)) {
          throw new GameError(GameMessage.ERROR_GAME_NOT_FOUND);
        }
        client.id = playerId;
        if (!game.handlePlayerReconnection(client)) throw new GameError(GameMessage.ERROR_GAME_NOT_FOUND);
      } else if (client.id !== playerId || game.clients.some(other => other !== client && other.id === playerId)) {
        throw new GameError(GameMessage.ERROR_GAME_NOT_FOUND);
      }
    }
    if (!client.games.includes(game)) {
      this.emit(c => c.onGameJoin(game, client));
      client.games.push(game);
      if (!game.clients.includes(client)) game.clients.push(client);
      game.registerPlayer(client);
    }
  }

  public deleteGame(game: Game): void {
    game.clients.forEach(client => {
      const index = client.games.indexOf(game);
      if (index !== -1) {
        client.games.splice(index, 1);
        this.emit(c => c.onGameLeave(game, client));
      }
    });
    const index = this.games.indexOf(game);
    if (index !== -1) {
      this.games.splice(index, 1);
      this.emit(c => c.onGameDelete(game));
    }
  }

  public leaveGame(client: Client, game: Game): void {
    if (this.clients.indexOf(client) === -1) {
      throw new GameError(GameMessage.ERROR_CLIENT_NOT_CONNECTED);
    }
    if (this.games.indexOf(game) === -1) {
      throw new GameError(GameMessage.ERROR_GAME_NOT_FOUND);
    }
    const gameIndex = client.games.indexOf(game);
    const clientIndex = game.clients.indexOf(client);
    if (clientIndex !== -1 && gameIndex !== -1) {
      client.games.splice(gameIndex, 1);
      game.clients.splice(clientIndex, 1);
      this.emit(c => c.onGameLeave(game, client));
      game.handleClientLeave(client);
    }
    if (game.clients.length === 0) {
      this.deleteGame(game);
    }
  }

  public emit(fn: (client: Client) => void): void {
    this.clients.forEach(fn);
  }

  /**
   * Broadcast user updates to all connected clients
   */
  private broadcastUserUpdates(): void {
    // Get all unique users from connected clients
    const userIds = new Set(this.clients.map(c => c.user.id));
    const users = Array.from(userIds).map(userId => {
      const client = this.clients.find(c => c.user.id === userId);
      return client ? client.user : null;
    }).filter((user): user is User => user !== null);

    // Emit user updates to all clients
    this.emit(c => c.onUsersUpdate(users));
  }

  private startRankingDecrease() {
    const scheduler = Scheduler.getInstance();
    const rankingCalculator = new RankingCalculator();
    scheduler.run(async () => {
      let users = await rankingCalculator.decreaseRanking();

      // Notify only about users which are currently connected
      const connectedUserIds = this.clients.map(c => c.user.id);
      users = users.filter(u => connectedUserIds.includes(u.id));

      this.emit(c => c.onUsersUpdate(users));
    }, config.core.rankingDecreaseIntervalCount);
  }

  private startInactiveGameCleanup(): void {
    const everyMs = 5 * 60 * 1000;
    const inactiveTimeout = 5 * 60 * 1000;

    void this.runGameCleanupPass(inactiveTimeout);

    this.inactiveCleanupIntervalRef = setInterval(() => {
      void this.runGameCleanupPass(inactiveTimeout);
    }, everyMs);
  }

  private shouldRemoveStaleGame(game: Game, inactiveTimeout: number): boolean {
    const state = game.state;
    if (state.phase === GamePhase.FINISHED) {
      return true;
    }
    if (state.players.length === 0) {
      return true;
    }
    // A casual two-player room must not abort a live game while people think.
    // Disconnected seats retain the independent reconnection/forfeit timer.
    if (config.duo.enabled && game.clients.length > 0) return false;
    return game.isInactive(inactiveTimeout);
  }

  private async runGameCleanupPass(inactiveTimeout: number): Promise<void> {
    for (const game of [...this.games]) {
      if (!this.shouldRemoveStaleGame(game, inactiveTimeout)) {
        continue;
      }
      await this.forceRemoveGame(game);
    }
  }

  private async forceRemoveGame(game: Game): Promise<void> {
    if (this.games.indexOf(game) === -1) {
      return;
    }

    if (game.clients.length === 0) {
      try {
        const activeSessions = await this.reconnectionManager.getActiveDisconnectedSessions();
        const gameHasPreservedSessions = activeSessions.some(session => session.gameId === game.id);
        if (gameHasPreservedSessions) {
          console.log(`[Game Cleanup] Skipping cleanup of game ${game.id} - has preserved sessions`);
          return;
        }
      } catch (error) {
        console.log(`[Game Cleanup] Error checking preserved sessions for game ${game.id}: ${error}`);
        return;
      }
    }

    console.log(`[Game Cleanup] Cleaning up stale game ${game.id}`);
    const state = game.state;
    if (state.phase !== GamePhase.FINISHED && state.players.length > 0) {
      for (const player of state.players) {
        const action = new AbortGameAction(player.id, AbortGameReason.DISCONNECTED);
        if (game.clients.length > 0) {
          game.dispatch(game.clients[0], action);
        } else {
          game.getStore().dispatch(action);
        }
      }
    }
    game.cleanup();
    this.deleteGame(game);
  }

  /**
   * Dispose of the Core and cleanup resources
   */
  public dispose(): void {
    if (this.inactiveCleanupIntervalRef !== undefined) {
      clearInterval(this.inactiveCleanupIntervalRef);
      this.inactiveCleanupIntervalRef = undefined;
    }
    if (this.reconnectionManager) {
      this.reconnectionManager.dispose();
    }
    logger.log('[Core] Disposed');
  }

  private isBotClient(client: Client): boolean {
    // Check if the client has bot-specific methods
    return 'isFormatAllowed' in client && 'getAllowedFormats' in client;
  }

}