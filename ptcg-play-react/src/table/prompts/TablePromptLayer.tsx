import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { merge } from 'rxjs';
import { GameMessage } from 'ptcg-server';
import type {
  AlertPrompt,
  AttachEnergyPrompt,
  Card,
  ChooseCardsPrompt,
  ChoosePokemonPrompt,
  ChoosePrizePrompt,
  ConfirmCardsPrompt,
  ConfirmPrompt,
  PutDamagePrompt,
  RemoveDamagePrompt,
  MoveDamagePrompt,
  SelectPrompt,
  ShowCardsPrompt,
  ShowMulliganPrompt,
  WaitPrompt,
  ChooseAttackPrompt,
  ChooseEnergyPrompt,
  DiscardEnergyPrompt,
  InvitePlayerPrompt,
  MoveEnergyPrompt,
  OrderCardsPrompt,
  SelectOptionPrompt,
} from 'ptcg-server';
import type { LocalGameState } from '../types/localGameState';
import { activeGamePrompt } from '../activeGamePrompt';
import { BoardInteractionService } from '../BoardInteractionService';
import { TableConfirmAction } from '../hud/TablePrimaryAction';
import { useBoardEffectSurface } from '../useBoardEffectInteraction';
import { CardFace } from '../../components/cards/CardFace';
import { CardInfoPopup } from '../../card-info/CardInfoPopup';
import { CheckboxField } from '../../components/ui/CheckboxField';
import { useDeckName } from '../../hooks/useDeckName';
import { playSfx } from '../../sfx';
import styles from './TablePromptLayer.module.css';
import { AttachEnergyPromptPanel } from './AttachEnergyPromptPanel';
import { ChooseAttackPromptPanel } from './ChooseAttackPromptPanel';
import { ChooseEnergyPromptPanel } from './ChooseEnergyPromptPanel';
import { MoveEnergyPromptPanel } from './MoveEnergyPromptPanel';
import { DiscardEnergyPromptPanel } from './DiscardEnergyPromptPanel';
import { InvitePlayerPromptPanel } from './InvitePlayerPromptPanel';
import { OrderCardsPromptPanel } from './OrderCardsPromptPanel';
import { SelectOptionPromptPanel } from './SelectOptionPromptPanel';
import { PutDamageOverlay } from './PutDamageOverlay';
import { RemoveDamageOverlay } from './RemoveDamageOverlay';
import { MoveDamageOverlay } from './MoveDamageOverlay';
import { scanBlockedOwnZeroDamageFromState } from './pokemonPromptRows';
import { getPromptPerspectivePlayerId } from './promptPerspective';
import { BOARD3D_ATTACK_ANIMATION_DURATION_SEC, BOARD3D_ABILITY_ANIMATION_DURATION_SEC } from '../board3d/services/board-3d-animation.service';
import { COIN_FLIP_SERVER_WAIT_MS } from '../coin-flip-animation';
import {
  BOARD_DECK_SHUFFLE_SERVER_WAIT_MS,
  BOARD_DRAW_WAIT_FALLBACK_MS,
  BOARD_HAND_TO_DECK_WAIT_FALLBACK_MS,
} from '../animationTiming';
import {
  autoTakeChoosePrizeIndices,
  shouldAutoTakeChoosePrize,
} from './choosePrizeAutoTake';
import {
  shouldUseBoardHandForChooseCards,
  isChooseCardsFromPlayerHand,
} from './chooseCardsHandSelection';

import { cardDisplayName, cardSearchFields, localizeGameValue } from '../../duo/chineseCatalog';

const CHOOSE_CARDS_CARD_BACK = '/assets/duo-cardback.svg';

/** Visual prize numbers (match Angular board layout). */
const PRIZE_SLOT_LABELS = [5, 6, 3, 4, 1, 2];

function buildChooseCardsFilterMap(
  cards: Card[],
  filter: ChooseCardsPrompt['filter'],
  blocked: number[],
): Record<number, boolean> {
  const filterMap: Record<number, boolean> = {};
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    let isBlocked = blocked.includes(i);
    if (!isBlocked) {
      for (const key in filter) {
        if (Object.prototype.hasOwnProperty.call(filter, key)) {
          isBlocked =
            isBlocked ||
            (filter as Record<string, unknown>)[key] !== (card as unknown as Record<string, unknown>)[key];
        }
      }
    }
    filterMap[i] = !isBlocked;
  }
  return filterMap;
}

export type TablePromptLayerProps = {
  localGame: LocalGameState;
  clientId: number;
  catalog: Card[];
  getScanUrl: (card: Card) => string;
  boardInteraction: BoardInteractionService;
  onResolvePrompt: (promptId: number, result: unknown) => void | Promise<void>;
  /** Hide Choose prize until 3D KO animation finishes (same server prompt, deferred UI). */
  suppressChoosePrizePrompt?: boolean;
};

function gameMessageText(t: TFunction, message: string | number): string {
  const key = `GAME_MESSAGES.${message}`;
  return t(key, { defaultValue: String(message) });
}

function setupStartingSnackbarMessage(
  boardInteraction: BoardInteractionService,
  t: TFunction,
  fallback: string,
): string {
  if (!boardInteraction.isChooseStartingPokemonsSelectionActive()) {
    return fallback;
  }
  if (!boardInteraction.isSetupActivePhaseSkipped() && !boardInteraction.isSetupActiveLocked()) {
    return '双方同时准备 · 先选战斗宝可梦';
  }
  if (boardInteraction.hasMoreSetupBenchBasicsAvailable()) {
    return t('REACT_SETUP_CHOOSE_BENCH', { defaultValue: '可继续选择备战宝可梦，然后点击确定' });
  }
  return fallback;
}

/** Matches legacy server WaitPrompt message used before attack damage (see game-effect useAttack). */
function isAttackAnimationWaitPrompt(wp: WaitPrompt): boolean {
  const m = wp.message;
  if (m === undefined || m === null) {
    return false;
  }
  return String(m).toLowerCase().includes('attack animation');
}

/** Matches server WaitPrompt before board Pokémon ability resolution (see game-effect usePower). */
function isAbilityAnimationWaitPrompt(wp: WaitPrompt): boolean {
  const m = wp.message;
  if (m === undefined || m === null) {
    return false;
  }
  return String(m).toLowerCase().includes('ability animation');
}

/** Matches server WaitPrompt before coin flip resolution (see attack-coin-reflip.ts). */
function isCoinFlipAnimationWaitPrompt(wp: WaitPrompt): boolean {
  const m = wp.message;
  if (m === undefined || m === null) {
    return false;
  }
  return String(m).toLowerCase().includes('coin flip animation');
}

function isHandToDeckAnimationWaitPrompt(wp: WaitPrompt): boolean {
  const m = wp.message;
  if (m === undefined || m === null) {
    return false;
  }
  return String(m).toLowerCase().includes('hand to deck animation');
}

function isDeckShuffleAnimationWaitPrompt(wp: WaitPrompt): boolean {
  const m = wp.message;
  if (m === undefined || m === null) {
    return false;
  }
  return String(m).toLowerCase().includes('deck shuffle animation');
}

function isDrawAnimationWaitPrompt(wp: WaitPrompt): boolean {
  const m = wp.message;
  if (m === undefined || m === null) {
    return false;
  }
  return String(m).toLowerCase().includes('draw animation');
}

function SilentWaitPrompt(props: {
  promptId: number;
  durationMs: number;
  resolve: (id: number, result: unknown) => void | Promise<void>;
}) {
  const { promptId, durationMs, resolve } = props;
  useEffect(() => {
    if (durationMs <= 0) {
      void resolve(promptId, null);
      return;
    }
    const tmr = window.setTimeout(() => {
      void resolve(promptId, null);
    }, durationMs);
    return () => clearTimeout(tmr);
  }, [promptId, durationMs, resolve]);
  return null;
}

function CoinFlipAnimationWaitPrompt(props: {
  promptId: number;
  durationMs: number;
  resolve: (id: number, result: unknown) => void | Promise<void>;
}) {
  const { promptId, durationMs, resolve } = props;
  return (
    <SilentWaitPrompt
      promptId={promptId}
      durationMs={durationMs > 0 ? durationMs : COIN_FLIP_SERVER_WAIT_MS}
      resolve={resolve}
    />
  );
}

/**
 * Await a pending board animation promise (poll briefly), then fall back to duration.
 * Shared by hand→deck / shuffle / draw silent WaitPrompts.
 */
function PendingBoardAnimationWaitPrompt(props: {
  promptId: number;
  fallbackMs: number;
  pollMs?: number;
  /** How far before mount an animation start still counts (trainer prompt delay can be ~2.5s). */
  startedAtSkewMs?: number;
  kind: 'handToDeck' | 'shuffle' | 'draw';
  boardInteraction: BoardInteractionService;
  resolve: (id: number, result: unknown) => void | Promise<void>;
}) {
  const {
    promptId,
    fallbackMs,
    pollMs = 900,
    startedAtSkewMs = 200,
    kind,
    boardInteraction,
    resolve,
  } = props;
  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (cancelled) return;
      cancelled = true;
      void resolve(promptId, null);
    };

    const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

    const getPromise = (): Promise<void> | null => {
      if (kind === 'handToDeck') {
        return boardInteraction.getPendingHandToDeckAnimationPromise();
      }
      if (kind === 'shuffle') {
        return boardInteraction.getPendingDeckShuffleAnimationPromise();
      }
      return boardInteraction.getPendingDrawAnimationPromise();
    };

    const getStartedAt = (): number => {
      if (kind === 'handToDeck') {
        return boardInteraction.getHandToDeckAnimationStartedAt();
      }
      if (kind === 'shuffle') {
        return boardInteraction.getDeckShuffleAnimationStartedAt();
      }
      return boardInteraction.getDrawAnimationStartedAt();
    };

    void (async () => {
      const mountTime = Date.now();
      const pollUntil = mountTime + pollMs;
      let p: Promise<void> | null = null;
      while (Date.now() < pollUntil && !cancelled) {
        const startedAt = getStartedAt();
        // Accept animations that began before this WaitPrompt mounted (common when the
        // trainer-play prompt delay deferred mounting until after the motion started).
        if (startedAt > 0 && startedAt >= mountTime - startedAtSkewMs) {
          p = getPromise();
          if (p) {
            break;
          }
        }
        await sleep(16);
      }
      if (cancelled) {
        return;
      }
      if (p) {
        await p;
        finish();
        return;
      }
      // Animation already finished before mount: resolve immediately if it was recent.
      const startedAt = getStartedAt();
      const existing = getPromise();
      if (existing && startedAt > 0 && mountTime - startedAt < startedAtSkewMs) {
        await existing;
        finish();
        return;
      }
      const remaining = fallbackMs - (Date.now() - mountTime);
      if (remaining > 0) {
        await sleep(remaining);
      }
      finish();
    })();

    return () => {
      cancelled = true;
    };
  }, [promptId, fallbackMs, pollMs, startedAtSkewMs, kind, boardInteraction, resolve]);

  return null;
}

function HandToDeckAnimationWaitPrompt(props: {
  promptId: number;
  durationMs: number;
  boardInteraction: BoardInteractionService;
  resolve: (id: number, result: unknown) => void | Promise<void>;
}) {
  const { promptId, durationMs, boardInteraction, resolve } = props;
  const fallback = durationMs > 0 ? Math.min(durationMs, BOARD_HAND_TO_DECK_WAIT_FALLBACK_MS) : BOARD_HAND_TO_DECK_WAIT_FALLBACK_MS;
  return (
    <PendingBoardAnimationWaitPrompt
      promptId={promptId}
      fallbackMs={fallback}
      pollMs={2000}
      startedAtSkewMs={5000}
      kind="handToDeck"
      boardInteraction={boardInteraction}
      resolve={resolve}
    />
  );
}

function DeckShuffleAnimationWaitPrompt(props: {
  promptId: number;
  durationMs: number;
  boardInteraction: BoardInteractionService;
  resolve: (id: number, result: unknown) => void | Promise<void>;
}) {
  const { promptId, durationMs, boardInteraction, resolve } = props;
  const fallback = durationMs > 0 ? durationMs : BOARD_DECK_SHUFFLE_SERVER_WAIT_MS;
  return (
    <PendingBoardAnimationWaitPrompt
      promptId={promptId}
      fallbackMs={fallback}
      kind="shuffle"
      boardInteraction={boardInteraction}
      resolve={resolve}
    />
  );
}

function DrawAnimationWaitPrompt(props: {
  promptId: number;
  durationMs: number;
  boardInteraction: BoardInteractionService;
  resolve: (id: number, result: unknown) => void | Promise<void>;
}) {
  const { promptId, durationMs, boardInteraction, resolve } = props;
  const fallback = durationMs > 0 ? Math.min(durationMs, BOARD_DRAW_WAIT_FALLBACK_MS) : BOARD_DRAW_WAIT_FALLBACK_MS;
  return (
    <PendingBoardAnimationWaitPrompt
      promptId={promptId}
      fallbackMs={fallback}
      pollMs={1200}
      kind="draw"
      boardInteraction={boardInteraction}
      resolve={resolve}
    />
  );
}

function AttackAnimationWaitPrompt(props: {
  promptId: number;
  boardInteraction: BoardInteractionService;
  resolve: (id: number, result: unknown) => void | Promise<void>;
}) {
  const { promptId, boardInteraction, resolve } = props;
  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (cancelled) return;
      cancelled = true;
      void resolve(promptId, null);
    };

    const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

    void (async () => {
      const pollUntil = Date.now() + 900;
      let p: Promise<void> | null = null;
      while (Date.now() < pollUntil && !cancelled) {
        p = boardInteraction.getPendingAttackAnimationPromise();
        if (p) {
          break;
        }
        await sleep(16);
      }
      if (cancelled) {
        return;
      }
      if (p) {
        await p;
        finish();
        return;
      }
      await sleep(BOARD3D_ATTACK_ANIMATION_DURATION_SEC * 1000);
      finish();
    })();

    return () => {
      cancelled = true;
    };
  }, [promptId, boardInteraction, resolve]);

  return null;
}

function AbilityAnimationWaitPrompt(props: {
  promptId: number;
  boardInteraction: BoardInteractionService;
  resolve: (id: number, result: unknown) => void | Promise<void>;
}) {
  const { promptId, boardInteraction, resolve } = props;
  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (cancelled) return;
      cancelled = true;
      void resolve(promptId, null);
    };

    const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

    void (async () => {
      const mountTime = Date.now();
      const minDurationMs = BOARD3D_ABILITY_ANIMATION_DURATION_SEC * 1000;
      const animationStartDeadline = mountTime + 1200;

      boardInteraction.requestAbilityAnimationPlayback();

      let animationPromise: Promise<void> | null = null;
      while (Date.now() < animationStartDeadline && !cancelled) {
        const startedAt = boardInteraction.getAbilityAnimationStartedAt();
        // Socket animation may begin slightly before the WaitPrompt state arrives.
        if (startedAt >= mountTime - 200) {
          animationPromise = boardInteraction.getPendingAbilityAnimationPromise();
          if (animationPromise) {
            break;
          }
        }
        await sleep(16);
      }

      if (cancelled) {
        return;
      }

      if (animationPromise) {
        await animationPromise;
      }

      const elapsed = Date.now() - mountTime;
      const remaining = minDurationMs - elapsed;
      if (remaining > 0) {
        await sleep(remaining);
      }

      finish();
    })();

    return () => {
      cancelled = true;
    };
  }, [promptId, boardInteraction, resolve]);

  return null;
}

function useLocalGameRef(localGame: LocalGameState) {
  const ref = useRef(localGame);
  ref.current = localGame;
  return ref;
}

function useChoosePokemonBoardEffect(
  localGameRef: React.MutableRefObject<LocalGameState>,
  clientId: number,
  boardInteraction: BoardInteractionService,
  onResolvePrompt: (promptId: number, result: unknown) => void,
  choosePokemonPromptId: number | null,
  replay: boolean | undefined,
) {
  useEffect(() => {
    if (choosePokemonPromptId == null) {
      return;
    }

    if (replay) {
      boardInteraction.setReplayMode(true);
      return () => {
        boardInteraction.setReplayMode(false);
      };
    }

    boardInteraction.setReplayMode(false);
    const game = localGameRef.current;
    const prompt = activeGamePrompt(game, clientId);
    if (!prompt || prompt.id !== choosePokemonPromptId || prompt.type !== 'Choose pokemon') {
      return;
    }

    const cp = prompt as ChoosePokemonPrompt;
    const pid = cp.id;
    boardInteraction.startBoardSelection(cp, (targets) => {
      void onResolvePrompt(pid, targets);
    });

    return () => {
      boardInteraction.endBoardSelection();
    };
  }, [choosePokemonPromptId, clientId, boardInteraction, onResolvePrompt, replay]);
}

function useChooseHandCardsBoardEffect(
  localGameRef: React.MutableRefObject<LocalGameState>,
  clientId: number,
  boardInteraction: BoardInteractionService,
  onResolvePrompt: (promptId: number, result: unknown) => void,
  chooseHandCardsPromptId: number | null,
  replay: boolean | undefined,
  handCardsFingerprint: string,
) {
  useEffect(() => {
    if (chooseHandCardsPromptId == null) {
      return;
    }

    if (replay) {
      boardInteraction.setReplayMode(true);
      return () => {
        boardInteraction.setReplayMode(false);
      };
    }

    boardInteraction.setReplayMode(false);
    const game = localGameRef.current;
    const prompt = activeGamePrompt(game, clientId);
    if (!prompt || prompt.id !== chooseHandCardsPromptId || prompt.type !== 'Choose cards') {
      return;
    }

    const ccp = prompt as ChooseCardsPrompt;
    if (!shouldUseBoardHandForChooseCards(ccp, clientId)) {
      return;
    }

    const pid = ccp.id;
    boardInteraction.startChooseHandCardsSelection(ccp, (indices) => {
      void onResolvePrompt(pid, indices);
    });

    return () => {
      boardInteraction.endBoardSelection();
    };
  }, [chooseHandCardsPromptId, clientId, boardInteraction, onResolvePrompt, replay]);

  // Sandbox (and similar) can change the hand while the same prompt id is active.
  useEffect(() => {
    if (chooseHandCardsPromptId == null || replay || !handCardsFingerprint) {
      return;
    }
    const game = localGameRef.current;
    const prompt = activeGamePrompt(game, clientId);
    if (!prompt || prompt.id !== chooseHandCardsPromptId || prompt.type !== 'Choose cards') {
      return;
    }
    const ccp = prompt as ChooseCardsPrompt;
    if (!shouldUseBoardHandForChooseCards(ccp, clientId)) {
      return;
    }
    boardInteraction.refreshChooseHandCardsPrompt(ccp);
  }, [
    chooseHandCardsPromptId,
    handCardsFingerprint,
    clientId,
    boardInteraction,
    replay,
    localGameRef,
  ]);
}

function useRemoveDamageBoardEffect(
  localGameRef: React.MutableRefObject<LocalGameState>,
  clientId: number,
  boardInteraction: BoardInteractionService,
  removeDamagePromptId: number | null,
  replay: boolean | undefined,
) {
  useEffect(() => {
    if (removeDamagePromptId == null) {
      return;
    }

    if (replay) {
      boardInteraction.setReplayMode(true);
      return () => {
        boardInteraction.setReplayMode(false);
      };
    }

    boardInteraction.setReplayMode(false);
    const game = localGameRef.current;
    const prompt = activeGamePrompt(game, clientId);
    if (!prompt || prompt.id !== removeDamagePromptId || prompt.type !== 'Remove damage') {
      return;
    }

    const rdp = prompt as RemoveDamagePrompt;
    const extra = scanBlockedOwnZeroDamageFromState(
      game.state,
      getPromptPerspectivePlayerId(rdp),
      rdp.playerType,
      rdp.slots,
    );
    boardInteraction.startRemoveDamageSelection(rdp, extra);

    return () => {
      boardInteraction.endBoardSelection();
    };
  }, [removeDamagePromptId, clientId, boardInteraction, replay]);
}

function useMoveDamageBoardEffect(
  localGameRef: React.MutableRefObject<LocalGameState>,
  clientId: number,
  boardInteraction: BoardInteractionService,
  moveDamagePromptId: number | null,
  replay: boolean | undefined,
) {
  useEffect(() => {
    if (moveDamagePromptId == null) {
      return;
    }

    if (replay) {
      boardInteraction.setReplayMode(true);
      return () => {
        boardInteraction.setReplayMode(false);
      };
    }

    boardInteraction.setReplayMode(false);
    const game = localGameRef.current;
    const prompt = activeGamePrompt(game, clientId);
    if (!prompt || prompt.id !== moveDamagePromptId || prompt.type !== 'Move damage') {
      return;
    }

    boardInteraction.startMoveDamageSelection(prompt as MoveDamagePrompt);

    return () => {
      boardInteraction.endBoardSelection();
    };
  }, [moveDamagePromptId, clientId, boardInteraction, replay]);
}

function usePutDamageBoardEffect(
  localGameRef: React.MutableRefObject<LocalGameState>,
  clientId: number,
  boardInteraction: BoardInteractionService,
  putDamagePromptId: number | null,
  replay: boolean | undefined,
) {
  useEffect(() => {
    if (putDamagePromptId == null) {
      return;
    }

    if (replay) {
      boardInteraction.setReplayMode(true);
      return () => {
        boardInteraction.setReplayMode(false);
      };
    }

    boardInteraction.setReplayMode(false);
    const game = localGameRef.current;
    const prompt = activeGamePrompt(game, clientId);
    if (!prompt || prompt.id !== putDamagePromptId || prompt.type !== 'Put damage') {
      return;
    }

    const pdp = prompt as PutDamagePrompt;
    boardInteraction.startPutDamageSelection(pdp, []);

    return () => {
      boardInteraction.endBoardSelection();
    };
  }, [putDamagePromptId, clientId, boardInteraction, replay]);
}

function ChoosePokemonActionBar(props: {
  boardInteraction: BoardInteractionService;
  message: string;
  allowCancel: boolean;
}) {
  const { t } = useTranslation();
  const { boardInteraction, message, allowCancel } = props;
  const onBoard = useBoardEffectSurface(boardInteraction);
  const [, setTick] = useState(0);

  useEffect(() => {
    const sub = merge(
      boardInteraction.selectionMode$,
      boardInteraction.selectedTargets$,
      boardInteraction.maxSelections$,
      boardInteraction.minSelections$,
    ).subscribe(() => setTick((x) => x + 1));
    return () => sub.unsubscribe();
  }, [boardInteraction]);

  const valid = boardInteraction.isSelectionValid();
  const active = boardInteraction.isSelectionActive();

  if (!active) {
    return null;
  }

  if (onBoard) return <TableConfirmAction onCancel={allowCancel ? () => boardInteraction.cancelSelection() : undefined}
    disabled={!valid} onClick={() => boardInteraction.confirmSelection()}>{t('BUTTON_OK')}</TableConfirmAction>;

  return (
    <div className={styles.chooseBar}>
      <div className={styles.chooseBarMessage}>{message}</div>
      <div className={styles.chooseBarActions}>
        <TableConfirmAction onCancel={allowCancel ? () => boardInteraction.cancelSelection() : undefined}
          disabled={!valid} onClick={() => boardInteraction.confirmSelection()}>
          {t('BUTTON_OK')}
        </TableConfirmAction>
      </div>
    </div>
  );
}

/** Board hand Choose cards: full-width instruction bar at top with inline OK. */
function ChooseHandCardsBoardOverlay(props: {
  boardInteraction: BoardInteractionService;
  defaultMessage: string;
  allowCancel: boolean;
}) {
  const { t } = useTranslation();
  const { boardInteraction, defaultMessage, allowCancel } = props;
  const onBoard = useBoardEffectSurface(boardInteraction);
  const [, setTick] = useState(0);

  useEffect(() => {
    const sub = merge(
      boardInteraction.selectionMode$,
      boardInteraction.selectedTargets$,
      boardInteraction.maxSelections$,
      boardInteraction.minSelections$,
    ).subscribe(() => setTick((x) => x + 1));
    return () => sub.unsubscribe();
  }, [boardInteraction]);

  const valid = boardInteraction.isSelectionValid();
  const active = boardInteraction.isSelectionActive();
  const message = setupStartingSnackbarMessage(boardInteraction, t, defaultMessage);

  if (!active) {
    return null;
  }

  if (onBoard && !boardInteraction.isChooseStartingPokemonsSelectionActive()) return <TableConfirmAction
    onCancel={allowCancel ? () => boardInteraction.cancelSelection() : undefined}
    disabled={!valid} onClick={() => boardInteraction.confirmSelection()}>{t('BUTTON_OK')}</TableConfirmAction>;

  return (
    <div className={styles.chooseStartingTopBar} role="status">
      <div className={styles.chooseStartingTopBarContent}>
        <div className={styles.chooseStartingTopBarMessage}>{message}</div>
        <div className={styles.chooseStartingTopBarActions}>
          <TableConfirmAction onCancel={allowCancel ? () => boardInteraction.cancelSelection() : undefined}
            disabled={!valid} onClick={() => boardInteraction.confirmSelection()}>
            {t('BUTTON_OK')}
          </TableConfirmAction>
        </div>
      </div>
    </div>
  );
}

export function TablePromptLayer({
  localGame,
  clientId,
  catalog,
  getScanUrl,
  boardInteraction,
  onResolvePrompt,
  suppressChoosePrizePrompt = false,
}: TablePromptLayerProps) {
  const { t } = useTranslation();
  const localGameRef = useLocalGameRef(localGame);
  const activePrompt = activeGamePrompt(localGame, clientId);
  const [, bumpAfterTrainerDelay] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    const sub = boardInteraction.trainerEffectPromptDelayEnd$.subscribe(() => bumpAfterTrainerDelay());
    return () => sub.unsubscribe();
  }, [boardInteraction]);

  const suppressTrainerEffectPrompts =
    !localGame.replay && boardInteraction.shouldHideTrainerEffectPrompts();

  const choosePokemonId =
    activePrompt?.type === 'Choose pokemon' && !localGame.replay && !suppressTrainerEffectPrompts
      ? activePrompt.id
      : null;

  const chooseHandCardsId =
    activePrompt?.type === 'Choose cards' &&
    !localGame.replay &&
    shouldUseBoardHandForChooseCards(activePrompt as ChooseCardsPrompt, clientId)
      ? activePrompt.id
      : null;

  const chooseHandCardsFingerprint =
    chooseHandCardsId != null && activePrompt?.type === 'Choose cards'
      ? (activePrompt as ChooseCardsPrompt).player.hand.cards.map(c => c.id).join(',')
      : '';

  const removeDamageId =
    activePrompt?.type === 'Remove damage' && !localGame.replay && !suppressTrainerEffectPrompts
      ? activePrompt.id
      : null;

  const moveDamageId =
    activePrompt?.type === 'Move damage' && !localGame.replay && !suppressTrainerEffectPrompts
      ? activePrompt.id
      : null;

  const putDamageId =
    activePrompt?.type === 'Put damage' && !localGame.replay && !suppressTrainerEffectPrompts
      ? activePrompt.id
      : null;

  useChoosePokemonBoardEffect(
    localGameRef,
    clientId,
    boardInteraction,
    onResolvePrompt,
    choosePokemonId,
    !!localGame.replay,
  );

  useChooseHandCardsBoardEffect(
    localGameRef,
    clientId,
    boardInteraction,
    onResolvePrompt,
    chooseHandCardsId,
    !!localGame.replay,
    chooseHandCardsFingerprint,
  );

  useRemoveDamageBoardEffect(
    localGameRef,
    clientId,
    boardInteraction,
    removeDamageId,
    !!localGame.replay,
  );

  useMoveDamageBoardEffect(
    localGameRef,
    clientId,
    boardInteraction,
    moveDamageId,
    !!localGame.replay,
  );

  usePutDamageBoardEffect(
    localGameRef,
    clientId,
    boardInteraction,
    putDamageId,
    !!localGame.replay,
  );

  useEffect(() => {
    if (!localGame.replay) {
      return;
    }
    boardInteraction.setReplayMode(true);
    return () => {
      boardInteraction.setReplayMode(false);
    };
  }, [localGame.replay, boardInteraction]);

  const resolve = useCallback(
    (id: number, result: unknown) => {
      return onResolvePrompt(id, result);
    },
    [onResolvePrompt],
  );

  const autoTakenChoosePrizeIdRef = useRef<number | null>(null);

  useEffect(() => {
    autoTakenChoosePrizeIdRef.current = null;
  }, [localGame.localId]);

  useEffect(() => {
    if (localGame.replay || suppressChoosePrizePrompt) {
      return;
    }
    const p = activePrompt;
    if (!p || p.type !== 'Choose prize' || p.playerId !== clientId) {
      return;
    }
    const cpp = p as ChoosePrizePrompt;
    if (!shouldAutoTakeChoosePrize(localGame, cpp)) {
      return;
    }
    if (autoTakenChoosePrizeIdRef.current === p.id) {
      return;
    }
    autoTakenChoosePrizeIdRef.current = p.id;
    resolve(p.id, autoTakeChoosePrizeIndices(localGame, cpp));
  }, [
    activePrompt,
    clientId,
    localGame,
    localGame.replay,
    resolve,
    suppressChoosePrizePrompt,
  ]);

  const selfPlayGoFirstDeckId = useMemo(() => {
    if (localGame.state.gameSettings?.selfPlay !== true) {
      return undefined;
    }
    const p = activePrompt;
    if (!p || p.type !== 'Confirm') {
      return undefined;
    }
    const cp = p as ConfirmPrompt;
    if (String(cp.message) !== 'GO_FIRST') {
      return undefined;
    }
    return localGame.state.players.find((pl) => pl.id === cp.playerId)?.deckId;
  }, [activePrompt, localGame.state.gameSettings?.selfPlay, localGame.state.players]);

  const selfPlayGoFirstDeckName = useDeckName(selfPlayGoFirstDeckId);

  if (localGame.replay) {
    return null;
  }

  if (!activePrompt) {
    return null;
  }

  if (suppressTrainerEffectPrompts) {
    // Silent / animation WaitPrompts must still resolve — otherwise hand→deck / shuffle
    // gates sit until the trainer play delay ends (~2.5s) after the motion already finished.
    if (activePrompt.type === 'WaitPrompt') {
      const wp = activePrompt as WaitPrompt;
      const isAnimationGate =
        wp.showVisual === false ||
        isHandToDeckAnimationWaitPrompt(wp) ||
        isDeckShuffleAnimationWaitPrompt(wp) ||
        isDrawAnimationWaitPrompt(wp);
      if (!isAnimationGate) {
        return null;
      }
      // Fall through to WaitPrompt rendering below.
    } else if (
      activePrompt.type === 'Choose cards' &&
      shouldUseBoardHandForChooseCards(activePrompt as ChooseCardsPrompt, clientId)
    ) {
      const ccp = activePrompt as ChooseCardsPrompt;
      const msg = gameMessageText(t, ccp.message);
      return (
        <ChooseHandCardsBoardOverlay
          boardInteraction={boardInteraction}
          defaultMessage={msg}
          allowCancel={ccp.options.allowCancel}
        />
      );
    } else {
      return null;
    }
  }

  const p = activePrompt;
  // The responsive board owns the private, spatial opening layout and its confirm bar.
  if (p.type === 'Choose starting pokemon') return null;

  if (suppressChoosePrizePrompt && p.type === 'Choose prize') {
    return null;
  }

  if (
    p.type === 'Choose prize' &&
    p.playerId === clientId &&
    shouldAutoTakeChoosePrize(localGame, p as ChoosePrizePrompt)
  ) {
    return null;
  }

  if (p.type === 'Choose pokemon') {
    const cp = p as ChoosePokemonPrompt;
    const msg = gameMessageText(t, cp.message);
    return (
      <ChoosePokemonActionBar
        boardInteraction={boardInteraction}
        message={msg}
        allowCancel={cp.options.allowCancel}
      />
    );
  }

  if (p.type === 'Confirm') {
    const cp = p as ConfirmPrompt;
    const isGoFirst = String(cp.message) === GameMessage.GO_FIRST;
    const isSelfPlayGoFirst = localGame.state.gameSettings?.selfPlay === true && isGoFirst;
    const confirmTitleBase = isGoFirst ? '选择先后手' : t('PROMPT_CONFIRM_TITLE', { defaultValue: 'Confirm' });
    const confirmTitle =
      isSelfPlayGoFirst && selfPlayGoFirstDeckName != null && selfPlayGoFirstDeckName !== ''
        ? `${confirmTitleBase} [${selfPlayGoFirstDeckName}]`
        : confirmTitleBase;
    return (
      <div key={cp.id} className={styles.backdrop} role="presentation">
        <div className={styles.panel} role="dialog" aria-modal="true">
          <h2 className={styles.title}>{confirmTitle}</h2>
          <p className={styles.message}>{isGoFirst ? '你获得了先后手选择权。选择先手，或把先手交给对方。' : gameMessageText(t, cp.message)}</p>
          <div className={styles.actions}>
            <TableConfirmAction onCancel={() => resolve(cp.id, false)} onClick={() => resolve(cp.id, true)}
              cancelLabel={isGoFirst ? '选择后手' : undefined} cancelIcon={isGoFirst ? 'arrow' : undefined}>
              {isGoFirst ? '选择先手' : t('BUTTON_OK')}
            </TableConfirmAction>
          </div>
        </div>
      </div>
    );
  }

  if (p.type === 'Alert') {
    const ap = p as AlertPrompt;
    return (
      <div key={ap.id} className={styles.backdrop} role="presentation">
        <div className={styles.panel} role="dialog" aria-modal="true">
          <h2 className={styles.title}>{t('ALERT_MESSAGE_TITLE', { defaultValue: 'Message' })}</h2>
          <p className={styles.message}>{gameMessageText(t, ap.message)}</p>
          <div className={styles.actions}>
            <TableConfirmAction onClick={() => resolve(ap.id, true)}>
              {t('BUTTON_OK')}
            </TableConfirmAction>
          </div>
        </div>
      </div>
    );
  }

  if (p.type === 'Select') {
    const sp = p as SelectPrompt;
    return (
      <SelectPromptPanel key={sp.id} prompt={sp} t={t} gameMessageText={gameMessageText} resolve={resolve} />
    );
  }

  if (p.type === 'WaitPrompt') {
    const wp = p as WaitPrompt;
    if (isHandToDeckAnimationWaitPrompt(wp)) {
      return (
        <HandToDeckAnimationWaitPrompt
          key={wp.id}
          promptId={wp.id}
          durationMs={wp.duration}
          boardInteraction={boardInteraction}
          resolve={resolve}
        />
      );
    }
    if (isDeckShuffleAnimationWaitPrompt(wp)) {
      return (
        <DeckShuffleAnimationWaitPrompt
          key={wp.id}
          promptId={wp.id}
          durationMs={wp.duration}
          boardInteraction={boardInteraction}
          resolve={resolve}
        />
      );
    }
    if (isDrawAnimationWaitPrompt(wp)) {
      return (
        <DrawAnimationWaitPrompt
          key={wp.id}
          promptId={wp.id}
          durationMs={wp.duration}
          boardInteraction={boardInteraction}
          resolve={resolve}
        />
      );
    }
    if (wp.showVisual === false) {
      return (
        <SilentWaitPrompt
          key={wp.id}
          promptId={wp.id}
          durationMs={wp.duration > 0 ? wp.duration : 0}
          resolve={resolve}
        />
      );
    }
    // Server used to block attacks on this prompt; 3D board plays motion from the socket event instead.
    if (isAttackAnimationWaitPrompt(wp)) {
      return (
        <AttackAnimationWaitPrompt
          key={wp.id}
          promptId={wp.id}
          boardInteraction={boardInteraction}
          resolve={resolve}
        />
      );
    }
    if (isAbilityAnimationWaitPrompt(wp)) {
      return (
        <AbilityAnimationWaitPrompt
          key={wp.id}
          promptId={wp.id}
          boardInteraction={boardInteraction}
          resolve={resolve}
        />
      );
    }
    if (isCoinFlipAnimationWaitPrompt(wp)) {
      return (
        <CoinFlipAnimationWaitPrompt
          key={wp.id}
          promptId={wp.id}
          durationMs={wp.duration > 0 ? wp.duration : COIN_FLIP_SERVER_WAIT_MS}
          resolve={resolve}
        />
      );
    }
    return (
      <WaitPromptPanel key={wp.id} prompt={wp} t={t} gameMessageText={gameMessageText} resolve={resolve} />
    );
  }

  if (p.type === 'Show cards') {
    const sc = p as ShowCardsPrompt;
    return (
      <ShowCardsPanel
        key={sc.id}
        prompt={sc}
        players={localGame.state.players}
        catalog={catalog}
        getScanUrl={getScanUrl}
        t={t}
        gameMessageText={gameMessageText}
        resolve={resolve}
        confirmResult={null}
      />
    );
  }

  if (p.type === 'Confirm cards') {
    const cc = p as ConfirmCardsPrompt;
    return (
      <ShowCardsPanel
        key={cc.id}
        prompt={cc}
        players={localGame.state.players}
        catalog={catalog}
        getScanUrl={getScanUrl}
        t={t}
        gameMessageText={gameMessageText}
        resolve={resolve}
        confirmResult={true}
        allowCancel={cc.options.allowCancel}
      />
    );
  }

  if (p.type === 'Show mulligan') {
    const sm = p as ShowMulliganPrompt;
    return (
      <ShowMulliganPanel
        key={sm.id}
        prompt={sm}
        players={localGame.state.players}
        catalog={catalog}
        getScanUrl={getScanUrl}
        t={t}
        gameMessageText={gameMessageText}
        resolve={resolve}
      />
    );
  }

  if (p.type === 'Choose cards') {
    const ccp = p as ChooseCardsPrompt;
    if (shouldUseBoardHandForChooseCards(ccp, clientId) && !localGame.replay) {
      const msg = gameMessageText(t, ccp.message);
      return (
        <ChooseHandCardsBoardOverlay
          boardInteraction={boardInteraction}
          defaultMessage={msg}
          allowCancel={ccp.options.allowCancel}
        />
      );
    }
    return (
      <ChooseCardsPanel
        key={`${ccp.id}:${ccp.cards.cards.map(card => card.id).join(',')}`}
        prompt={ccp}
        players={localGame.state.players}
        catalog={catalog}
        getScanUrl={getScanUrl}
        t={t}
        gameMessageText={gameMessageText}
        resolve={resolve}
        replay={!!localGame.replay}
      />
    );
  }

  if (p.type === 'Choose prize') {
    const cpp = p as ChoosePrizePrompt;
    return (
      <ChoosePrizePanel
        key={cpp.id}
        prompt={cpp}
        localGame={localGame}
        catalog={catalog}
        getScanUrl={getScanUrl}
        t={t}
        gameMessageText={gameMessageText}
        resolve={resolve}
        replay={!!localGame.replay}
      />
    );
  }

  if (p.type === 'Remove damage') {
    const rdp = p as RemoveDamagePrompt;
    return (
      <RemoveDamageOverlay
        key={rdp.id}
        prompt={rdp}
        localGame={localGame}
        boardInteraction={boardInteraction}
        gameMessageText={gameMessageText}
        resolve={resolve}
      />
    );
  }

  if (p.type === 'Move damage') {
    const mdp = p as MoveDamagePrompt;
    return (
      <MoveDamageOverlay
        key={mdp.id}
        prompt={mdp}
        localGame={localGame}
        boardInteraction={boardInteraction}
        gameMessageText={gameMessageText}
        resolve={resolve}
      />
    );
  }

  if (p.type === 'Put damage') {
    const pdp = p as PutDamagePrompt;
    return (
      <PutDamageOverlay
        key={pdp.id}
        prompt={pdp}
        localGame={localGame}
        boardInteraction={boardInteraction}
        gameMessageText={gameMessageText}
        resolve={resolve}
      />
    );
  }

  if (p.type === 'Attach energy') {
    const aep = p as AttachEnergyPrompt;
    return (
      <AttachEnergyPromptPanel
        key={`${localGame.localId}:${aep.id}`}
        prompt={aep}
        localGame={localGame}
        boardInteraction={boardInteraction}
        clientId={clientId}
        getScanUrl={getScanUrl}
        t={t}
        gameMessageText={gameMessageText}
        resolve={resolve}
      />
    );
  }

  if (p.type === 'Choose energy') {
    const cep = p as ChooseEnergyPrompt;
    return (
      <ChooseEnergyPromptPanel
        key={`${localGame.localId}:${cep.id}`}
        prompt={cep}
        localGame={localGame}
        boardInteraction={boardInteraction}
        clientId={clientId}
        catalog={catalog}
        getScanUrl={getScanUrl}
        t={t}
        gameMessageText={gameMessageText}
        resolve={resolve}
      />
    );
  }

  if (p.type === 'Move energy') {
    const mep = p as MoveEnergyPrompt;
    return (
      <MoveEnergyPromptPanel
        key={`${localGame.localId}:${mep.id}`}
        prompt={mep}
        localGame={localGame}
        boardInteraction={boardInteraction}
        clientId={clientId}
        getScanUrl={getScanUrl}
        t={t}
        gameMessageText={gameMessageText}
        resolve={resolve}
      />
    );
  }

  if (p.type === 'Discard energy') {
    const dep = p as DiscardEnergyPrompt;
    return (
      <DiscardEnergyPromptPanel
        key={`${localGame.localId}:${dep.id}`}
        prompt={dep}
        localGame={localGame}
        boardInteraction={boardInteraction}
        clientId={clientId}
        getScanUrl={getScanUrl}
        t={t}
        gameMessageText={gameMessageText}
        resolve={resolve}
      />
    );
  }

  if (p.type === 'Choose attack') {
    const cap = p as ChooseAttackPrompt;
    return (
      <ChooseAttackPromptPanel
        key={cap.id}
        prompt={cap}
        localGame={localGame}
        catalog={catalog}
        getScanUrl={getScanUrl}
        t={t}
        gameMessageText={gameMessageText}
        resolve={resolve}
      />
    );
  }

  if (p.type === 'Order cards') {
    const ocp = p as OrderCardsPrompt;
    return (
      <OrderCardsPromptPanel
        key={ocp.id}
        prompt={ocp}
        getScanUrl={getScanUrl}
        t={t}
        gameMessageText={gameMessageText}
        resolve={resolve}
      />
    );
  }

  if (p.type === 'SelectOption') {
    const sop = p as SelectOptionPrompt;
    return (
      <SelectOptionPromptPanel
        key={sop.id}
        prompt={sop}
        t={t}
        gameMessageText={gameMessageText}
        resolve={resolve}
      />
    );
  }

  if (p.type === 'Invite player') {
    const ipp = p as InvitePlayerPrompt;
    return (
      <InvitePlayerPromptPanel
        key={ipp.id}
        prompt={ipp}
        localGame={localGame}
        t={t}
        gameMessageText={gameMessageText}
        resolve={resolve}
      />
    );
  }

  return (
    <div key={p.id} className={styles.backdrop} role="presentation">
      <div className={styles.panel} role="dialog" aria-modal="true">
        <h2 className={styles.title}>
          {t('PROMPT_UNKNOWN_TYPE', {
            type: p.type,
            defaultValue: "Unknown prompt type: '{{type}}'.",
          })}
        </h2>
        <p className={styles.message}>
          {t(
            'REACT_PROMPT_NOT_IMPLEMENTED',
            'This prompt is not supported yet in the React client. You may need the Angular app for this action.',
          )}
        </p>
      </div>
    </div>
  );
}

function ChoosePrizePanel(props: {
  prompt: ChoosePrizePrompt;
  localGame: LocalGameState;
  catalog: Card[];
  getScanUrl: (card: Card) => string;
  t: TFunction;
  gameMessageText: (t: TFunction, message: string | number) => string;
  resolve: (id: number, result: unknown) => void | Promise<void>;
  replay: boolean;
}) {
  const { prompt, localGame, catalog, getScanUrl, t, gameMessageText, resolve, replay } = props;
  const { count, allowCancel } = prompt.options;
  const blockedPrizeIndices = new Set(prompt.options.blocked ?? []);

  const { targetPlayer, prizeIndexByGrid } = useMemo(() => {
    const state = localGame.state;
    const perspectiveId = getPromptPerspectivePlayerId(prompt);
    const promptPlayer = state.players.find((p) => p.id === perspectiveId);
    const target = prompt.options.useOpponentPrizes
      ? state.players.find((p) => p.id !== perspectiveId)
      : promptPlayer;
    if (!target) {
      return { targetPlayer: null as null | (typeof promptPlayer), prizeIndexByGrid: [] as (number | undefined)[] };
    }
    const ne = target.prizes.filter((p) => p.cards.length > 0);
    const map: (number | undefined)[] = [];
    for (let gridIdx = 0; gridIdx < 6; gridIdx++) {
      const pile = target.prizes[gridIdx];
      if (!pile || pile.cards.length === 0) {
        map[gridIdx] = undefined;
      } else {
        const idx = ne.indexOf(pile);
        map[gridIdx] = idx >= 0 ? idx : undefined;
      }
    }
    return { targetPlayer: target, prizeIndexByGrid: map };
  }, [localGame.state, prompt.playerId, prompt.options.useOpponentPrizes, prompt.id]);

  const [selected, setSelected] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [detail, setDetail] = useState<{ card: Card; facedown: boolean } | null>(null);

  useEffect(() => {
    setSelected([]);
    setRevealed(false);
    setDetail(null);
  }, [prompt.id]);

  const hasSecret = useMemo(() => {
    if (!targetPlayer) return false;
    return targetPlayer.prizes.some(
      (pile) =>
        pile.cards.length > 0 && (prompt.options.isSecret || pile.isSecret),
    );
  }, [targetPlayer, prompt.options.isSecret]);

  const onSlotClick = (gridIndex: number, e: MouseEvent<HTMLButtonElement>) => {
    const neIdx = prizeIndexByGrid[gridIndex];
    if (neIdx === undefined || blockedPrizeIndices.has(neIdx)) {
      return;
    }
    const pile = targetPlayer!.prizes[gridIndex];
    const card = pile.cards[0];
    if (e.shiftKey && card) {
      const secretPile = !!(prompt.options.isSecret || pile.isSecret);
      setDetail({ card, facedown: secretPile && (!replay || !revealed) });
      return;
    }
    const isSelected = selected.includes(neIdx);
    if (count === 1) {
      if (isSelected) {
        setSelected([]);
      } else {
        playSfx('prizecardselected');
        setSelected([neIdx]);
      }
    } else if (isSelected) {
      setSelected((prev) => prev.filter((x) => x !== neIdx));
    } else if (selected.length < count) {
      playSfx('prizecardselected');
      setSelected((prev) => [...prev, neIdx]);
    }
  };

  const canConfirm =
    selected.length === count && new Set(selected).size === selected.length &&
    selected.every(index => !blockedPrizeIndices.has(index) && prizeIndexByGrid.includes(index));

  const title = t('PROMPT_CHOOSE_PRIZE_TITLE', { defaultValue: 'Choose prize' });

  if (!targetPlayer) {
    return (
      <div className={styles.backdrop} role="presentation">
        <div className={styles.panel} role="dialog" aria-modal="true">
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.message}>
            {t('REACT_CHOOSE_PRIZE_NO_PLAYER', { defaultValue: 'Could not resolve prize cards for this prompt.' })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.prizeFullscreenRoot} role="presentation">
        <div className={styles.prizeFullscreenOverlay} aria-hidden />
        <div
          className={styles.prizeFullscreenContainer}
          role="dialog"
          aria-modal="true"
          aria-labelledby="choose-prize-title"
        >
          <div className={styles.prizePromptTitle}>
            <h2 id="choose-prize-title">{title}</h2>
            <div className={styles.prizeTitleSpacer} aria-hidden />
          </div>

          <div className={styles.prizePromptMessage}>
            <p>{gameMessageText(t, prompt.message)}</p>
          </div>

          <div className={styles.prizePromptContent}>
            <div className={styles.prizePrizes}>
              <div
                className={styles.prizePrizesGrid}
                data-revealed={revealed ? 'true' : 'false'}
              >
                {prizeIndexByGrid.map((neIdx, gridIdx) => {
                  const pile = targetPlayer.prizes[gridIdx];
                  const empty = !pile || pile.cards.length === 0;
                  const card = pile?.cards[0];
                  const blockedSlot = neIdx !== undefined && blockedPrizeIndices.has(neIdx);
                  const selectedSlot = neIdx !== undefined && !blockedSlot && selected.includes(neIdx);
                  const secret = !!(pile && (prompt.options.isSecret || pile.isSecret));
                  const useBack = secret && (!replay || !revealed);
                  const src =
                    empty || !card ? '' : useBack ? CHOOSE_CARDS_CARD_BACK : getScanUrl(card);
                  const label = PRIZE_SLOT_LABELS[gridIdx] ?? gridIdx + 1;
                  return (
                    <button
                      key={`prize-${gridIdx}-${prompt.id}`}
                      type="button"
                      aria-label={t('REACT_PRIZE_SLOT', { defaultValue: '奖赏卡 {{n}}', n: label })}
                      disabled={empty || blockedSlot}
                      className={`${styles.prizePrizeSlot} ${empty ? styles.prizePrizeSlotEmpty : ''} ${selectedSlot ? styles.prizePrizeSlotSelected : ''}`}
                      onClick={(e) => onSlotClick(gridIdx, e)}
                      title={
                        blockedSlot
                          ? t('REACT_CHOOSE_PRIZE_BLOCKED', { defaultValue: '这张奖赏卡当前不可选择。' })
                          : card
                          ? t('REACT_CHOOSE_CARDS_CARD_HINT', {
                              defaultValue: '{{name}} — Shift+click for card info',
                              name: card.name,
                            })
                          : undefined
                      }
                    >
                      <span className={styles.prizePrizeNumber}>{label}</span>
                      {empty ? (
                        <div className={styles.prizeEmptySlot} />
                      ) : (
                        <CardFace
                          card={useBack ? null : card ?? null}
                          src={src}
                          name={card?.name ?? ''}
                          style={{ width: 90, height: 125 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className={styles.prizePromptActions}>
            {replay && hasSecret ? (
              <section className={styles.prizeRevealSection}>
                <CheckboxField
                  id={`choose-prize-reveal-${prompt.id}`}
                  checked={revealed}
                  onChange={() => setRevealed((r) => !r)}
                >
                  {t('CARDS_REVEAL_CARDS', { defaultValue: 'Reveal cards' })}
                </CheckboxField>
              </section>
            ) : null}
            <TableConfirmAction onCancel={allowCancel ? () => resolve(prompt.id, null) : undefined}
              disabled={!canConfirm} onClick={() => {
                if (canConfirm) {
                  return resolve(prompt.id, selected);
                }
              }}>
              {t('BUTTON_OK')}
            </TableConfirmAction>
          </div>
        </div>
      </div>
      {detail ? (
        <CardInfoPopup
          card={detail.card}
          facedown={detail.facedown}
          players={localGame.state.players}
          catalog={catalog}
          getScanUrl={getScanUrl}
          onClose={() => setDetail(null)}
          isInGame
        />
      ) : null}
    </>
  );
}

function ChooseCardsPanel(props: {
  prompt: ChooseCardsPrompt;
  players: LocalGameState['state']['players'];
  catalog: Card[];
  getScanUrl: (card: Card) => string;
  t: TFunction;
  gameMessageText: (t: TFunction, message: string | number) => string;
  resolve: (id: number, result: unknown) => void | Promise<void>;
  replay: boolean;
}) {
  const { prompt, players, catalog, getScanUrl, t, gameMessageText, resolve, replay } = props;
  const cards = prompt.cards.cards;
  const blocked = prompt.options.blocked ?? [];
  const { min, max, allowCancel, isSecret } = prompt.options;
  const fromHand = !isSecret && isChooseCardsFromPlayerHand(prompt);
  const discarding = fromHand && prompt.message === GameMessage.CHOOSE_CARD_TO_DISCARD;
  const amount = min === max ? `${max} 张` : min === 0 ? `至多 ${max} 张` : `${min}～${max} 张`;
  const title = discarding ? `选择要弃掉的 ${amount}手牌` : fromHand ? '选择手牌' : t('PROMPT_CHOOSE_CARDS_TITLE', { defaultValue: '选择卡牌' });
  const dialogLabel = discarding ? '选择弃牌' : fromHand ? '选择手牌' : '检索卡牌';
  const filterMap = useMemo(() => buildChooseCardsFilterMap(cards, prompt.filter, blocked), [cards, prompt.filter, blocked]);
  const items = useMemo(() => cards.map((card, index) => ({ card, index, isAvailable: filterMap[index] ?? false })), [cards, filterMap]);
  const [tab, setTab] = useState<'valid' | 'all'>('valid');
  const [query, setQuery] = useState('');
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [detail, setDetail] = useState<{ card: Card; index: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setTab('valid'); setQuery(''); setSelectedIndices([]); setRevealed(false); setDetail(null); }, [prompt.id]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>('[data-choice-index]:not(:disabled)')?.focus({ preventScroll: true });
    return () => { if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, [prompt.id]);
  useEffect(() => {
    if (detail) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && allowCancel && !event.isComposing) {
        event.preventDefault();
        panelRef.current?.querySelector<HTMLButtonElement>('[data-table-action="cancel"]')?.click();
        return;
      }
      if (event.key !== 'Tab') return;
      const panel = panelRef.current;
      const elements = [...(panel?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]') ?? [])].filter(el => el.getClientRects().length > 0);
      const first = elements[0], last = elements.at(-1);
      if (!first) { event.preventDefault(); panel?.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || !panel?.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !panel?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [detail, allowCancel, prompt.id, resolve]);

  const useCardBack = isSecret && (!replay || !revealed);
  const needle = query.trim().toLocaleLowerCase();
  const visibleItems = items.filter(item => (tab === 'all' || item.isAvailable) &&
    (useCardBack || !needle || cardSearchFields(item.card).join(' ').toLocaleLowerCase().includes(needle)));
  const toggleIndex = (index: number, available: boolean) => {
    if (!available) return;
    setSelectedIndices(previous => previous.includes(index) ? previous.filter(i => i !== index) : previous.length < max ? [...previous, index] : previous);
  };
  const canConfirm = selectedIndices.every(index => filterMap[index]) && prompt.validate(selectedIndices.map(index => cards[index]));
  const progress = max > 0 ? Math.min(100, selectedIndices.length / max * 100) : 100;
  const detailSelected = detail !== null && selectedIndices.includes(detail.index);
  const detailAvailable = detail !== null && !!filterMap[detail.index];
  const detailCanSelect = detailAvailable && (detailSelected || selectedIndices.length < max);
  const detailSelectionLabel = !detailAvailable ? '这张卡不可选' : detailSelected ? '移除这张' : selectedIndices.length >= max ? `已选满 ${max} 张` : '选择这张';

  return <div className={styles.backdrop} role="presentation">
    <div ref={panelRef} className={`${styles.panel} ${styles.catalogPanel}`} role="dialog" aria-modal="true" aria-label={dialogLabel} tabIndex={-1}>
      <header className={styles.catalogHeader}>
        <svg className={styles.catalogEmblem} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="4" y="3" width="16" height="23" rx="3" /><circle cx="20" cy="20" r="7" /><path d="m25 25 5 5M8 8h8" /></svg>
        <div><h2 className={styles.title}>{title}</h2><p className={styles.message}>{gameMessageText(t, prompt.message)}</p></div>
        <div className={styles.selectionMeter} data-valid={canConfirm || undefined} role="status" aria-label={`已选 ${selectedIndices.length} 张，允许 ${min} 至 ${max} 张`}>
          <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" /><circle className={styles.meterFill} cx="24" cy="24" r="21" pathLength="100" strokeDasharray={`${progress} 100`} /></svg>
          <span>{selectedIndices.length}<small>/{max}</small></span>
        </div>
      </header>
      {replay && isSecret ? <CheckboxField id={`choose-cards-reveal-${prompt.id}`} checked={revealed} onChange={() => setRevealed(value => !value)}>{t('REACT_REVEAL_SECRET_CARDS')}</CheckboxField> : null}
      <div className={styles.catalogTools}>
        <label className={styles.catalogSearch}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" /></svg>
          <input aria-label={fromHand ? '筛选手牌' : '筛选检索卡牌'} placeholder={useCardBack ? '' : '找卡牌…'} value={query} disabled={useCardBack} onChange={event => setQuery(event.target.value)} />
        </label>
        <div className={styles.chooseTabs} role="tablist" aria-label="卡牌筛选">
          <button type="button" role="tab" aria-label="只看可选卡牌" aria-selected={tab === 'valid'} className={`${styles.chooseTab} ${tab === 'valid' ? styles.chooseTabActive : ''}`} onClick={() => setTab('valid')} title="只看可选卡牌">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m5 12 4 4 10-10" /></svg>{items.filter(item => item.isAvailable).length}
          </button>
          <button type="button" role="tab" aria-label="查看全部卡牌" aria-selected={tab === 'all'} className={`${styles.chooseTab} ${tab === 'all' ? styles.chooseTabActive : ''}`} onClick={() => setTab('all')} title="查看全部卡牌">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="7" y="3" width="12" height="17" rx="2" /><path d="M4 6v15h11" /></svg>{items.length}
          </button>
        </div>
      </div>
      <p className={styles.catalogHint}>点击卡面放大查看，使用下方按钮选牌。</p>
      <div className={styles.chooseCardsGrid} data-catalog-gallery>
        {visibleItems.map(({ card, index, isAvailable }) => {
          const selected = selectedIndices.includes(index);
          const name = useCardBack ? '背面卡牌' : cardDisplayName(card);
          const atLimit = !selected && selectedIndices.length >= max;
          return <div key={`${index}-${card.id}`} className={styles.chooseCardItem}>
            <button type="button" className={`${styles.chooseCardBtn} ${styles.cardPreview} ${selected ? styles.chooseCardBtnSelected : ''}`}
              data-card-preview-index={index} aria-label={`放大查看 ${name}`} aria-haspopup="dialog"
              onClick={() => setDetail({ card, index })}>
              <CardFace className={styles.choiceFace} card={useCardBack ? null : card} src={useCardBack ? CHOOSE_CARDS_CARD_BACK : getScanUrl(card)} name={name} />
              <span className={styles.chooseCardName}>{name}</span>
              <span className={styles.cardPreviewHint} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" /></svg>放大</span>
              {selected ? <span className={styles.selectionSeal} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 12 4 4 10-10" /></svg></span> : null}
            </button>
            <button type="button" className={styles.chooseCardToggle} data-choice-index={index}
              aria-label={`${selected ? '移除选择' : '选择'} ${name}`} aria-pressed={selected} disabled={!isAvailable || atLimit}
              onClick={() => toggleIndex(index, isAvailable)}>
              {selected ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m5 12 4 4 10-10" /></svg> : null}
              {!isAvailable ? '不可选择' : selected ? '已选择' : atLimit ? '已选满' : '选择这张'}
            </button>
          </div>;
        })}
        {visibleItems.length === 0 ? <div className={styles.catalogEmpty} role="status">没有匹配的卡牌</div> : null}
      </div>
      <div className={styles.selectionDock} aria-label="已选卡牌">
        {selectedIndices.length > 0 ? <span className={styles.selectedSummary}>已选</span> : null}
        {selectedIndices.map(index => <button type="button" key={index} className={styles.selectedCardChip} aria-label={`移除已选卡牌 ${useCardBack ? '背面卡牌' : cardDisplayName(cards[index])}`} onClick={() => toggleIndex(index, true)}>
          <span>{useCardBack ? '背面卡牌' : cardDisplayName(cards[index])}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>)}
      </div>
      <TableConfirmAction onCancel={allowCancel ? () => resolve(prompt.id, null) : undefined}
        cancelLabel={fromHand ? '取消选择' : '取消检索'}
        disabled={!canConfirm} onClick={() => canConfirm ? resolve(prompt.id, selectedIndices) : undefined}>
        {discarding ? '确认弃牌' : '确认选择'}
      </TableConfirmAction>
    </div>
    {detail ? <CardInfoPopup card={detail.card} facedown={useCardBack} players={players} catalog={catalog} getScanUrl={getScanUrl}
      onClose={() => setDetail(null)} isInGame closeLabel="返回列表"
      selectionAction={{ label: detailSelectionLabel, disabled: !detailCanSelect, onClick: () => {
        if (!detailCanSelect) return;
        toggleIndex(detail.index, detailAvailable);
        setDetail(null);
      } }} /> : null}
  </div>;
}

function SelectPromptPanel(props: {
  prompt: SelectPrompt;
  t: TFunction;
  gameMessageText: (t: TFunction, message: string | number) => string;
  resolve: (id: number, result: unknown) => void | Promise<void>;
}) {
  const { prompt: sp, t, gameMessageText, resolve } = props;
  const [idx, setIdx] = useState(sp.options.defaultValue ?? 0);

  useEffect(() => {
    setIdx(sp.options.defaultValue ?? 0);
  }, [sp.id, sp.options.defaultValue]);

  return (
    <div className={styles.backdrop} role="presentation">
      <div className={styles.panel} role="dialog" aria-modal="true">
        <h2 className={styles.title}>{t('PROMPT_SELECT_TITLE', { defaultValue: 'Choose' })}</h2>
        <p className={styles.message}>{gameMessageText(t, sp.message)}</p>
        <div className={styles.selectList}>
          {sp.values.map((value, i) => (
            <label key={`${sp.id}-${i}`} className={styles.selectOption}>
              <input type="radio" name={`select-${sp.id}`} checked={idx === i} onChange={() => setIdx(i)} />
              <span>{String(localizeGameValue(t(value, { defaultValue: value })))}</span>
            </label>
          ))}
        </div>
        <div className={styles.actions}>
          <TableConfirmAction onCancel={sp.options.allowCancel ? () => resolve(sp.id, null) : undefined}
            onClick={() => resolve(sp.id, idx)}>
            {t('BUTTON_OK')}
          </TableConfirmAction>
        </div>
      </div>
    </div>
  );
}

function WaitPromptPanel(props: {
  prompt: WaitPrompt;
  t: TFunction;
  gameMessageText: (t: TFunction, message: string | number) => string;
  resolve: (id: number, result: unknown) => void | Promise<void>;
}) {
  const { prompt: wp, t, gameMessageText, resolve } = props;

  useEffect(() => {
    if (!wp.duration || wp.duration <= 0) {
      return;
    }
    const tmr = window.setTimeout(() => resolve(wp.id, null), wp.duration);
    return () => clearTimeout(tmr);
  }, [wp.id, wp.duration, resolve]);

  const msg = wp.message ? gameMessageText(t, wp.message) : t('REACT_PLEASE_WAIT', { defaultValue: 'Please wait…' });

  return (
    <div className={styles.backdrop} role="presentation">
      <div className={styles.panel} role="dialog" aria-modal="true">
        <h2 className={styles.title}>{t('REACT_WAIT', { defaultValue: 'Wait' })}</h2>
        <p className={styles.message}>{msg}</p>
        {!wp.duration ? (
          <div className={styles.actions}>
            <TableConfirmAction onClick={() => resolve(wp.id, null)}>
              {t('BUTTON_OK')}
            </TableConfirmAction>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ShowCardsPanel(props: {
  prompt: ShowCardsPrompt | ConfirmCardsPrompt;
  players: LocalGameState['state']['players'];
  catalog: Card[];
  getScanUrl: (card: Card) => string;
  t: TFunction;
  gameMessageText: (t: TFunction, message: string | number) => string;
  resolve: (id: number, result: unknown) => void | Promise<void>;
  confirmResult: true | null;
  allowCancel?: boolean;
}) {
  const { prompt, players, catalog, getScanUrl, t, gameMessageText, resolve, confirmResult, allowCancel } = props;
  const [detail, setDetail] = useState<Card | null>(null);

  useEffect(() => {
    if (confirmResult !== null) {
      return;
    }
    const tmr = window.setTimeout(() => resolve(prompt.id, null), 5000);
    return () => clearTimeout(tmr);
  }, [prompt.id, confirmResult, resolve]);

  const prizeAction = confirmResult === true ? (prompt as ConfirmCardsPrompt).options.prizeAction : undefined;
  const prizeCard = prizeAction && prompt.cards.length === 1 ? prompt.cards[0] : undefined;
  const title = prizeCard
    ? t('REACT_PRIZE_CARD_DRAWN', { defaultValue: '你抽到了 {{name}}', name: cardDisplayName(prizeCard) })
    : confirmResult === true
      ? t('PROMPT_CONFIRM_CARDS_TITLE', { defaultValue: 'Confirm cards' })
      : t('CARDS_LIST_OF_CARDS', { defaultValue: 'Cards' });
  const message = prizeCard
    ? prizeAction === 'attach'
      ? t('REACT_PRIZE_ENERGY_CHOICE', { defaultValue: '你可以将它附着于自己的 1 只宝可梦，或将它加入手牌。' })
      : t('REACT_PRIZE_EFFECT_CHOICE', { defaultValue: '你可以使用这张卡的奖赏效果，或将它加入手牌。' })
    : gameMessageText(t, prompt.message);
  const confirmLabel = prizeCard
    ? prizeAction === 'attach'
      ? t('REACT_PRIZE_ATTACH_ENERGY', { defaultValue: '附着能量' })
      : prizeAction === 'ability'
        ? t('REACT_PRIZE_USE_ABILITY', { defaultValue: '使用特性' })
        : t('REACT_PRIZE_USE_EFFECT', { defaultValue: '使用效果' })
    : t('BUTTON_OK');

  return (
    <div className={styles.backdrop} role="presentation">
      <div className={`${styles.panel} ${prizeCard ? '' : styles.panelWide}`} role="dialog" aria-modal="true" aria-label={prizeCard ? title : undefined}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.message}>{message}</p>
        <div className={styles.cardRow}>
          {prompt.cards.map((card: Card, cardIndex) => (
            <button
              key={`${cardIndex}-${card.id}-${card.fullName}`}
              type="button"
              aria-label={prizeCard ? `查看${cardDisplayName(card)}详情` : undefined}
              style={{ padding: 0, border: 'none', background: 'none', color: 'inherit', cursor: 'pointer' }}
              onClick={() => setDetail(card)}
            >
              <CardFace card={card} src={getScanUrl(card)} name={card.name} style={{ width: 100, height: 140 }} />
              {prizeCard ? <span style={{ display: 'block', marginTop: 8 }}>{cardDisplayName(card)}</span> : null}
            </button>
          ))}
        </div>
        <div className={styles.actions}>
          <TableConfirmAction
            onCancel={confirmResult === true && allowCancel ? () => resolve(prompt.id, null) : undefined}
            cancelLabel={prizeCard ? t('REACT_PRIZE_ADD_TO_HAND', { defaultValue: '加入手牌' }) : undefined}
            onClick={() => resolve(prompt.id, confirmResult === true ? true : null)}
          >
            {confirmLabel}
          </TableConfirmAction>
        </div>
      </div>
      {detail ? (
        <CardInfoPopup
          card={detail}
          players={players}
          catalog={catalog}
          getScanUrl={getScanUrl}
          onClose={() => setDetail(null)}
        />
      ) : null}
    </div>
  );
}

function ShowMulliganPanel(props: {
  prompt: ShowMulliganPrompt;
  players: LocalGameState['state']['players'];
  catalog: Card[];
  getScanUrl: (card: Card) => string;
  t: TFunction;
  gameMessageText: (t: TFunction, message: string | number) => string;
  resolve: (id: number, result: unknown) => void | Promise<void>;
}) {
  const { prompt, players, catalog, getScanUrl, t, gameMessageText, resolve } = props;
  const [detail, setDetail] = useState<Card | null>(null);

  return (
    <div className={styles.backdrop} role="presentation">
      <div className={`${styles.panel} ${styles.panelWide}`} role="dialog" aria-modal="true">
        <h2 className={styles.title}>{t('PROMPT_SHOW_MULLIGAN_TITLE', { defaultValue: '重抽起手牌' })}</h2>
        <p className={styles.message}>{gameMessageText(t, prompt.message)}</p>
        {prompt.hands.map((hand, hi) => (
          <div key={hi} className={styles.handBlock}>
            <div className={styles.handLabel}>
              {t('REACT_HAND_N', { defaultValue: '第 {{n}} 次起手', n: hi + 1 })}
            </div>
            <div className={styles.cardRow}>
              {hand.map((card: Card) => (
                <button
                  key={`${hi}-${card.id}-${card.fullName}`}
                  type="button"
                  style={{ padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                  onClick={() => setDetail(card)}
                >
                  <CardFace card={card} src={getScanUrl(card)} name={card.name} style={{ width: 88, height: 123 }} />
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className={styles.actions}>
          <TableConfirmAction onClick={() => resolve(prompt.id, null)}>
            {t('BUTTON_OK')}
          </TableConfirmAction>
        </div>
      </div>
      {detail ? (
        <CardInfoPopup
          card={detail}
          players={players}
          catalog={catalog}
          getScanUrl={getScanUrl}
          onClose={() => setDetail(null)}
        />
      ) : null}
    </div>
  );
}
