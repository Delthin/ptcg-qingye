import 'reflect-metadata';
import { EntityManager } from 'typeorm';
import { compareAndSetTutorial } from './progress';

/** No connection/SQLite file: exercise generated predicate and statement-local receipts with a driver double. */
function receiptDriver() {
  let row: Record<string, unknown> = { id: 7, onboardingStage: 'battle', onboardingStep: 0, onboardingVersion: 1, onboardingActions: '[]', roleId: 0 };
  let predicate = '';
  let released = false;
  const manager: any = {};
  manager.connection = {
    options: { type: 'sqlite' },
    transaction: (run: (transaction: EntityManager) => Promise<unknown>) => run(manager),
  };
  manager.queryRunner = { connect: async () => ({
    run: (sql: string, args: any, callback: (this: { changes: number }, error: Error | null) => void) => {
      // Interpret the captured comparisons, rather than duplicating the production predicate.
      const clauses = sql.split(' AND ');
      const matches = clauses.every(clause => {
        const equal = /^(\w+) = :(\w+)$/.exec(clause);
        if (equal) return row[equal[1]] === args.parameters[equal[2]];
        const unequal = /^(\w+) <> (\d+)$/.exec(clause);
        if (unequal) return row[unequal[1]] !== Number(unequal[2]);
        throw new Error(`Unexpected predicate: ${clause}`);
      });
      if (matches) row = { ...row, ...args.values };
      callback.call({ changes: matches ? 1 : 0 }, null);
    },
  }), release: () => { released = true; } };
  manager.createQueryBuilder = () => {
    let values: unknown;
    let parameters: unknown;
    const builder: any = {
      update: () => builder,
      set: (next: unknown) => { values = next; return builder; },
      where: (where: string, params: unknown) => { predicate = where; parameters = params; return builder; },
      getQueryAndParameters: () => [predicate, { values, parameters }],
    };
    return builder;
  };
  return { manager: manager as EntityManager, row: () => row, predicate: () => predicate,
    ban: () => { row.roleId = 1; }, released: () => released };
}

describe('Tutorial history compare-and-set receipts (no database)', () => {
  it('allows exactly one same-step sub-action and rejects stale history, foreign and banned writes', async () => {
    const driver = receiptDriver();
    const nextActions = '[{"step":0,"action":{"type":"resolvePrompt","id":1,"result":true}}]';
    const change = { userId: 7, stage: 'battle', step: 0, version: 1, actions: '[]', nextStage: 'battle', nextStep: 0, nextActions };
    const results = await Promise.all([compareAndSetTutorial(driver.manager, change), compareAndSetTutorial(driver.manager, change)]);
    expect(results.filter(Boolean).length).toBe(1);
    expect(driver.row().onboardingStep).toBe(0); // A lesson step alone cannot distinguish these writes.
    expect(driver.row().onboardingActions).toBe(nextActions);
    expect(driver.predicate()).toContain('onboardingActions = :actions');
    expect(await compareAndSetTutorial(driver.manager, change)).toBe(false);
    expect(await compareAndSetTutorial(driver.manager, { ...change, userId: 999, actions: nextActions })).toBe(false);
    driver.ban();
    expect(await compareAndSetTutorial(driver.manager, { ...change, actions: nextActions, nextStep: 1 })).toBe(false);
    expect(driver.row().onboardingStep).toBe(0);
    expect(driver.released()).toBe(false);
  });

  it('compares full history, not just its length', async () => {
    const driver = receiptDriver();
    const change = { userId: 7, stage: 'battle', step: 0, version: 1, actions: '[ ]', nextStage: 'battle', nextStep: 0, nextActions: '[]' };
    expect(await compareAndSetTutorial(driver.manager, change)).toBe(false);
    expect(driver.row().onboardingActions).toBe('[]');
  });
});
