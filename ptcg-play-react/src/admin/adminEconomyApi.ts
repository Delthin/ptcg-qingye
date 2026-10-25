import { apiGet, apiPost } from '../api/client';
import { validateEconomySnapshot, validatePrintings, type EconomySnapshot, type OwnedPrinting } from '../collection/economyTypes';

/** Safe projection of another account's economy; never merged into the signed-in user's EconomyContext. */
export interface AdminUserSummary {
  userId: number;
  name: string;
  roleId: number;
  balanceMinor: number;
  holdingCount: number;
  packCount: number;
  lastSeen: string | number | null;
}

export interface AdminGrantCard { printingId: string; count: number }
export interface AdminGrantPayload {
  targetUserId: number;
  amountMinor?: number;
  cards?: AdminGrantCard[];
  reason: string;
}

const safeInteger = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value);

function parseAdminUsers(body: unknown): AdminUserSummary[] {
  if (!body || typeof body !== 'object' || !Array.isArray((body as { users?: unknown }).users)) {
    throw new Error('用户列表返回的数据不完整，请重新搜索。');
  }
  const users = (body as { users: unknown[] }).users;
  return users.map(user => {
    if (!user || typeof user !== 'object') throw new Error('用户列表返回的数据不完整，请重新搜索。');
    const row = user as Record<string, unknown>;
    if (!safeInteger(row.userId) || row.userId <= 0 || typeof row.name !== 'string' || !row.name.trim() ||
      !safeInteger(row.roleId) || !safeInteger(row.balanceMinor) || row.balanceMinor < 0 ||
      !safeInteger(row.holdingCount) || row.holdingCount < 0 || !safeInteger(row.packCount) || row.packCount < 0 ||
      !((row.lastSeen === null) || typeof row.lastSeen === 'string' || typeof row.lastSeen === 'number')) {
      throw new Error('用户列表返回的字段不完整，请刷新后重试。');
    }
    return row as unknown as AdminUserSummary;
  });
}

export function searchAdminUsers(q: string, signal?: AbortSignal): Promise<AdminUserSummary[]> {
  return apiGet<unknown>(`/v1/duo/economy/admin/users?q=${encodeURIComponent(q)}`, { signal }).then(parseAdminUsers);
}

/** Returns the target account's snapshot; validated against targetUserId so it can never be mistaken for the admin's own. */
export function getAdminUserSnapshot(targetUserId: number, signal?: AbortSignal): Promise<EconomySnapshot> {
  return apiGet<{ snapshot: unknown }>(`/v1/duo/economy/admin/user?targetUserId=${encodeURIComponent(targetUserId)}`, { signal })
    .then(result => validateEconomySnapshot(result.snapshot, targetUserId));
}

export function searchAdminCatalog(q: string, signal?: AbortSignal): Promise<OwnedPrinting[]> {
  return apiGet<unknown>(`/v1/duo/economy/admin/catalog?q=${encodeURIComponent(q)}`, { signal })
    .then(body => {
      if (!body || typeof body !== 'object' || !Array.isArray((body as { cards?: unknown }).cards)) {
        throw new Error('卡牌目录返回的数据不完整，请重新搜索。');
      }
      return validatePrintings((body as { cards: unknown[] }).cards);
    });
}

/** Single-shot grant; callers must not auto-retry unknown-outcome submissions. */
export function adminGrant(payload: AdminGrantPayload, signal?: AbortSignal): Promise<EconomySnapshot> {
  return apiPost<{ snapshot: unknown }>('/v1/duo/economy/admin/grant', payload, { signal })
    .then(result => validateEconomySnapshot(result.snapshot, payload.targetUserId));
}
