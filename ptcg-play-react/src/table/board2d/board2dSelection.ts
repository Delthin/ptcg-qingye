import { GameMessage, SlotType, type CardTarget, type ChoosePokemonPrompt } from 'ptcg-server';

export const BOARD_SELECTION_DROP_ID = 'board-selection';

export function isSwitchSelection(prompt: ChoosePokemonPrompt | null): boolean {
  return !!prompt && prompt.options.max === 1 &&
    (prompt.message === GameMessage.CHOOSE_POKEMON_TO_SWITCH ||
      prompt.message === GameMessage.CHOOSE_NEW_ACTIVE_POKEMON);
}

/** The target is always the eligible Bench, even when dragging Active in the other direction. */
export function switchDropTarget(
  from: CardTarget | null,
  to: CardTarget | null,
  eligible: (target: CardTarget) => boolean,
): CardTarget | null {
  if (!from || !to || from.player !== to.player) return null;
  const bench = from.slot === SlotType.BENCH && to.slot === SlotType.ACTIVE && to.index === 0 ? from :
    from.slot === SlotType.ACTIVE && from.index === 0 && to.slot === SlotType.BENCH ? to : null;
  return bench && eligible(bench) ? bench : null;
}
