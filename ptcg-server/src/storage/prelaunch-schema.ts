import { Connection } from 'typeorm';

/** Additive SQLite migration before TypeORM synchronizes referenced tables.
 * Existing accounts retain their visibility and are not forced into onboarding.
 * No rows, decks, holdings or account identities are recreated.
 */
export async function addPrelaunchColumns(connection: Connection): Promise<void> {
  const additions: Record<string, Record<string, string>> = {
    user: {
      equippedCoinId: "varchar NOT NULL DEFAULT 'twinleaf'",
      duoDeckId: 'integer',
      duoPublic: 'boolean NOT NULL DEFAULT 1',
      onboardingStage: "varchar NOT NULL DEFAULT 'done'",
      onboardingStep: 'integer NOT NULL DEFAULT 0',
      onboardingVersion: 'integer NOT NULL DEFAULT 1',
      onboardingActions: "text NOT NULL DEFAULT '[]'",
    },
    deck: { printingIds: 'text' },
    economy_pack: { deckJson: 'text' },
    economy_coin: { count: 'integer NOT NULL DEFAULT 1' },
  };
  for (const [table, definitions] of Object.entries(additions)) {
    const columns: { name: string }[] = await connection.query(`PRAGMA table_info("${table}")`);
    if (!columns.length) continue; // Fresh databases are created by schema synchronization.
    const names = new Set(columns.map(column => column.name));
    for (const [name, definition] of Object.entries(definitions)) {
      if (!names.has(name)) await connection.query(`ALTER TABLE "${table}" ADD COLUMN "${name}" ${definition}`);
    }
  }
}
