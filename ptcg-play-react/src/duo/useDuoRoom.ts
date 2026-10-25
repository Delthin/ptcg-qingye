import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDeckList } from '../api/deckApi';
import type { DeckListEntry } from '../types/responses';
import { getDuoState, rememberDuoDeck, type DuoState } from './duoApi';

/**
 * Lobby state: deck list loads per login; online/busy/challengeable flags are
 * re-synced on a timer, on focus and on demand (syncRoom) so the player list
 * tracks live core games without refetching decks.
 */
export function useDuoRoom() {
  const { user } = useAuth();
  const userId = user?.userId;
  const [room, setRoom] = useState<DuoState>({ players: [], matches: [] });
  const [decks, setDecks] = useState<DeckListEntry[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const aliveRef = useRef(true);
  const pendingRef = useRef<number | null>(null);
  const generationRef = useRef(0);
  const requestRef = useRef(0);
  const userIdRef = useRef(userId);

  const syncRoom = useCallback(async (signal?: AbortSignal, force = false) => {
    const generation = generationRef.current;
    if (pendingRef.current === generation && !force) return;
    const request = ++requestRef.current;
    pendingRef.current = generation;
    try {
      const next = await getDuoState(signal);
      if (!aliveRef.current || generation !== generationRef.current || request !== requestRef.current) return;
      setRoom(next);
      const selected = next.players.find(player => player.userId === userIdRef.current)?.selectedDeckId;
      if (selected && userIdRef.current) rememberDuoDeck(userIdRef.current, selected);
      setError('');
    } catch {
      if (aliveRef.current && generation === generationRef.current && request === requestRef.current) setError('大厅信息暂时未能更新，正在自动重试。');
    } finally {
      if (pendingRef.current === generation && request === requestRef.current) pendingRef.current = null;
      if (aliveRef.current && generation === generationRef.current && request === requestRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    const generation = ++generationRef.current;
    userIdRef.current = userId;
    const abort = new AbortController();
    setLoading(true); setError(''); setDecks([]); setRoom({ players: [], matches: [] });
    void syncRoom(abort.signal);
    void getDeckList({ summary: false })
      .then(list => { if (aliveRef.current && generation === generationRef.current) setDecks(list.decks.filter(deck => deck.id > 0)); })
      .catch(() => { if (aliveRef.current && generation === generationRef.current) setDecks([]); });
    const timer = window.setInterval(() => void syncRoom(), 8000);
    const onFocus = () => void syncRoom();
    const onChanged = () => void syncRoom(undefined, true);
    window.addEventListener('duo:changed', onChanged);
    window.addEventListener('focus', onFocus);
    return () => {
      aliveRef.current = false;
      abort.abort(); clearInterval(timer); window.removeEventListener('focus', onFocus);
      window.removeEventListener('duo:changed', onChanged);
    };
  }, [userId, revision, syncRoom]);

  return {
    room, decks, setRoom, setDecks, error, loading,
    syncRoom,
    /** Full reload: lobby state plus the deck list (used by the records page). */
    refresh: () => setRevision(value => value + 1),
  };
}
