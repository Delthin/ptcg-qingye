import { json } from 'body-parser';
import * as compression from 'compression';
import * as express from 'express';
import { resolve } from 'path';
import { privateDuoAsset } from './services/duo-session';

import { config } from '../config';
import { BotManager } from '../game/bots/bot-manager';
import { Core } from '../game/core/core';
import { Storage } from '../storage';
import { cors } from './services/cors';
import { WebSocketServer } from './socket/websocket-server';
import { MemoryOptimizationService } from './services/memory-optimization.service';
import { Tutorial } from './controllers/tutorial';

import {
  Avatars,
  Cards,
  ControllerClass,
  Decks,
  Duo,
  Economy,
  Favorites,
  Friends,
  Game,
  Images,
  Login,
  Messages,
  Profile,
  Ranking,
  Replays,
  ResetPassword,
  BattlePass,
  Sleeves,
  MemoryHealthController,
} from './controllers';
import { ApiErrorEnum } from './common/errors';

export class App {

  private app: express.Application;
  private ws: WebSocketServer;
  private storage: Storage;
  private core: Core = new Core(config.reconnection);
  private memoryOptimization: MemoryOptimizationService;

  constructor() {
    this.storage = new Storage();
    this.app = this.configureExpress();
    this.ws = this.configureWebSocket();
    this.memoryOptimization = MemoryOptimizationService.getInstance();
  }

  private configureExpress(): express.Application {
    const storage = this.storage;
    const core = this.core;
    const app = express();

    const define = function (path: string, controller: ControllerClass): void {
      const instance = new controller(path, app, storage, core);
      instance.init();
    };

    // General limit: base + avatar size (4x) + replay size (4x for base64 encoding overhead).
    // /v1/replays uses a higher limit so long-game replay imports are not rejected at the parser.
    const defaultJsonLimit = 512 + config.backend.avatarFileSize * 4 + config.backend.replayFileSize * 4;
    const parseJsonDefault = json({ limit: defaultJsonLimit });
    const parseJsonReplays = json({ limit: config.backend.replayImportJsonBodyLimit });
    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (req.path.startsWith('/v1/replays')) {
        return parseJsonReplays(req, res, next);
      }
      return parseJsonDefault(req, res, next);
    });
    app.use(cors());

    // The public entry point reaches this process over a bandwidth-limited link, so every
    // compressible response (card JSON, catalog, bundle on a cache miss) must be compressed
    // here rather than at the edge. PNG card scans are already compressed and stay untouched.
    app.use(compression({ threshold: 1024, level: 5 }));

    // Health check endpoint - must be first route
    app.get('/health', async (req, res) => {
      try {
        // Check database connection
        const dbStatus = await storage.checkConnection();
        res.status(200).json({
          status: 'ok',
          database: dbStatus ? 'connected' : 'disconnected',
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        res.status(500).json({
          status: 'error',
          database: 'error',
          error: error?.message || 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Static files
    if (config.sets.scansDir) {
      app.use('/scans', privateDuoAsset, express.static(config.sets.scansDir));
    }
    app.use('/avatars', express.static(config.backend.avatarsDir));
    app.use('/sleeves', express.static(config.backend.sleevesDir));

    // API routes
    define('/v1/avatars', Avatars);
    app.use('/v1/cards', privateDuoAsset);
    define('/v1/cards', Cards);
    define('/v1/decks', Decks);
    define('/v1/duo', Duo);
    define('/v1/duo/economy', Economy);
    define('/v1/duo/tutorial', Tutorial);
    define('/v1/game', Game);
    define('/v1/images', Images);
    define('/v1/login', Login);
    define('/v1/profile', Profile);
    define('/v1/replays', Replays);
    define('/v1/sleeves', Sleeves);
    if (!config.duo.enabled) {
      define('/v1/favorites', Favorites);
      define('/v1/friends', Friends);
      define('/v1/messages', Messages);
      define('/v1/ranking', Ranking);
      define('/v1/resetPassword', ResetPassword);
      define('/v1/battlepass', BattlePass);
      define('/v1/memory', MemoryHealthController);
    }

    if (config.duo.clientDir) {
      // Vite hashes these build outputs (JS/CSS, font and audio assets). Letting the CDN and
      // browsers keep them avoids re-fetching multi-megabyte fonts and bundles over the
      // bandwidth-limited origin link. Hand-authored images keep the default validators.
      const hashedBuildFile = /-[A-Za-z0-9_-]{8}\.[a-z0-9]+$/;
      const hashableExtension = /\.(?:js|css|woff2?|ttf|otf|mp3|ogg|wav|m4a)$/;
      app.use(express.static(config.duo.clientDir, {
        setHeaders: (res, filePath) => {
          const name = filePath.slice(filePath.lastIndexOf('/') + 1);
          if (name === 'index.html') {
            res.setHeader('Cache-Control', 'no-cache');
          } else if (hashableExtension.test(name) && hashedBuildFile.test(name)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          } else if (/\.(?:png|webp|svg|jpe?g|gif|ico|mp3|ogg|wav|m4a|woff2?|ttf|otf)$/.test(name)) {
            // Shared art and audio keep a short public lifetime instead of forcing a full
            // re-fetch of multi-megabyte files over the origin link.
            res.setHeader('Cache-Control', 'public, max-age=86400');
          }
        }
      }));
      app.get('*', (req, res) => {
        if (/^\/(v1|scans|avatars|sleeves|socket\.io)(\/|$)/.test(req.path)) {
          res.status(404).send({ error: 'NOT_FOUND' });
          return;
        }
        res.sendFile(resolve(config.duo.clientDir, 'index.html'));
      });
    }

    app.use((err: any, req: any, res: any, next: any) => {
      // Handle request aborted errors
      if (err && (
        (err.type === 'request.aborted') ||
        (err.code === 'ECONNRESET') ||
        (err.status === 400 && err.message === 'request aborted')
      )) {
        return;
      }

      // Handle payload too large errors
      if (err && (
        err.status === 413 ||
        err.statusCode === 413 ||
        err.type === 'entity.too.large' ||
        (err.message && err.message.includes('too large'))
      )) {
        const path = typeof req.originalUrl === 'string'
          ? req.originalUrl.split('?')[0]
          : req.path;
        const contentLength = req.get('content-length');
        const userId = typeof req.body?.userId === 'number' ? req.body.userId : undefined;
        console.error('[HTTP Error] PayloadTooLargeError:', err.message, {
          method: req.method,
          path,
          contentLength: contentLength ?? 'unknown',
          ...(userId !== undefined ? { userId } : {}),
        });
        if (!res.headersSent) {
          res.status(413).json({ error: ApiErrorEnum.PAYLOAD_TOO_LARGE });
        }
        return;
      }

      // Log other errors
      console.error('[HTTP Error]', err.stack);

      // Only send response if headers haven't been sent yet
      if (!res.headersSent) {
        res.status(500).send('Something broke!');
      }
    });

    return app;
  }

  private configureWebSocket(): WebSocketServer {
    const ws = new WebSocketServer(this.core);

    ws.server?.on('error', (error) => {
      console.error(error);
    });

    return ws;
  }

  public connectToDatabase(): Promise<void> {
    return this.storage.connect();
  }

  public configureBotManager(botManager: BotManager): void {
    botManager.initBots(this.core);
  }

  public start(): void {
    const address = config.backend.address;
    const port = config.backend.port;

    const httpServer = this.app.listen(port, address, () => {
      console.log(`Server listening on ${address}:${port}.`);
    });

    this.ws.listen(httpServer);

    // Start memory optimization service
    this.memoryOptimization.start();

    console.log('Memory optimization service started.');
  }

}
