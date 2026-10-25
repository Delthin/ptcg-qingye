import { GameMessage, GamePhase, type Prompt } from 'ptcg-server';
import type { LocalGameState } from './types/localGameState';

export function activeGamePrompt(
  game: LocalGameState | null | undefined,
  clientId: number,
): Prompt<any> | undefined {
  if (!game?.state?.prompts?.length || !clientId) {
    return undefined;
  }
  return game.state.prompts.find((p) => p.playerId === clientId && p.result === undefined);
}

/** The server also publishes an Alert placeholder so the other player can see who is deciding. */
export function pendingTurnOrderPrompt(
  game: LocalGameState | null | undefined,
): Prompt<any> | undefined {
  if (game?.state.phase !== GamePhase.SETUP) return undefined;
  return game.state.prompts.find((p) => p.result === undefined &&
    (p.type === 'Confirm' || p.type === 'Alert') && 'message' in p && p.message === GameMessage.GO_FIRST);
}

export function hasUnresolvedGamePrompts(
  game: LocalGameState | null | undefined,
): boolean {
  return !!game?.state?.prompts?.some((p) => p.result === undefined);
}
