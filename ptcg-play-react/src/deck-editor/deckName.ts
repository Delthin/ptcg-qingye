import { ApiErrorEnum } from 'ptcg-server';
import { ApiError } from '../api/apiError';

export const DECK_NAME_MIN_LENGTH = 3;
export const DECK_NAME_MAX_LENGTH = 32;

/** Match the server's trim().length validation, including UTF-16 length. */
export function deckNameError(name: string): string | null {
  const length = name.trim().length;
  if (length < DECK_NAME_MIN_LENGTH) return '卡组名称太短，请输入至少 3 个字符。';
  if (length > DECK_NAME_MAX_LENGTH) return '卡组名称太长，请缩短至 32 个字符以内。';
  return null;
}

export function deckNameSaveError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === ApiErrorEnum.NAME_DUPLICATE) return '已有同名卡组，请换一个名称。';
    if (error.code === ApiErrorEnum.VALIDATION_INVALID_PARAM && error.param === 'name') {
      return '卡组名称须为 3–32 个字符，请检查后重试。';
    }
    if (error.code === ApiErrorEnum.REQUESTS_LIMIT_REACHED) return '操作过于频繁，请稍后再试。';
    if (error.code === ApiErrorEnum.AUTH_TOKEN_INVALID) return '登录已过期，请重新登录后保存名称。';
  }
  return '连接或服务异常，名称未能确认保存。请刷新卡组列表核对后重试。';
}
