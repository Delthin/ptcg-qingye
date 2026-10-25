import { apiGet, apiPost } from '../api/client';
import type { DeckResponse } from '../types/responses';
import presetsJson from './preset-decks.json';

export interface DuoPlayer {
  userId: number; name: string; label: string; connected: boolean;
  busy: boolean; challengeable: boolean;
  /** 不可挑战的具体原因（供大厅/好友列表直接展示）。 */
  unavailableReason?: string;
  deckUnavailableReason?: string;
  duoPublic?: boolean; isFriend?: boolean; deckReady?: boolean;
  selectedDeckId: number | null; selectedDeckName: string;
  wins: number; losses: number; draws: number;
}
export interface DuoMatch {
  id: number; player1Id: number; player2Id: number; winner: number; created: number;
  deck1: string; deck2: string;
}
export interface DuoLookup { userId: number; name: string; connected: boolean; clientId: number | null; }
export interface DuoFriendRequest { id: number; direction: 'incoming' | 'outgoing'; userId: number; name: string; }
export interface DuoState { players: DuoPlayer[]; peers?: DuoPlayer[]; requests?: DuoFriendRequest[]; matches: DuoMatch[]; }
export function setDuoVisibility(duoPublic: boolean): Promise<{ duoPublic: boolean }> {
  return apiPost('/v1/duo/visibility', { duoPublic });
}
export function lookupDuoUser(name: string): Promise<{ target: DuoLookup | null }> {
  return apiPost('/v1/duo/lookup', { name });
}
export function duoFriendAction(action: 'send' | 'accept' | 'reject' | 'cancel' | 'remove', targetId: number): Promise<{ ok: boolean }> {
  return apiPost('/v1/duo/friends', { action, targetId });
}
export const duoPresets = presetsJson;
export function getDuoState(signal?: AbortSignal): Promise<DuoState> {
  return apiGet<DuoState>('/v1/duo/state', { signal });
}
export function selectDuoDeck(deckId: number): Promise<{ selectedDeckId: number }> {
  return apiPost('/v1/duo/select-deck', { deckId });
}
export interface DuoRoles {
  roles: { name: string; label: string }[];
  registrationEnabled: boolean;
}
export function getDuoRoles(): Promise<DuoRoles> {
  return apiGet('/v1/duo/roles', { skipAuth: true });
}
/** Create a lobby account. The endpoint is reachable without a session token. */
export function registerDuoAccount(name: string, password: string, roomPassword: string): Promise<{ ok: boolean }> {
  return apiPost('/v1/duo/register', { name, password, roomPassword }, { skipAuth: true });
}
export function copyDuoPreset(id: string, name: string): Promise<DeckResponse> {
  const preset = duoPresets.find(preset => preset.id === id);
  if (!preset) return Promise.reject(new Error('卡组不存在'));
  return apiPost('/v1/decks/save', {
    name, cards: preset.cards.flatMap(card => Array.from({ length: card.count }, () => card.fullName)),
  });
}
export function rememberDuoDeck(userId: number, deckId: number): void {
  localStorage.setItem(`ptcg.duo.deck.${userId}`, String(deckId));
}
