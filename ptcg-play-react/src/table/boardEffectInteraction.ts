import type { Card, CardTarget } from 'ptcg-server';

/** All targets in this UI contract use the viewer's board seats, never prompt seats. */
export type BoardEffectDestination = CardTarget | 'discard';

export interface BoardEffectTarget {
  target: CardTarget;
  name: string;
  selected?: boolean;
  disabled?: boolean;
  actionLabel?: string;
  /** Draft total and the authoritative total when the prompt opened. */
  value?: number;
  originalValue?: number;
  canDecrease?: boolean;
  canIncrease?: boolean;
  /** A physical damage counter that can be picked up or dragged from this card. */
  tokenId?: string;
  tokenLabel?: string;
}

export interface BoardEffectChip {
  id: string;
  label: string;
  card?: Card;
  /** Omit for an authorized source pool, such as energy recovered from discard. */
  source?: CardTarget;
  selected?: boolean;
  disabled?: boolean;
}

export interface BoardEffectInteraction {
  id: string;
  kind: 'damage-put' | 'damage-remove' | 'damage-move' | 'energy-attach' | 'energy-move' | 'energy-discard' | 'energy-choose' | 'target-select' | 'hand-target';
  title: string;
  message: string;
  progress?: string;
  disabled?: boolean;
  targets: readonly BoardEffectTarget[];
  focusedTarget?: CardTarget;
  chips?: readonly BoardEffectChip[];
  getScanUrl?: (card: Card) => string;
  /** Focus or activate a real board target; implementers revalidate the current draft. */
  onTarget: (target: CardTarget) => void;
  onAdjust?: (target: CardTarget, direction: -1 | 1) => void;
  onChip?: (id: string) => void;
  canDrop?: (chipId: string, destination: BoardEffectDestination) => boolean;
  onDrop?: (chipId: string, destination: BoardEffectDestination) => void;
  onReset: () => void;
}

export const BOARD_EFFECT_DRAG_PREFIX = 'board-effect-chip:';
export const BOARD_EFFECT_DISCARD_DROP_ID = 'board-effect-discard';
export function boardEffectDragId(chipId: string): string {
  return `${BOARD_EFFECT_DRAG_PREFIX}${chipId}`;
}
export function parseBoardEffectDragId(id: string): string | null {
  return id.startsWith(BOARD_EFFECT_DRAG_PREFIX) ? id.slice(BOARD_EFFECT_DRAG_PREFIX.length) : null;
}
