import { Connection, EntityManager } from 'typeorm';

const queues = new WeakMap<Connection, Promise<unknown>>();

/** Queue whole transactions on the shared connection. SQLite cannot safely
 * overlap wallet, registration and match-settlement transactions. A rejection
 * must not poison the next operation, and TypeORM still owns commit/rollback. */
export function serializedTransaction<T>(connection: Connection,
  run: (manager: EntityManager) => Promise<T>): Promise<T> {
  const previous = queues.get(connection) || Promise.resolve();
  const current = previous.catch(() => undefined).then(() => connection.transaction(run));
  queues.set(connection, current.then(() => undefined, () => undefined));
  return current;
}
