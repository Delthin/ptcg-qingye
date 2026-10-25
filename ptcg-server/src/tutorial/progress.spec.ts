import 'reflect-metadata';
import { Connection, createConnection, getConnectionManager, getMetadataArgsStorage } from 'typeorm';
import * as entities from '../storage';
import { User } from '../storage';
import { compareAndSetTutorial } from './progress';

describe('SQLite tutorial compare-and-set receipts', () => {
  let connection: Connection;
  let previous: Connection | undefined;
  const targets = getMetadataArgsStorage().tables.map(table => table.target as Function);
  beforeAll(async () => {
    void entities;
    const connections = getConnectionManager();
    previous = connections.has('default') ? connections.get('default') : undefined;
    connection = await createConnection({ name: 'tutorial-cas-test', type: 'sqlite', database: ':memory:', entities: targets, synchronize: true });
  });
  afterAll(async () => {
    await connection.close();
    if (previous?.isConnected) for (const target of targets) {
      const entity = target as typeof User;
      if (typeof entity.useConnection === 'function') entity.useConnection(previous);
    }
  });
  it('returns success for exactly one competing write and rejects stale, foreign and banned targets', async () => {
    const manager = connection.manager;
    const user = await manager.save(manager.create(User, { name: 'tutorial-cas-member', onboardingStage: 'home' }));
    const change = { userId: user.id, stage: 'home', step: 0, version: 1, actions: '[]', nextStage: 'home', nextStep: 1, nextActions: '[]' };
    const receipts = await Promise.all([compareAndSetTutorial(manager, change), compareAndSetTutorial(manager, change)]);
    expect(receipts.filter(Boolean).length).toBe(1);
    expect((await manager.findOne(User, user.id))!.onboardingStep).toBe(1);
    expect(await compareAndSetTutorial(manager, change)).toBe(false);
    expect(await compareAndSetTutorial(manager, { ...change, userId: 999 })).toBe(false);
    await manager.update(User, user.id, { roleId: 1 });
    expect(await compareAndSetTutorial(manager, { ...change, step: 1, nextStep: 2 })).toBe(false);
    expect((await manager.findOne(User, user.id))!.onboardingStep).toBe(1);
  });
});
