import { randomBytes } from 'crypto';
import { EntityManager } from 'typeorm';
import { EconomyAccount, EconomyRecord } from '../storage';

/**
 * Game-currency paid out when an online match settles. Single place to tune the
 * "play matches -> buy packs" loop; amounts are integer minor units (fen).
 */
export const BATTLE_REWARD_MINOR = { win: 1500, draw: 1000, loss: 500 } as const;
export type BattleOutcome = keyof typeof BATTLE_REWARD_MINOR;

const MAX_BALANCE = 1000000000;
const LABEL: Record<BattleOutcome, string> = {
  win: '对战胜利奖励',
  draw: '对战平局奖励',
  loss: '对战落败奖励',
};

/**
 * Credit one player's match reward inside the caller's transaction. Not exposed over HTTP:
 * only the settlement flow decides outcomes, and clients never send the amount.
 * Returns the amount actually credited (0 when the balance is already at the cap).
 */
export async function awardBattleReward(manager: EntityManager, userId: number, outcome: BattleOutcome,
  matchId: number): Promise<number> {
  const amount = BATTLE_REWARD_MINOR[outcome];
  let account = await manager.findOne(EconomyAccount, userId);
  if (!account) account = manager.create(EconomyAccount, { userId, balanceMinor: 0, lastClaimDay: null });
  const granted = Math.max(0, Math.min(amount, MAX_BALANCE - account.balanceMinor));
  if (granted <= 0) return 0;
  account.balanceMinor += granted;
  await manager.save(account);
  await manager.save(manager.create(EconomyRecord, {
    id: randomBytes(16).toString('hex'), userId, kind: 'match', label: LABEL[outcome], amountMinor: granted,
    detailJson: JSON.stringify({ matchId, outcome }), createdAt: new Date().toISOString(),
  }));
  return granted;
}
