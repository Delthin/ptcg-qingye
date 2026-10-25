import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TFunction } from 'i18next';
import { Format, type InvitePlayerPrompt } from 'ptcg-server';
import { getDeck, getDeckList } from '../../api/deckApi';
import { getDuoState, rememberDuoDeck, selectDuoDeck } from '../../duo/duoApi';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../api/apiError';
import { formatOptionLabel } from '../../deck-editor/formatLabelI18n';
import { ArchetypeIcon } from '../../games/ArchetypeIcon';
import { deckArchetypeForDisplay } from '../../games/deckArchetypeDisplay';
import {
  pickDefaultDeckIdForFormat,
  validDecksForFormat,
} from '../../games/deckDefaultPreferences';
import type { DeckListEntry } from '../../types/responses';
import type { LocalGameState } from '../types/localGameState';
import { ShellButton } from '../../components/ui/ShellButton';
import { TableConfirmAction } from '../hud/TablePrimaryAction';
import { cn } from '../../utils/cn';
import styles from './InvitePlayerPromptPanel.module.css';

export type InvitePlayerPromptPanelProps = {
  prompt: InvitePlayerPrompt;
  localGame: LocalGameState;
  t: TFunction;
  gameMessageText: (t: TFunction, message: string | number) => string;
  resolve: (id: number, result: unknown) => void | Promise<void>;
};

export function InvitePlayerPromptPanel(props: InvitePlayerPromptPanelProps) {
  const { prompt, localGame, t, gameMessageText, resolve } = props;
  const navigate = useNavigate();
  const { user } = useAuth();

  const gameFormat = localGame.format ?? Format.STANDARD;

  const [allDecks, setAllDecks] = useState<DeckListEntry[]>([]);
  const [deckId, setDeckId] = useState<number | null>(null);
  const [savedDeckId, setSavedDeckId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const validDecks = useMemo(
    () => validDecksForFormat(allDecks, gameFormat),
    [allDecks, gameFormat],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void (async () => {
      try {
        const [res, room] = await Promise.all([getDeckList({ summary: true }), getDuoState()]);
        if (cancelled) {
          return;
        }
        setSavedDeckId(room.players.find(player => player.userId === user?.userId)?.selectedDeckId ?? null);
        setAllDecks(res.decks.filter(deck => deck.id > 0));
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof ApiError ? e.message : t('REACT_ERROR_LOAD_DECKS'));
          setAllDecks([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [prompt.id, t, user?.userId]);

  useEffect(() => {
    if (validDecks.length === 0) {
      setDeckId(null);
      return;
    }
    setDeckId(savedDeckId && validDecks.some(deck => deck.id === savedDeckId) ? savedDeckId : pickDefaultDeckIdForFormat(validDecks, gameFormat));
  }, [validDecks, savedDeckId, gameFormat, prompt.id]);

  const onConfirm = useCallback(async () => {
    if (!deckId || confirming || localGame.deleted) {
      return;
    }
    setConfirming(true);
    try {
      const deckRes = await getDeck(deckId);
      await selectDuoDeck(deckId);
      if (user) rememberDuoDeck(user.userId, deckId);
      await resolve(prompt.id, {
        deck: deckRes.deck.cards,
        deckId: deckRes.deck.id,
        sleeveImagePath: deckRes.deck.sleeveImagePath,
      });
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : t('REACT_ERROR_LOAD_DECKS'));
    } finally {
      setConfirming(false);
    }
  }, [confirming, deckId, localGame.deleted, prompt.id, resolve, t, user]);

  const formatLabel = formatOptionLabel(t, gameFormat);

  return (
    <div className={styles.backdrop} role="presentation">
      <div className={styles.panel} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <h2 className={styles.title}>
            {t('PROMPT_INVITE_TITLE', { defaultValue: '搭档邀你上桌' })}
          </h2>
          <div className={styles.formatBadge}>
            <span>{t('GAMES_FORMAT', { defaultValue: 'Format' })}:</span>
            <span className={styles.formatValue}>{formatLabel}</span>
          </div>
        </div>

        <div className={styles.content}>
          {loading && !confirming ? (
            <div className={styles.loading}>
              <p>{t('REACT_LOADING_DECKS', { defaultValue: 'Loading your decks…' })}</p>
            </div>
          ) : null}

          {!loading || confirming ? (
            <>
              <div className={styles.messageBox}>
                {gameMessageText(t, prompt.message)}
              </div>
              {loadError ? <p className={styles.noDecksDesc}>{loadError}</p> : null}

              {validDecks.length > 0 ? (
                <div>
                  <div className={styles.selectionHeader}>
                    <h3 className={styles.selectionTitle}>
                      {t('REACT_INVITE_SELECT_DECK', { defaultValue: '选择出战卡组' })}
                    </h3>
                    <span className={styles.deckCount}>
                      {validDecks.length}{' '}
                      {validDecks.length === 1
                        ? t('REACT_INVITE_DECK_SINGULAR', { defaultValue: '套卡组' })
                        : t('REACT_INVITE_DECK_PLURAL', { defaultValue: '套卡组' })}{' '}
                      {t('REACT_INVITE_AVAILABLE', { defaultValue: '可用' })}
                    </span>
                  </div>
                  <div className={styles.deckGrid}>
                    {validDecks.map((deck) => (
                      <button
                        key={deck.id}
                        type="button"
                        className={cn(
                          styles.deckCard,
                          deckId === deck.id && styles.deckCardSelected,
                          localGame.deleted && styles.deckCardDisabled,
                        )}
                        disabled={!!localGame.deleted}
                        onClick={() => setDeckId(deck.id)}
                      >
                        <div className={styles.deckArtwork}>
                          <ArchetypeIcon archetypes={deckArchetypeForDisplay(deck)} scale={2.5} />
                        </div>
                        <p className={styles.deckName}>{deck.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={styles.noDecks}>
                  <h3 className={styles.noDecksTitle}>
                    {t('PROMPT_INVITE_NO_DECK', { defaultValue: 'No valid deck' })}
                  </h3>
                  <p className={styles.noDecksDesc}>
                    {t('REACT_INVITE_NO_DECK_DESC', {
                      defaultValue:
                        'You need a valid deck for this format before you can join the game.',
                    })}
                  </p>
                  <ShellButton type="button" onClick={() => navigate('/deck')}>
                    {t('PROMPT_INVITE_GO_TO_DECKS', { defaultValue: 'Go to decks' })}
                  </ShellButton>
                </div>
              )}
            </>
          ) : null}
        </div>

        <div className={styles.actions}>
          <TableConfirmAction onCancel={() => resolve(prompt.id, null)} cancelDisabled={!!localGame.deleted || confirming}
            disabled={!!localGame.deleted || !deckId || loading || confirming} onClick={onConfirm}>
            {confirming ? t('REACT_CONFIRMING', { defaultValue: 'Confirming…' }) : t('BUTTON_OK')}
          </TableConfirmAction>
        </div>
      </div>
    </div>
  );
}
