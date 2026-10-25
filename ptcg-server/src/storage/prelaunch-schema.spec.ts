import { Connection, createConnection } from 'typeorm';
import { addPrelaunchColumns } from './prelaunch-schema';

describe('Prelaunch additive SQLite migration', () => {
  let connection: Connection;
  beforeEach(async () => {
    connection = await createConnection({ name: 'prelaunch-schema-test', type: 'sqlite', database: ':memory:', entities: [], synchronize: false });
  });
  afterEach(async () => { await connection.close(); });

  it('preserves referenced account/deck rows, defaults old users to public and already taught, and is idempotent', async () => {
    await connection.query('PRAGMA foreign_keys = ON');
    await connection.query('CREATE TABLE "user" (id integer PRIMARY KEY, name varchar NOT NULL)');
    await connection.query('CREATE TABLE "deck" (id integer PRIMARY KEY, userId integer REFERENCES "user"(id), cards text NOT NULL)');
    await connection.query('INSERT INTO "user" VALUES (7, ?)', ['existing-account']);
    await connection.query('INSERT INTO "deck" VALUES (9, 7, ?)', ['["Lightning Energy SVE"]']);
    await addPrelaunchColumns(connection);
    await addPrelaunchColumns(connection);
    const users = await connection.query('SELECT * FROM "user"');
    expect(users).toEqual([{ id: 7, name: 'existing-account', duoDeckId: null, duoPublic: 1, onboardingStage: 'done', onboardingStep: 0, onboardingVersion: 1, onboardingActions: '[]' }]);
    expect(await connection.query('SELECT * FROM "deck"')).toEqual([{ id: 9, userId: 7, cards: '["Lightning Energy SVE"]', printingIds: null }]);
    expect(await connection.query('PRAGMA foreign_key_check')).toEqual([]);
  });

  it('leaves fresh databases to the ordinary schema creator', async () => {
    await addPrelaunchColumns(connection);
    expect(await connection.query('PRAGMA table_info("user")')).toEqual([]);
    expect(await connection.query('PRAGMA table_info("deck")')).toEqual([]);
  });
});
