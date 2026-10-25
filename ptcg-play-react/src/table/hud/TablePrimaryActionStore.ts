import type { TableOrbState } from './TableTurnOrb';

export type TablePrimaryAction = {
  id: string;
  host: HTMLElement;
  priority: number;
  active: boolean;
  disabled: boolean;
  state: TableOrbState;
  label: string;
  onActivate?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  cancelLabel?: string;
  /** A non-cancelling alternative (for example, choosing to go second). */
  cancelIcon?: 'close' | 'arrow';
  cancelDisabled?: boolean;
};

/** One primary control: a prompt always takes precedence over setup / end turn. */
export class TablePrimaryActionStore {
  private actions = new Map<string, TablePrimaryAction>();
  private listeners = new Set<() => void>();
  private snapshot: TablePrimaryAction | null = null;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  getSnapshot = () => this.snapshot;

  set(id: string, action: Omit<TablePrimaryAction, 'id'>) {
    this.actions.set(id, { ...action, id });
    this.publish();
  }
  remove(id: string) {
    this.actions.delete(id);
    this.publish();
  }
  private publish() {
    const next = [...this.actions.values()].sort((a, b) => b.priority - a.priority)[0] ?? null;
    if (next === this.snapshot) return;
    this.snapshot = next;
    this.listeners.forEach(listener => listener());
  }
}
