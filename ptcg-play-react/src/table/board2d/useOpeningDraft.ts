import { useEffect, useMemo, useState } from 'react';
import { GamePhase, type Card, type CardTarget, type ChooseStartingPokemonPrompt, type Player } from 'ptcg-server';
import type { LocalGameState } from '../types/localGameState';
import type { Board3dGameActions } from '../board3d/board3dGameActions';
import { emptyOpeningDraft, moveOpeningCard, openingCardIds, openingDraftPayload, openingPreviewPlayer, type OpeningDraft } from './openingDraftModel';

export function useOpeningDraft(game: LocalGameState, player: Player, clientId: number, hand: readonly Card[], actions: Board3dGameActions) {
  const prompt = game.state.prompts.find(p => p.type === 'Choose starting pokemon' && p.playerId === clientId && p.result === undefined) as ChooseStartingPokemonPrompt | undefined;
  const key = `${game.localId}:${prompt?.id ?? '-'}`;
  const [entry, setEntry] = useState<{ key: string; draft: OpeningDraft; submitted: boolean; pending: boolean; error: string }>({ key, draft: emptyOpeningDraft(player.bench.length), submitted: false, pending: false, error: '' });
  useEffect(() => {
    if (prompt && entry.key !== key) setEntry({ key, draft: emptyOpeningDraft(prompt.benchSize), submitted: false, pending: false, error: '' });
  }, [key, prompt, entry.key]);
  const waiting = !prompt && entry.submitted && entry.key.startsWith(`${game.localId}:`) && player.active.cards.length === 0;
  const active = game.state.phase === GamePhase.SETUP && !game.replay && player.id === clientId && (!!prompt || waiting);
  const draft = entry.key === key || waiting ? entry.draft : emptyOpeningDraft(player.bench.length);
  const editable = active && !!prompt && !entry.submitted && !entry.pending;
  const placedIds = openingCardIds(draft);
  const eligible = useMemo(() => new Set(prompt ? hand.filter((_, index) => !prompt.blocked.includes(index)).map(card => card.id) : []), [prompt, hand]);
  const canConfirm = editable && (!prompt?.activeRequired || draft.activeId !== null) && [...placedIds].every(id => eligible.has(id));
  const displayPlayer = game.state.phase === GamePhase.SETUP && player.id === clientId
    ? openingPreviewPlayer(player, active ? draft : emptyOpeningDraft(player.bench.length), hand) : player;
  const move = (cardId: number, target: CardTarget) => {
    if (!editable || !prompt || !eligible.has(cardId)) return;
    setEntry(previous => ({ ...previous, key, draft: moveOpeningCard(draft, cardId, target, prompt), error: '' }));
  };
  const canDrop = (cardId: number, target: CardTarget) => editable && !!prompt && eligible.has(cardId) &&
    moveOpeningCard(draft, cardId, target, prompt) !== draft;
  const submit = async () => {
    if (!canConfirm || !prompt) return;
    setEntry(previous => ({ ...previous, pending: true, submitted: true, error: '' }));
    try {
      await actions.resolvePrompt(game.gameId, prompt.id, openingDraftPayload(draft, hand));
      setEntry(previous => ({ ...previous, pending: false, submitted: true }));
    } catch {
      setEntry(previous => ({ ...previous, pending: false, submitted: false, error: '未能确认，请检查预备牌阵后重试。' }));
    }
  };
  return { active, editable, activeRequired: prompt?.activeRequired ?? false, waiting: waiting || entry.submitted, pending: entry.pending, error: entry.error, draft, eligible, placedIds,
    displayPlayer, displayHand: active ? hand.filter(card => !placedIds.has(card.id)) : hand, canConfirm, move, canDrop, submit };
}
