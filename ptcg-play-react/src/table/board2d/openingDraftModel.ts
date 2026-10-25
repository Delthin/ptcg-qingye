import { CardList, PokemonCardList, PlayerType, SlotType, type Card, type CardTarget, type ChooseStartingPokemonPrompt, type Player, type StartingPokemonLayout } from 'ptcg-server';

export type OpeningDraft = { activeId: number | null; benchIds: (number | null)[] };
export function emptyOpeningDraft(size = 5): OpeningDraft { return { activeId: null, benchIds: Array(size).fill(null) }; }
export function openingCardIds(draft: OpeningDraft): Set<number> {
  return new Set([draft.activeId, ...draft.benchIds].filter((id): id is number => id !== null));
}
export function openingSlotCardId(draft: OpeningDraft, slot: SlotType, index = 0): number | null {
  return slot === SlotType.ACTIVE ? draft.activeId : slot === SlotType.BENCH ? draft.benchIds[index] ?? null : null;
}

/** Moving within the private layout swaps occupied slots; a hand replacement returns the old card to hand. */
export function moveOpeningCard(draft: OpeningDraft, cardId: number, target: CardTarget, prompt: Pick<ChooseStartingPokemonPrompt, 'activeRequired' | 'blockedBench'>): OpeningDraft {
  if (target.player !== PlayerType.BOTTOM_PLAYER) return draft;
  if (target.slot !== SlotType.HAND && target.slot !== SlotType.ACTIVE && target.slot !== SlotType.BENCH) return draft;
  if (target.slot === SlotType.ACTIVE && !prompt.activeRequired) return draft;
  if (target.slot === SlotType.BENCH && (!Number.isInteger(target.index) || target.index < 0 || target.index >= draft.benchIds.length || prompt.blockedBench.includes(target.index))) return draft;
  const next = { activeId: draft.activeId, benchIds: [...draft.benchIds] };
  const fromBench = next.benchIds.indexOf(cardId);
  const fromActive = next.activeId === cardId;
  if (fromActive) next.activeId = null;
  if (fromBench >= 0) next.benchIds[fromBench] = null;
  if (target.slot === SlotType.HAND) return next;
  const displaced = target.slot === SlotType.ACTIVE ? next.activeId : next.benchIds[target.index];
  if (target.slot === SlotType.ACTIVE) next.activeId = cardId;
  else next.benchIds[target.index] = cardId;
  if (displaced !== null && displaced !== undefined) {
    if (fromActive) next.activeId = displaced;
    else if (fromBench >= 0) next.benchIds[fromBench] = displaced;
  }
  return next;
}

export function openingDraftPayload(draft: OpeningDraft, hand: readonly Card[]): StartingPokemonLayout {
  const index = (id: number | null): number | null => id === null ? null : hand.findIndex(card => card.id === id);
  return { active: index(draft.activeId), bench: draft.benchIds.map(index) };
}

/** Clone lists only; never mutate the live/sanitized game state to paint a private preview. */
export function openingPreviewPlayer(player: Player, draft: OpeningDraft, hand: readonly Card[]): Player {
  const preview = Object.assign(Object.create(Object.getPrototypeOf(player)), player) as Player;
  const list = (source: PokemonCardList, id: number | null) => {
    const copy = Object.assign(new PokemonCardList(), source);
    copy.isSecret = false;
    if (id !== null) copy.cards = hand.filter(card => card.id === id);
    return copy;
  };
  preview.active = list(player.active, draft.activeId);
  preview.bench = player.bench.map((source, index) => list(source, draft.benchIds[index] ?? null));
  preview.hand = Object.assign(new CardList(), player.hand, { cards: hand.filter(card => !openingCardIds(draft).has(card.id)) });
  return preview;
}
