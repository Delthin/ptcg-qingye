import { EntityManager } from 'typeorm';
import { User } from '../storage/model/user';
import { serializedTransaction } from '../storage/transaction';

export interface TutorialProgressUpdate {
  userId: number; stage: string; step: number; version: number; actions: string;
  nextStage: string; nextStep: number; nextActions: string;
}

/** TypeORM 0.2's sqlite driver executes UPDATE through Database.all(), so
 * UpdateResult.affected is undefined even after a successful update. Use the
 * same prepared query with sqlite3.run() and its statement-local changes count.
 * The shared transaction queue keeps this write outside other economy rollbacks.
 */
export function compareAndSetTutorial(manager: EntityManager, update: TutorialProgressUpdate): Promise<boolean> {
  return serializedTransaction(manager.connection, async transaction => {
    const query = transaction.createQueryBuilder().update(User)
      .set({ onboardingStage: update.nextStage, onboardingStep: update.nextStep, onboardingActions: update.nextActions })
      .where('id = :id AND onboardingStage = :stage AND onboardingStep = :step AND onboardingVersion = :version AND onboardingActions = :actions AND roleId <> 1',
        { id: update.userId, stage: update.stage, step: update.step, version: update.version, actions: update.actions });
    if (manager.connection.options.type !== 'sqlite') return (await query.execute()).affected === 1;
    const [sql, parameters] = query.getQueryAndParameters();
    // SQLite's runner and underlying connection are shared; do not release them here.
    const connection = await transaction.queryRunner!.connect();
    return new Promise<boolean>((resolve, reject) => {
      connection.run(sql, parameters, function(this: { changes: number }, error: Error | null) {
        if (error) reject(error); else resolve(this.changes === 1);
      });
    });
  });
}
