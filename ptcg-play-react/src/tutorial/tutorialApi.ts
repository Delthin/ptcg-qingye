import { apiGet, apiPost } from '../api/client';
import { ApiError } from '../api/apiError';
import type { CardTarget, GameState } from 'ptcg-server';

/**
 * 新手教学（固定脚本对局 + 首页导览）前端 API。
 * 后端契约：
 *   GET  /v1/duo/tutorial         → { ok: true, tutorial: TutorialState }
 *   POST /v1/duo/tutorial/action  → 同结构
 *   错误：{ error: 'TUTORIAL_INVALID' | 'TUTORIAL_STEP_MISMATCH', message: '中文' }（HTTP 409 表示步数过期）
 * 注意 ApiError.code 运行时可能携带 TUTORIAL_ 前缀字符串（不在 ApiErrorEnum 枚举内），
 * 因此一律经 String() 归一后再比较，message 以服务端中文为准。
 */

export type TutorialTarget = 'hand' | 'active' | 'bench' | 'pass' | 'attack' | 'prizes';

export type TutorialEngineAction =
  | { type: 'playCard'; handIndex: number; target: CardTarget }
  | { type: 'resolvePrompt'; id: number; result: unknown }
  | { type: 'retreatStart' }
  | { type: 'retreat'; to: number }
  | { type: 'attack'; attack: string }
  | { type: 'passTurn' };

export interface TutorialInstruction {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  target: TutorialTarget;
  cardFullName?: string;
}

export type TutorialStage = 'home' | 'battle' | 'done' | 'skipped';

export interface TutorialState {
  version: number;
  /** Accepted receipt count; two sub-actions can share a lesson step. */
  revision: number;
  stage: TutorialStage;
  step: number;
  homeTotal: number;
  battleTotal: number;
  /** 仅 stage === 'skipped' 时出现：跳过前的进度位置。 */
  resumeStage?: 'home' | 'battle';
  instruction?: TutorialInstruction | null;
  battle?: GameState;
}

export type TutorialOperation = 'home-next' | 'act' | 'finish' | 'skip' | 'resume' | 'restart';

export interface TutorialActionPayload {
  version: number;
  step: number;
  revision: number;
  operation: TutorialOperation;
  action?: TutorialEngineAction;
}

interface TutorialEnvelope {
  ok: true;
  tutorial: TutorialState;
}

function unwrap(envelope: TutorialEnvelope): TutorialState {
  if (!envelope || typeof envelope !== 'object' || !envelope.tutorial) {
    throw new Error('教学数据格式不正确');
  }
  return envelope.tutorial;
}

export function getTutorial(signal?: AbortSignal): Promise<TutorialState> {
  return apiGet<TutorialEnvelope>('/v1/duo/tutorial', { signal }).then(unwrap);
}

export function tutorialAction(
  payload: TutorialActionPayload,
  signal?: AbortSignal,
): Promise<TutorialState> {
  return apiPost<TutorialEnvelope>('/v1/duo/tutorial/action', payload, { signal }).then(unwrap);
}

/** Explicit recovery also works when the saved lesson cannot be loaded. */
export function restartTutorial(signal?: AbortSignal): Promise<TutorialState> {
  return apiPost<TutorialEnvelope>('/v1/duo/tutorial/action', { operation: 'restart' }, { signal }).then(unwrap);
}

/** 步数过期（他处推进 / 重复提交被 409 拒绝）：需要静默刷新本地状态，不得盲目重发。 */
export function isTutorialMismatch(error: unknown): boolean {
  return error instanceof ApiError && String(error.code ?? '') === 'TUTORIAL_STEP_MISMATCH';
}

/** 面向用户的中文错误：优先服务端 message，本地兜底两类 TUTORIAL_ 错误。 */
export function tutorialErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const code = String(error.code ?? '');
    const message = error.message?.trim();
    if (message && message !== code) return message;
    if (code === 'TUTORIAL_STEP_MISMATCH') return '教学进度已在别处更新，正在为你刷新最新局面。';
    if (code === 'TUTORIAL_INVALID') return '这一步操作不符合要求，请按提示选择卡牌和目标并确认。';
    if (error.timeout) return '网络请求超时，请稍后重试。';
    return '教学服务暂时不可用，请稍后重试。';
  }
  if (error instanceof Error && error.message) return error.message;
  return '教学服务暂时不可用，请稍后重试。';
}
