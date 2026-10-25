import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { BoardInteractionService } from './BoardInteractionService';
import type { BoardEffectInteraction } from './boardEffectInteraction';

export function useBoardEffectSurface(service: BoardInteractionService): boolean {
  const [enabled, setEnabled] = useState(() => service.hasBoardEffectSurface());
  useLayoutEffect(() => {
    const subscription = service.boardEffectSurface$.subscribe(setEnabled);
    return () => subscription.unsubscribe();
  }, [service]);
  return enabled;
}

/** One prompt owns one draft. Old cleanup cannot clear a replacement prompt's controls. */
export function useBoardEffectInteraction(service: BoardInteractionService, effect: BoardEffectInteraction | null): boolean {
  const owner = useRef(Symbol('board-effect-prompt')).current;
  const enabled = useBoardEffectSurface(service);
  useLayoutEffect(() => {
    if (enabled && effect) service.setBoardEffect(owner, effect);
    else service.clearBoardEffect(owner);
  }, [service, owner, enabled, effect]);
  useLayoutEffect(() => () => service.clearBoardEffect(owner), [service, owner]);
  return enabled;
}

/** Freeze the draft during a request; retain it on failure and ignore stale completions. */
export function useBoardEffectSubmission(
  promptId: number,
  resolve: (id: number, result: unknown) => void | Promise<void>,
  onSuccess?: () => void,
): { pending: boolean; isPending: () => boolean; submit: (result: unknown) => Promise<void> } {
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const generation = useRef(0);
  const mounted = useRef(false);
  useLayoutEffect(() => {
    mounted.current = true;
    busy.current = false;
    generation.current++;
    setPending(false);
    return () => { mounted.current = false; generation.current++; };
  }, [promptId]);
  const submit = useCallback(async (result: unknown) => {
    if (busy.current || !mounted.current) return;
    busy.current = true;
    setPending(true);
    const started = generation.current;
    try {
      await resolve(promptId, result);
      if (mounted.current && started === generation.current) onSuccess?.();
    } finally {
      if (mounted.current && started === generation.current) {
        busy.current = false;
        setPending(false);
      }
    }
  }, [promptId, resolve, onSuccess]);
  const isPending = useCallback(() => busy.current, []);
  return { pending, isPending, submit };
}
