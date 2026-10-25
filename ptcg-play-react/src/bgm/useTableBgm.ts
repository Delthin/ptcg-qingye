import { useEffect } from 'react';
import { GamePhase } from 'ptcg-server';
import type { LocalGameState } from '../table/types/localGameState';
import { useBgmPrefs } from './bgmSettings';
import { startBgm, stopBgm } from './bgmPlayer';

type UseTableBgmOptions = {
  localGame: LocalGameState | null | undefined;
};

/**
 * 对战期间的 BGM 生命周期。
 *
 * 只有真正在打的一局才放：回放和已经结算的对局都不放。离开牌桌时淡出停掉。
 * 开关与主题来自偏好仓库，改主题会立刻换曲，关掉再打开会接着当前对局放。
 */
export function useTableBgm({ localGame }: UseTableBgmOptions): void {
  const { enabled, theme, track } = useBgmPrefs();
  const inMatch = Boolean(localGame)
    && localGame?.replay == null
    && localGame?.state.phase !== GamePhase.FINISHED
    && localGame?.gameOver !== true;

  useEffect(() => {
    if (enabled && inMatch) {
      startBgm(theme, track);
    } else {
      stopBgm();
    }
  }, [enabled, theme, track, inMatch]);

  useEffect(() => () => stopBgm(), []);
}
