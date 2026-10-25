import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { CardTarget, DamageMap } from 'ptcg-server';
import type { LocalGameState } from '../types/localGameState';
import type { BoardInteractionService } from '../BoardInteractionService';
import type { BoardEffectInteraction, BoardEffectDestination } from '../boardEffectInteraction';
import { useBoardEffectInteraction, useBoardEffectSubmission } from '../useBoardEffectInteraction';
import { TableConfirmAction } from '../hud/TablePrimaryAction';
import { ShellButton } from '../../components/ui/ShellButton';
import { buildPokemonPromptRows } from './pokemonPromptRows';
import { getPromptPerspectivePlayerId } from './promptPerspective';
import { cardTargetKey, computeNetPendingDamageRemoved, findItemByTarget, targetsEqual } from './removeDamagePromptModel';
import { computeNetDamagePlaced } from './putDamagePromptModel';
import { adjustDamageDraft, canAdjustDamage, damageDraftResult, damageStep, damageTransferGoal, isDamageDraftValid, isPutDamage, transferDamageDraft, type BoardDamagePrompt } from './boardDamageDraft';
import styles from './TablePromptLayer.module.css';

export interface DamageBoardPromptProps {
  prompt: BoardDamagePrompt;
  localGame: LocalGameState;
  boardInteraction: BoardInteractionService;
  gameMessageText: (t: TFunction, message: string | number) => string;
  resolve: (id: number, result: unknown) => void | Promise<void>;
}

/** Shared draft editor for placing and transferring counters, independent of item/ability origin. */
export function DamageBoardPrompt({ prompt, localGame, boardInteraction, gameMessageText, resolve }: DamageBoardPromptProps) {
  const { t } = useTranslation();
  const [initialRows] = useState(() => buildPokemonPromptRows(localGame.state, getPromptPerspectivePlayerId(prompt), prompt.playerType, prompt.slots));
  const initial = useMemo<DamageMap[]>(() => initialRows.flatMap(row => row.items.filter(item => item.cardList.cards.length).map(item => ({ target: { ...item.target }, damage: item.cardList.damage }))), [initialRows]);
  const [rows, setRows] = useState(initialRows);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const [focused, setFocused] = useState<CardTarget>();
  const [picked, setPicked] = useState<CardTarget>();
  const onSuccess = useCallback(() => boardInteraction.endBoardSelection(), [boardInteraction]);
  const { pending, isPending, submit } = useBoardEffectSubmission(prompt.id, resolve, onSuccess);
  const disabled = pending || !!localGame.deleted || !!localGame.replay;
  const blocked = useCallback(() => isPending() || !!localGame.deleted || !!localGame.replay, [isPending, localGame.deleted, localGame.replay]);
  const step = damageStep(prompt);
  const put = isPutDamage(prompt);
  const title = put ? '放置伤害指示物' : '移动伤害指示物';

  useEffect(() => {
    const subscription = boardInteraction.selectedTargets$.subscribe(() => {
      const selected = boardInteraction.getPromptSelectedTargets()[0];
      if (selected) setFocused(selected);
    });
    return () => subscription.unsubscribe();
  }, [boardInteraction]);

  const replace = useCallback((next: typeof rows) => {
    if (next === rowsRef.current) return false;
    rowsRef.current = next;
    setRows(next);
    return true;
  }, []);
  const adjust = useCallback((target: CardTarget, direction: -1 | 1) => {
    if (blocked()) return;
    replace(adjustDamageDraft(prompt, rowsRef.current, initial, target, direction));
    setFocused(target);
    setPicked(undefined);
  }, [blocked, replace, prompt, initial]);
  const reset = useCallback(() => {
    if (blocked()) return;
    replace(initialRows);
    setPicked(undefined);
  }, [blocked, replace, initialRows]);
  const visual = useCallback((target: CardTarget) => boardInteraction.toVisualCardTarget(target), [boardInteraction]);
  // Seat remapping is its own inverse; the service is initialized by the active damage prompt.
  const perspective = visual;
  const tokenSource = useCallback((id: string) => rowsRef.current.flatMap(row => row.items).find(item => id === `damage:${cardTargetKey(item.target)}`)?.target, []);
  const canDrop = useCallback((id: string, destination: BoardEffectDestination) => {
    if (blocked() || destination === 'discard' || put) return false;
    const from = tokenSource(id);
    return !!from && transferDamageDraft(prompt, rowsRef.current, initial, from, perspective(destination)) !== rowsRef.current;
  }, [blocked, put, tokenSource, prompt, initial, perspective]);
  const drop = useCallback((id: string, destination: BoardEffectDestination) => {
    if (!canDrop(id, destination) || destination === 'discard') return;
    const from = tokenSource(id);
    if (!from) return;
    const to = perspective(destination);
    if (replace(transferDamageDraft(prompt, rowsRef.current, initial, from, to))) {
      setFocused(to);
      setPicked(undefined);
    }
  }, [canDrop, tokenSource, perspective, replace, prompt, initial]);
  const selectToken = useCallback((id: string) => {
    if (blocked()) return;
    const source = tokenSource(id);
    if (!source || !canAdjustDamage(prompt, rowsRef.current, initial, source, -1)) return;
    const deselect = !!picked && targetsEqual(picked, source);
    setFocused(deselect ? undefined : source);
    setPicked(deselect ? undefined : source);
  }, [blocked, tokenSource, prompt, initial, picked]);
  const onTarget = useCallback((target: CardTarget) => {
    if (blocked()) return;
    if (picked && canDrop(`damage:${cardTargetKey(picked)}`, target)) {
      drop(`damage:${cardTargetKey(picked)}`, target);
      return;
    }
    const original = perspective(target);
    if (findItemByTarget(rowsRef.current, original)?.cardList.cards.length) {
      setFocused(focused && targetsEqual(focused, original) ? undefined : original);
    }
  }, [blocked, picked, canDrop, drop, perspective, focused]);
  const placed = computeNetDamagePlaced(rows, initial);
  const transfers = put ? [] : damageDraftResult(prompt, rows, initial);
  const held = put ? 0 : computeNetPendingDamageRemoved(rows, initial);
  const transferGoal = damageTransferGoal(prompt, rows, initial);
  const progress = put ? `已放置 ${placed} / ${prompt.damage} 点 · 每次 ${step} 点` :
    `已转移 ${transfers.length}${transferGoal === undefined ? '' : ` / ${transferGoal}`} 个${held ? ` · 待放置 ${held} 点` : ''} · 每个 ${step} 点`;
  const descriptor = useMemo<BoardEffectInteraction>(() => ({
    id: `${localGame.localId}:${prompt.id}`,
    kind: put ? 'damage-put' : 'damageMultiple' in prompt.options ? 'damage-move' : 'damage-remove',
    title, message: gameMessageText(t, prompt.message), progress, disabled,
    targets: rows.flatMap(row => row.items.filter(item => item.cardList.cards.length &&
      (!isPutDamage(prompt) || !prompt.options.blocked.some(target => targetsEqual(target, item.target)))).map(item => ({
      target: visual(item.target), name: item.cardList.getPokemonCard()?.name ?? '宝可梦',
      selected: (!!focused && targetsEqual(focused, item.target)) || (!!picked && targetsEqual(picked, item.target)),
      disabled: disabled || (!!picked && !targetsEqual(picked, item.target) && !canDrop(`damage:${cardTargetKey(picked)}`, visual(item.target))),
      value: item.cardList.damage, originalValue: initial.find(entry => targetsEqual(entry.target, item.target))?.damage,
      canDecrease: !disabled && canAdjustDamage(prompt, rows, initial, item.target, -1),
      canIncrease: !disabled && canAdjustDamage(prompt, rows, initial, item.target, 1),
      tokenId: !put && canAdjustDamage(prompt, rows, initial, item.target, -1) ? `damage:${cardTargetKey(item.target)}` : undefined,
      tokenLabel: `${step} 伤害`, actionLabel: picked ? '放到这里' : '调整伤害',
    }))),
    focusedTarget: focused ? visual(focused) : undefined,
    chips: picked ? [{ id: `damage:${cardTargetKey(picked)}`, label: `${step} 伤害`, source: visual(picked), selected: true }] : [],
    onTarget, onAdjust: (target, direction) => adjust(perspective(target), direction),
    onChip: selectToken, canDrop, onDrop: drop, onReset: reset,
  }), [localGame.localId, prompt, put, title, gameMessageText, t, progress, disabled, rows, focused, initial, visual, picked, onTarget, adjust, perspective, selectToken, canDrop, drop, reset]);
  const onBoard = useBoardEffectInteraction(boardInteraction, descriptor);
  const valid = isDamageDraftValid(prompt, rows, initial);

  useEffect(() => {
    if (!put) return;
    const preview = new Map<string, number>();
    for (const item of rows.flatMap(row => row.items)) {
      const delta = item.cardList.damage - (initial.find(entry => targetsEqual(entry.target, item.target))?.damage ?? 0);
      if (delta > 0) preview.set(cardTargetKey(visual(item.target)), delta);
    }
    boardInteraction.setPutDamagePlacementPreview(preview);
    return () => boardInteraction.setPutDamagePlacementPreview(new Map());
  }, [put, rows, initial, visual, boardInteraction]);

  const hudRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (onBoard) return;
    let frame = 0;
    const tick = () => {
      const anchor = boardInteraction.getRemoveDamageHudAnchor();
      if (hudRef.current) {
        hudRef.current.style.display = focused && anchor ? 'flex' : 'none';
        if (anchor) { hudRef.current.style.left = `${anchor.x}px`; hudRef.current.style.top = `${anchor.y + 10}px`; }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [onBoard, boardInteraction, focused]);

  return <>
    {!onBoard ? <>
      <div ref={hudRef} className={styles.removeDamageFloatingHud} style={{ display: 'none' }} role="group" aria-label="调整伤害">
        <ShellButton disabled={disabled || !focused || !canAdjustDamage(prompt, rows, initial, focused, -1)} onClick={() => focused && adjust(focused, -1)}>−</ShellButton>
        <span>{focused ? findItemByTarget(rows, focused)?.cardList.damage : 0}</span>
        <ShellButton disabled={disabled || !focused || !canAdjustDamage(prompt, rows, initial, focused, 1)} onClick={() => focused && adjust(focused, 1)}>＋</ShellButton>
      </div>
      <div className={styles.chooseBar}><span>{gameMessageText(t, prompt.message)} · {progress}</span><ShellButton disabled={disabled} onClick={reset}>{t('PROMPT_RESET')}</ShellButton></div>
    </> : null}
    <TableConfirmAction disabled={disabled || !valid} onClick={() => !blocked() && valid ? submit(damageDraftResult(prompt, rowsRef.current, initial)) : undefined}
      onCancel={prompt.options.allowCancel ? () => !blocked() ? submit(null) : undefined : undefined} cancelDisabled={disabled}>
      {t('BUTTON_OK')}
    </TableConfirmAction>
  </>;
}
