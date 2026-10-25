import { Request, Response } from 'express';
import { getManager } from 'typeorm';
import { timingSafeEqual } from 'crypto';
import { config } from '../../config';
import { Deck, Match, User, Friend, FriendRequest, FriendRequestStatus } from '../../storage';
import { GamePhase, GameWinner } from '../../game';
import { AuthToken, Validate, check } from '../services';
import { ApiErrorEnum } from '../common/errors';
import { RateLimit } from '../common/rate-limit';
import { hashPassword } from '../services/password';
import { changeDuoFriend, DuoFriendAction, DuoSocialError } from '../services/duo-social';
import { EconomyService, economyTransaction } from '../../economy/service';
import { checkPlayableDeckOwnership, DeckOwnershipError, storedPrintingIds } from '../../economy/deck-ownership';
import { Controller, Get, Post } from './controller';

const ROLE_LABELS: { [name: string]: string } = { red: '赤红', leaf: '叶子' };

/** Private account-based lobby. Match results come only from the game engine. */
export class Duo extends Controller {
  @Get('/roles')
  public onRoles(req: Request, res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    res.send({ ok: true, registrationEnabled: config.duo.enabled && !!process.env.DUO_ROOM_PASSWORD,
      roles: [] }); // Registration info must not advertise account names.
  }

  @Post('/register')
  public async onRegister(req: Request, res: Response) {
    const limiter = RateLimit.getInstance();
    const credentialKey = `credentials:${req.ip}`;
    if (limiter.isLimitExceeded(credentialKey, 'http', 20)) {
      res.status(429).send({ error: ApiErrorEnum.REQUESTS_LIMIT_REACHED }); return;
    }
    limiter.increment(credentialKey);
    const secret = process.env.DUO_ROOM_PASSWORD;
    if (!config.duo.enabled || !secret) { res.status(400).send({ error: ApiErrorEnum.REGISTER_DISABLED }); return; }
    const { name, password, roomPassword } = req.body;
    if (!check().isName(10).validate(name)) {
      res.status(400).send({ error: ApiErrorEnum.VALIDATION_INVALID_PARAM, param: 'name' }); return;
    }
    if (typeof password !== 'string' || password.length < 6 || password.length > 64 || /\s/.test(password)) {
      res.status(400).send({ error: ApiErrorEnum.VALIDATION_INVALID_PARAM, param: 'password' }); return;
    }
    if (typeof roomPassword !== 'string' || !roomPassword || roomPassword.length > 256) {
      res.status(400).send({ error: ApiErrorEnum.REGISTER_INVALID_SERVER_PASSWORD }); return;
    }
    const given = Buffer.from(roomPassword), expected = Buffer.from(secret);
    if (!(given.length === expected.length && timingSafeEqual(given, expected))) { res.status(400).send({ error: ApiErrorEnum.REGISTER_INVALID_SERVER_PASSWORD }); return; }
    try {
      if (await User.findOne({ where: { name } })) {
        res.status(400).send({ error: ApiErrorEnum.REGISTER_NAME_EXISTS }); return;
      }
      const hashed = await hashPassword(password);
      await economyTransaction(getManager().connection, async manager => {
        const user = manager.create(User, { name, password: hashed, email: '', registered: Date.now(),
          duoPublic: false, onboardingVersion: 1, onboardingStage: 'home', onboardingStep: 0, onboardingActions: '[]' });
        await manager.save(user);
        // Only the gift deck has actual inventory. Do not copy unowned practice presets.
        const gift = await new EconomyService(manager).giftRandomStarter(user.id);
        if (!gift) throw new Error('Starter gift unavailable');
        await manager.update(User, user.id, { duoDeckId: gift.id });
      });
    } catch (error) {
      // The database unique constraint also protects concurrent signups.
      try {
        if (await User.findOne({ where: { name } })) {
          res.status(400).send({ error: ApiErrorEnum.REGISTER_NAME_EXISTS }); return;
        }
      } catch { /* Database failures are not misclassified as duplicate accounts. */ }
      res.status(500).send({ error: ApiErrorEnum.SERVER_ERROR }); return;
    }
    res.status(201).send({ ok: true });
  }

  @Get('/state')
  @AuthToken()
  public async onState(req: Request, res: Response) {
    const userId = req.body.userId;
    const me = await User.findOne(userId);
    if (!me || me.roleId === 1) {
      res.status(403).send({ error: ApiErrorEnum.AUTH_INVALID_PERMISSIONS }); return;
    }
    res.setHeader('Cache-Control', 'no-store');
    const rows = await Match.createQueryBuilder('m').leftJoin('m.player1', 'p1').leftJoin('m.player2', 'p2')
      .where('(p1.id = :userId OR p2.id = :userId) AND p1.id <> p2.id', { userId })
      .select('m.id', 'id').addSelect('p1.id', 'player1Id').addSelect('p2.id', 'player2Id')
      .addSelect('m.winner', 'winner').addSelect('m.created', 'created')
      .addSelect('m.player1DeckName', 'deck1').addSelect('m.player2DeckName', 'deck2')
      .orderBy('m.created', 'DESC').limit(20).getRawMany();
    const friends = await Friend.getFriendsList(userId);
    const friendIds = new Set(friends.map(row => row.user_id === userId ? row.friend_id : row.user_id));
    const publicUsers = await User.find({ where: { duoPublic: true } });
    const currentPeerIds = this.core.games.filter(game => game.getPlayerIdForUser(userId) != null ||
      game.clients.some(client => client.user.id === userId)).flatMap(game =>
        [...game.getPlayerUserIds(), ...game.clients.map(client => client.user.id)]);
    const recommendedIds = new Set([userId, ...publicUsers.map(user => user.id), ...friendIds]);
    const ids = Array.from(new Set([...recommendedIds, ...currentPeerIds,
      ...rows.reduce<number[]>((list, row) => list.concat(Number(row.player1Id), Number(row.player2Id)), [])]));
    const users = (await User.findByIds(ids)).filter(user => user.roleId !== 1);
    const myDeck = me.duoDeckId == null ? undefined : await Deck.findOne({ where: { id: me.duoDeckId, user: { id: userId } } });
    const ready = async (ownerId: number, deck: Deck | undefined): Promise<{ ready: boolean; reason?: string }> => {
      if (!deck) return { ready: false, reason: '未选择出战卡组' };
      if (!deck.isValid) return { ready: false, reason: '卡组构筑未完成' };
      try {
        await checkPlayableDeckOwnership(ownerId, JSON.parse(deck.cards), storedPrintingIds(deck));
        return { ready: true };
      } catch (error) {
        // 只返回原因类别，不向对手透露缺少的卡名、版次或收藏数量。
        const reason = error instanceof DeckOwnershipError
          ? error.message.includes('持有不足') ? '卡组缺少收藏卡'
            : error.message === '卡牌不存在。' ? '卡组含暂不支持的卡'
              : error.message.includes('引用') || error.message.includes('映射') ? '卡组版本信息需更新'
                : '卡组不符合对战规则'
          : '卡组暂时无法核对';
        return { ready: false, reason };
      }
    };
    const myDeckStatus = await ready(userId, myDeck);
    const myDeckReady = myDeckStatus.ready;
    const totals = await Match.createQueryBuilder('m').leftJoin('m.player1', 'p1').leftJoin('m.player2', 'p2')
      .where('(p1.id IN (:...ids) OR p2.id IN (:...ids)) AND p1.id <> p2.id', { ids })
      .select('p1.id', 'player1Id').addSelect('p2.id', 'player2Id').addSelect('m.winner', 'winner')
      .addSelect('COUNT(*)', 'count').groupBy('p1.id').addGroupBy('p2.id').addGroupBy('m.winner').getRawMany();
    const occupied = (id: number) => this.core.games.some(game => game.state.phase !== GamePhase.FINISHED &&
      (game.getPlayerIdForUser(id) != null || game.clients.some(client => client.user.id === id)));
    const myBusy = occupied(userId);
    const players = await Promise.all(users.map(async user => {
      const deck = user.duoDeckId == null ? undefined : await Deck.findOne({
        where: { id: user.duoDeckId, user: { id: user.id } },
      });
      let wins = 0, losses = 0, draws = 0;
      for (const row of totals) {
        if (Number(row.player1Id) !== user.id && Number(row.player2Id) !== user.id) continue;
        const count = Number(row.count), winner = Number(row.winner);
        const isFirst = Number(row.player1Id) === user.id;
        if (winner === GameWinner.DRAW) draws += count;
        else if ((winner === GameWinner.PLAYER_1 && isFirst) || (winner === GameWinner.PLAYER_2 && !isFirst)) wins += count;
        else if (winner !== GameWinner.NONE) losses += count;
      }
      const connected = this.core.clients.some(client => client.user.id === user.id);
      const busy = occupied(user.id);
      const deckStatus = user.id === userId ? myDeckStatus : connected ? await ready(user.id, deck) : { ready: false };
      const deckReady = deckStatus.ready;
      const challengeable = user.id !== userId && connected && !busy && !myBusy && deckReady && myDeckReady;
      const unavailableReason = user.id === userId || challengeable ? undefined
        : busy ? '对战中'
          : !connected ? '离线'
            : myBusy ? '你已在对战中'
              : !deckReady ? `对方${deckStatus.reason}`
                : !myDeckReady ? `你的${myDeckStatus.reason}` : '暂不可挑战';
      return { userId: user.id, name: user.name, label: ROLE_LABELS[user.name] || user.name,
        duoPublic: user.duoPublic, isFriend: friendIds.has(user.id),
        connected, busy, deckReady, challengeable, unavailableReason,
        deckUnavailableReason: user.id === userId ? myDeckStatus.reason : undefined,
        selectedDeckId: deck && (user.id === userId || deck.isValid) ? deck.id : null,
        selectedDeckName: deck && deck.isValid ? deck.name : '', wins, losses, draws };
    }));
    players.sort((a, b) => Number(b.userId === userId) - Number(a.userId === userId) ||
      Number(b.connected) - Number(a.connected) || a.userId - b.userId);
    const requests = await FriendRequest.find({ where: [
      { sender_id: userId, status: FriendRequestStatus.PENDING },
      { receiver_id: userId, status: FriendRequestStatus.PENDING }
    ], relations: ['sender', 'receiver'] });
    res.send({ ok: true, players: players.filter(player => recommendedIds.has(player.userId)),
      peers: players.filter(player => !recommendedIds.has(player.userId)),
      requests: requests.filter(row => row.sender.roleId !== 1 && row.receiver.roleId !== 1).map(row => ({
        id: row.id, direction: row.sender_id === userId ? 'outgoing' : 'incoming',
        userId: row.sender_id === userId ? row.receiver_id : row.sender_id,
        name: row.sender_id === userId ? row.receiver.name : row.sender.name
      })), matches: rows.map(row => ({
      ...row, id: Number(row.id), player1Id: Number(row.player1Id), player2Id: Number(row.player2Id),
      winner: Number(row.winner), created: Number(row.created),
    })) });
  }

  @Post('/visibility')
  @AuthToken()
  @Validate({ duoPublic: check().isBoolean() })
  public async onVisibility(req: Request, res: Response) {
    // userId is overwritten by AuthToken; never accept another account's target ID.
    await economyTransaction(getManager().connection, manager =>
      manager.update(User, req.body.userId, { duoPublic: req.body.duoPublic }));
    await this.core.refreshDuoPresence();
    res.send({ ok: true, duoPublic: req.body.duoPublic });
  }

  @Post('/lookup')
  @AuthToken()
  public async onLookup(req: Request, res: Response) {
    if (!this.socialLimit(req, res)) return;
    if (!check().isName().validate(req.body.name)) {
      res.status(400).send({ error: ApiErrorEnum.VALIDATION_INVALID_PARAM, param: 'name' }); return;
    }
    // Exact equality only. No LIKE/prefix endpoint is exposed for hidden accounts.
    const target = await User.findOne({ where: { name: req.body.name } });
    const client = target && [...this.core.clients].reverse().find(row => row.user.id === target.id);
    res.setHeader('Cache-Control', 'no-store');
    res.send({ ok: true, target: !target || target.roleId === 1 ? null : {
      userId: target.id, name: target.name, connected: !!client, clientId: client?.id ?? null
    } });
  }

  @Post('/friends')
  @AuthToken()
  public async onFriendAction(req: Request, res: Response) {
    if (!this.socialLimit(req, res)) return;
    const { action, targetId } = req.body;
    if (!['send', 'accept', 'reject', 'cancel', 'remove'].includes(action) ||
        !Number.isInteger(targetId) || targetId <= 0) {
      res.status(400).send({ error: ApiErrorEnum.VALIDATION_INVALID_PARAM }); return;
    }
    try { await changeDuoFriend(req.body.userId, action as DuoFriendAction, targetId); }
    catch (error) {
      if (error instanceof DuoSocialError) { res.status(error.status).send({ error: error.code }); return; }
      res.status(500).send({ error: ApiErrorEnum.SERVER_ERROR }); return;
    }
    await this.core.refreshDuoPresence();
    res.send({ ok: true });
  }

  private socialLimit(req: Request, res: Response): boolean {
    const limiter = RateLimit.getInstance(), key = `duo-social:${req.body.userId}:${req.ip}`;
    if (limiter.isLimitExceeded(key, 'http', 30)) {
      res.status(429).send({ error: ApiErrorEnum.REQUESTS_LIMIT_REACHED }); return false;
    }
    limiter.increment(key); return true;
  }

  @Post('/select-deck')
  @AuthToken()
  @Validate({ deckId: check().isInt() })
  public async onSelectDeck(req: Request, res: Response) {
    const user = await User.findOne(req.body.userId);
    if (!user || user.roleId === 1) {
      res.status(403).send({ error: ApiErrorEnum.AUTH_INVALID_PERMISSIONS }); return;
    }
    const deck = await Deck.findOne({ where: { id: req.body.deckId, user: { id: user.id } } });
    if (!deck || !deck.isValid) { res.status(400).send({ error: ApiErrorEnum.DECK_INVALID }); return; }
    try { await checkPlayableDeckOwnership(user.id, JSON.parse(deck.cards), storedPrintingIds(deck)); }
    catch { res.status(400).send({ error: 'ECONOMY_DECK_OWNERSHIP', message: '这套卡组缺少对应的收藏卡牌，请补齐后再选择出战。' }); return; }
    await User.update(user.id, { duoDeckId: deck.id });
    res.send({ ok: true, selectedDeckId: deck.id });
  }
}
