import 'reflect-metadata';
import { Connection, createConnection, getMetadataArgsStorage } from 'typeorm';
import * as entities from '../../storage';
import { EconomyAccount, EconomyRecord, Match, User } from '../../storage';
import { EconomyService, economyTransaction } from '../../economy/service';
import { GamePhase, GameWinner, Player, State } from '../';
import { MatchRecorder } from './match-recorder';

// Real SQLite transactions, no App, env files, timers from Core, or disk database.
describe('match settlement shares the wallet transaction boundary', () => {
  let connection: Connection;
  beforeAll(async () => {
    void entities;
    connection = await createConnection({ type: 'sqlite', database: ':memory:', synchronize: true,
      entities: getMetadataArgsStorage().tables.map(t => t.target as Function), logging: false });
  });
  beforeEach(async () => {
    await Match.clear(); await EconomyRecord.clear(); await EconomyAccount.clear(); await User.clear();
  });
  afterAll(async () => { await connection.close(); });

  async function fixture() {
    const users = await User.save([
      User.create({ name: 'settlement-a', ranking: 500 }),
      User.create({ name: 'settlement-b', ranking: 500 }),
    ]);
    const core: any = { clients: users.map((user, index) => ({ id: index + 1, user })), emit: jasmine.createSpy('emit') };
    const recorder: any = new MatchRecorder(core);
    recorder.client1 = core.clients[0]; recorder.client2 = core.clients[1];
    const state = new State(); state.phase = GamePhase.FINISHED; state.winner = GameWinner.PLAYER_1; state.turn = 2;
    state.players = [new Player(), new Player()]; state.players[0].id = 1; state.players[1].id = 2;
    return { users, core, recorder, state };
  }

  it('waits for an unfinished wallet operation, then commits both independently', async () => {
    const { users, core, recorder, state } = await fixture();
    let release!: () => void, entered!: () => void;
    const hold = new Promise<void>(resolve => { release = resolve; });
    const began = new Promise<void>(resolve => { entered = resolve; });
    const wallet = economyTransaction(connection, async manager => {
      await new EconomyService(manager).checkIn(users[0].id);
      entered(); await hold;
    });
    await began;
    let settled = false;
    const settlement = recorder.saveMatch(state).then(() => { settled = true; });
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(settled).toBe(false);
    expect(await Match.count()).toBe(0);
    expect(core.emit).not.toHaveBeenCalled();
    release(); await Promise.all([wallet, settlement]);
    expect(await Match.count()).toBe(1);
    // Winner: check-in 2000 + win 1500; loser: loss 500.
    expect((await EconomyAccount.findOne({ userId: users[0].id }))!.balanceMinor).toBe(3500);
    expect((await EconomyAccount.findOne({ userId: users[1].id }))!.balanceMinor).toBe(500);
    expect(await EconomyRecord.count({ where: { userId: users[0].id, kind: 'check-in' } })).toBe(1);
    expect(await EconomyRecord.count({ where: { userId: users[0].id, kind: 'match' } })).toBe(1);
    expect(await EconomyRecord.count({ where: { userId: users[1].id, kind: 'match' } })).toBe(1);
    expect(core.emit.calls.count()).toBe(1);
    expect(users[0].ranking).toBeGreaterThan(500);
  });

  it('pays no coins for self-play, which would credit the one account as both winner and loser', async () => {
    const user = await User.save(User.create({ name: 'self-play', ranking: 500 }));
    const client: any = { id: 1, user };
    const core: any = { clients: [client], emit: jasmine.createSpy('emit') };
    const recorder: any = new MatchRecorder(core, { selfPlay: true } as any);
    recorder.client1 = client; recorder.client2 = client;
    const state = new State(); state.phase = GamePhase.FINISHED; state.winner = GameWinner.PLAYER_1; state.turn = 2;
    state.players = [new Player(), new Player()]; state.players[0].id = 1; state.players[1].id = 2;
    await recorder.saveMatch(state);
    expect(await Match.count()).toBe(1);
    expect(await EconomyAccount.count({ where: { userId: user.id } })).toBe(0);
    expect(await EconomyRecord.count({ where: { userId: user.id, kind: 'match' } })).toBe(0);
  });

  it('pays no coins for a game that ends before the second turn', async () => {
    const { recorder, state } = await fixture();
    state.turn = 1; // setup-phase concede
    await recorder.saveMatch(state);
    expect(await Match.count()).toBe(1);
    expect(await EconomyRecord.count({ where: { kind: 'match' } })).toBe(0);
  });

  for (const failedPlayer of [0, 1]) {
    it(`rolls back both players when player ${failedPlayer + 1}'s reward record cannot be inserted`, async () => {
      const { users, core, recorder, state } = await fixture();
      const balances = [10000, 20000];
      await EconomyAccount.save(users.map((user, index) => EconomyAccount.create({
        userId: user.id, balanceMinor: balances[index], lastClaimDay: '2000-01-01',
      })));
      const errors = spyOn(console, 'error');
      // Fail the real SQLite INSERT, after the recipient's balance UPDATE. For player 2,
      // player 1's balance and reward record have already been written in this transaction.
      await connection.query(`CREATE TEMP TRIGGER reject_match_reward BEFORE INSERT ON economy_record
        WHEN NEW.kind = 'match' AND NEW.userId = ${users[failedPlayer].id}
        BEGIN SELECT RAISE(ABORT, 'synthetic reward record failure'); END`);
      try {
        await recorder.saveMatch(state);
        expect(errors.calls.count()).toBe(1);
        expect(errors.calls.mostRecent().args[0]).toBe('[MatchRecorder] Error saving match:');
        expect(String(errors.calls.mostRecent().args[1])).toContain('synthetic reward record failure');
        expect(await Match.count()).toBe(0);
        expect(await EconomyRecord.count()).toBe(0);
        expect(await EconomyAccount.count()).toBe(2);
        for (const [index, user] of users.entries()) {
          const account = (await EconomyAccount.findOne(user.id))!;
          expect(account.balanceMinor).toBe(balances[index]);
          expect(account.lastClaimDay).toBe('2000-01-01');
          const persisted = (await User.findOne(user.id))!;
          expect(persisted.ranking).toBe(500);
          expect(persisted.lastRankingChange).toBe(0);
          expect(user.ranking).toBe(500);
          expect(user.lastRankingChange).toBe(0);
        }
        expect(core.emit).not.toHaveBeenCalled();
        expect(recorder.transactionTimeout).toBeUndefined();
        // The rejected settlement must not poison the transaction queue for either wallet.
        for (const [index, user] of users.entries()) {
          await economyTransaction(connection, manager => new EconomyService(manager).checkIn(user.id));
          expect((await EconomyAccount.findOne(user.id))!.balanceMinor).toBe(balances[index] + 2000);
          expect(await EconomyRecord.count({ where: { userId: user.id, kind: 'check-in' } })).toBe(1);
        }
        expect(await EconomyRecord.count({ where: { kind: 'match' } })).toBe(0);
        expect(await Match.count()).toBe(0);
      } finally {
        await connection.query('DROP TRIGGER reject_match_reward');
      }
    });
  }

  it('rolls back a failed settlement without poisoning the next wallet transaction or live ranking', async () => {
    const { users, core, recorder, state } = await fixture();
    spyOn(console, 'error');
    // Fail after inserting the match, so rollback—not an empty write path—is tested.
    recorder.awardBattlePassXp = async () => { throw new Error('synthetic settlement failure'); };
    await recorder.saveMatch(state);
    expect(await Match.count()).toBe(0);
    expect((await User.findOne(users[0].id))!.ranking).toBe(500);
    expect(users[0].ranking).toBe(500);
    expect(core.emit).not.toHaveBeenCalled();
    await economyTransaction(connection, manager => new EconomyService(manager).checkIn(users[0].id));
    expect((await EconomyAccount.findOne({ userId: users[0].id }))!.balanceMinor).toBe(2000);
  });
});
