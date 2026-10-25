import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TFunction } from 'i18next';
import type { Card, CardTarget, DiscardEnergyPrompt } from 'ptcg-server';
import { CardType, PlayerType } from 'ptcg-server';
import type { LocalGameState } from '../types/localGameState';
import type { BoardInteractionService } from '../BoardInteractionService';
import type { BoardEffectDestination } from '../boardEffectInteraction';
import { useBoardEffectInteraction, useBoardEffectSubmission } from '../useBoardEffectInteraction';
import { CardFace } from '../../components/cards/CardFace';
import { ShellButton } from '../../components/ui/ShellButton';
import { TableConfirmAction } from '../hud/TablePrimaryAction';
import { cn } from '../../utils/cn';
import {
  buildDiscardEnergyResolvePayload,
  canSelectDiscardSource,
  computeDiscardEnergyInvalid,
  eligibleEnergyCardsForSource,
  hasDiscardEnergySelectionLimit,
  removeDiscardEnergySelection,
  toggleDiscardEnergySelection,
  type DiscardEnergySelection,
} from './discardEnergyPromptModel';
import { buildOriginalCardIndexMap } from './moveEnergyPromptModel';
import { buildPokemonPromptRows, type PokemonItem, type PokemonRow } from './pokemonPromptRows';
import { getPromptPerspectivePlayerId, promptNeedsPerspectiveSwap, remapCardTargetSeat } from './promptPerspective';
import { findItemByTarget, targetsEqual } from './removeDamagePromptModel';
import moveStyles from './MoveEnergyPromptPanel.module.css';
import styles from './DiscardEnergyPromptPanel.module.css';

const s = { ...moveStyles, ...styles };

function displayPokemonCard(item: PokemonItem): Card | undefined {
  return item.cardList.getPokemonCard() as Card | undefined;
}

/** 属性色宝石的取色（仅视觉）。 */
const ENERGY_GEM_VARS: Record<string, string> = {
  [CardType.GRASS]: 'var(--a-grass)',
  [CardType.FIRE]: 'var(--a-fire)',
  [CardType.WATER]: 'var(--a-water)',
  [CardType.LIGHTNING]: 'var(--a-lightning)',
  [CardType.PSYCHIC]: 'var(--a-psychic)',
  [CardType.FIGHTING]: 'var(--a-fighting)',
  [CardType.DARK]: 'var(--a-darkness)',
  [CardType.METAL]: 'var(--a-metal)',
  [CardType.DRAGON]: 'var(--a-dragon)',
  [CardType.FAIRY]: 'var(--a-psychic)',
  [CardType.COLORLESS]: 'var(--a-colorless)',
};

function energyGemVar(card: Card): string {
  const type = (card as { cardType?: CardType }).cardType;
  return (type != null && ENERGY_GEM_VARS[type]) || 'var(--a-colorless)';
}

export type DiscardEnergyPromptPanelProps = {
  prompt: DiscardEnergyPrompt;
  localGame: LocalGameState;
  boardInteraction: BoardInteractionService;
  clientId: number;
  getScanUrl: (card: Card) => string;
  t: TFunction;
  gameMessageText: (t: TFunction, message: string | number) => string;
  resolve: (id: number, result: unknown) => void | Promise<void>;
};

export function DiscardEnergyPromptPanel(props: DiscardEnergyPromptPanelProps) {
  const { prompt, localGame, boardInteraction, clientId, getScanUrl, t, gameMessageText, resolve } = props;
  const { pending, submit } = useBoardEffectSubmission(prompt.id, resolve);
  const requestRef = useRef<{ promptId: number } | null>(null);
  const frozen = useCallback(() => pending || !!localGame.deleted || !!localGame.replay ||
    requestRef.current?.promptId === prompt.id, [pending, localGame.deleted, localGame.replay, prompt.id]);
  const submitResult = (result: unknown) => {
    if (frozen()) return;
    const request = { promptId: prompt.id };
    requestRef.current = request;
    return submit(result).finally(() => { if (requestRef.current === request) requestRef.current = null; });
  };
  const disabled = pending || !!localGame.deleted || !!localGame.replay;
  const mapTarget = (target: CardTarget) => promptNeedsPerspectiveSwap(prompt, clientId) ? remapCardTargetSeat(target) : target;
  const { allowCancel, min, max, blockedFrom, blockedMap } = prompt.options;

  const indexMapRef = useRef<Map<Card, number>>(new Map());
  const [rows, setRows] = useState<PokemonRow[]>([]);
  const [selectedSource, setSelectedSource] = useState<CardTarget | undefined>(undefined);
  const [selections, setSelections] = useState<DiscardEnergySelection[]>([]);
  const selectionsRef = useRef(selections);
  selectionsRef.current = selections;

  useEffect(() => {
    const built = buildPokemonPromptRows(
      localGame.state,
      getPromptPerspectivePlayerId(prompt),
      prompt.playerType,
      prompt.slots,
    );
    indexMapRef.current = buildOriginalCardIndexMap(built);
    setRows(built);
    setSelectedSource(undefined);
    setSelections([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prompt identity
  }, [prompt.id]);

  const selectedItem = useMemo(
    () => findItemByTarget(rows, selectedSource),
    [rows, selectedSource],
  );

  const availableEnergyCards = useMemo(() => {
    if (!selectedItem) {
      return [];
    }
    return eligibleEnergyCardsForSource(
      selectedItem,
      prompt.filter,
      blockedMap ?? [],
      selections,
    );
  }, [selectedItem, prompt.filter, blockedMap, selections]);

  const isInvalid = useMemo(
    () => computeDiscardEnergyInvalid(selections, { min, max }),
    [selections, min, max],
  );

  const atMaxSelections = hasDiscardEnergySelectionLimit(max) && selections.length >= max;

  const onSelectSource = useCallback(
    (item: PokemonItem) => {
      if (frozen() || !canSelectDiscardSource(item, blockedFrom ?? [], prompt.filter, blockedMap ?? [], selectionsRef.current)) {
        return;
      }
      setSelectedSource({ ...item.target });
    },
    [blockedFrom, blockedMap, prompt.filter, frozen],
  );

  const energyEntries = rows.flatMap((row) => row.items).flatMap((item) => {
    if (!canSelectDiscardSource(item, blockedFrom ?? [], prompt.filter, blockedMap ?? [], [])) return [];
    return eligibleEnergyCardsForSource(item, prompt.filter, blockedMap ?? [], []).map((card) => ({
      card, from: item.target,
      id: `discard-${item.target.player}-${item.target.slot}-${item.target.index}-${card.id}-${indexMapRef.current.get(card)}`,
    }));
  });
  const toggleEnergy = (card: Card, from: CardTarget) => {
    if (frozen() || !energyEntries.some((entry) => entry.card === card && targetsEqual(entry.from, from))) return;
    selectionsRef.current = toggleDiscardEnergySelection(selectionsRef.current, from, card, max);
    setSelections(selectionsRef.current);
  };
  const onToggleEnergy = (card: Card) => { if (selectedSource) toggleEnergy(card, selectedSource); };
  const onRemoveSelection = (selection: DiscardEnergySelection) => {
    if (frozen()) return;
    selectionsRef.current = removeDiscardEnergySelection(selectionsRef.current, selection);
    setSelections(selectionsRef.current);
  };
  const reset = () => {
    if (frozen()) return;
    selectionsRef.current = [];
    setSelections([]);
    setSelectedSource(undefined);
  };
  const onConfirm = () => {
    if (frozen() || computeDiscardEnergyInvalid(selectionsRef.current, { min, max })) return;
    return submitResult(buildDiscardEnergyResolvePayload(selectionsRef.current, indexMapRef.current));
  };

  const title = t('PROMPT_DISCARD_ENERGY_TITLE', { defaultValue: 'Discard energy' });
  const selectionCountLabel =
    hasDiscardEnergySelectionLimit(max) ? `${selections.length}/${max}` : `${selections.length}`;

  const canDrop = (id: string, destination: BoardEffectDestination) => {
    const entry = energyEntries.find((entry) => entry.id === id);
    return !frozen() && destination === 'discard' && !!entry &&
      !selectionsRef.current.some((selection) => selection.card === entry.card) &&
      !(hasDiscardEnergySelectionLimit(max) && selectionsRef.current.length >= max);
  };
  const confirmAction = <TableConfirmAction onCancel={allowCancel ? () => submitResult(null) : undefined}
    cancelDisabled={disabled} disabled={disabled || isInvalid} onClick={onConfirm}>{t('BUTTON_OK')}</TableConfirmAction>;
  const onBoard = useBoardEffectInteraction(boardInteraction, {
    id: `energy-discard-${prompt.id}`, kind: 'energy-discard', title, message: gameMessageText(t, prompt.message),
    progress: selectionCountLabel, disabled, getScanUrl, focusedTarget: selectedSource && mapTarget(selectedSource),
    targets: rows.flatMap((row) => row.items).filter((item) => !!item.cardList.getPokemonCard()).map((item) => ({
      target: mapTarget(item.target), name: displayPokemonCard(item)?.name ?? '',
      selected: !!selectedSource && targetsEqual(selectedSource, item.target),
      disabled: disabled || !canSelectDiscardSource(item, blockedFrom ?? [], prompt.filter, blockedMap ?? [], []),
    })),
    chips: energyEntries.map((entry) => {
      const selected = selections.some((selection) => selection.card === entry.card && targetsEqual(selection.from, entry.from));
      return { id: entry.id, label: entry.card.name, card: entry.card, source: mapTarget(entry.from), selected,
        disabled: disabled || (atMaxSelections && !selected) };
    }),
    onTarget: (visualTarget) => {
      if (frozen()) return;
      const item = findItemByTarget(rows, mapTarget(visualTarget));
      if (item && canSelectDiscardSource(item, blockedFrom ?? [], prompt.filter, blockedMap ?? [], [])) setSelectedSource(item.target);
    },
    onChip: (id) => {
      const entry = energyEntries.find((entry) => entry.id === id);
      if (entry) toggleEnergy(entry.card, entry.from);
    },
    canDrop, onDrop: (id, destination) => {
      if (!canDrop(id, destination)) return;
      const entry = energyEntries.find((entry) => entry.id === id)!;
      toggleEnergy(entry.card, entry.from);
    },
    onReset: reset,
  });
  if (onBoard) return confirmAction;

  return (
    <div className={s.backdrop} role="presentation">
      <div className={s.panel} role="dialog" aria-modal="true">
        <div className={s.promptTitle}>
          <h2 className={s.title}>{title}</h2>
        </div>

        <div className={s.promptContent}>
          <p className={s.message}>{gameMessageText(t, prompt.message)}</p>

          <div className={s.pokemonPane}>
            {rows.map((row, rowIdx) => (
              <div
                key={`${row.playerType}-${row.items[0]?.target.slot ?? 's'}-${rowIdx}`}
                className={cn(
                  s.pokemonRow,
                  row.playerType === PlayerType.TOP_PLAYER && s.pokemonRowUpsideDown,
                )}
              >
                {row.items.map((item) => {
                  const empty = item.cardList.cards.length === 0;
                  const card = displayPokemonCard(item);
                  const src = !empty && card ? getScanUrl(card) : '';
                  const isSource =
                    selectedSource !== undefined && targetsEqual(item.target, selectedSource);
                  const sourceDisabled =
                    disabled || empty ||
                    !canSelectDiscardSource(
                      item,
                      blockedFrom ?? [],
                      prompt.filter,
                      blockedMap ?? [],
                      selections,
                    );
                  return (
                    <div key={`${item.target.player}-${item.target.slot}-${item.target.index}`} className={s.pokeCardWrap}>
                      <button
                        type="button"
                        className={cn(
                          s.sourceButton,
                          isSource && s.sourceSelected,
                          sourceDisabled && s.sourceButtonDisabled,
                        )}
                        disabled={sourceDisabled}
                        onClick={() => onSelectSource(item)}
                        aria-pressed={isSource}
                      >
                        <div className={cn(s.slotInner, s.cardPrompt)}>
                          {empty ? (
                            <div className={s.emptySlot} />
                          ) : (
                            <CardFace card={card ?? null} src={src} name={card?.name ?? ''} />
                          )}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className={s.energyViewport}>
            {selectedItem ? (
              availableEnergyCards.length > 0 ? (
                <div className={s.energyList}>
                  {availableEnergyCards.map((card) => {
                    const selected = selections.some(
                      (s) =>
                        s.card === card &&
                        selectedSource !== undefined &&
                        targetsEqual(s.from, selectedSource),
                    );
                    return (
                      <button
                        key={`${card.fullName}-${card.id ?? card.name}`}
                        type="button"
                        className={cn(
                          s.cardPrompt,
                          s.energySelectable,
                          selected && s.energySelected,
                          atMaxSelections && !selected && s.energySelectableDisabled,
                        )}
                        disabled={disabled || (atMaxSelections && !selected)}
                        onClick={() => onToggleEnergy(card)}
                        aria-pressed={selected}
                      >
                        <CardFace card={card} src={getScanUrl(card)} name={card.name} />
                        <span
                          className={s.energyGem}
                          style={{ ['--gem' as string]: energyGemVar(card) }}
                          aria-hidden="true"
                        />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className={s.energyHint}>
                  {t('REACT_DISCARD_ENERGY_NONE_ON_POKEMON', {
                    defaultValue: 'No eligible energy cards on this Pokémon.',
                  })}
                </p>
              )
            ) : (
              <p className={s.energyHint}>
                {t('REACT_DISCARD_ENERGY_SELECT_SOURCE', {
                  defaultValue: 'Select a Pokémon to discard energy from.',
                })}
              </p>
            )}
          </div>

          <div className={s.selectedPane}>
            <h3 className={s.selectedHeading}>
              {t('REACT_DISCARD_ENERGY_SELECTED', { defaultValue: 'Selected energy' })}
              {' '}
              <span
                className={cn(
                  s.selectionCount,
                  isInvalid && selections.length > 0 && s.selectionCountInvalid,
                )}
              >
                ({selectionCountLabel})
              </span>
            </h3>
            {selections.length > 0 ? (
              <div className={s.selectedList}>
                {selections.map((selection) => (
                  <button
                    key={`${selection.from.player}-${selection.from.slot}-${selection.from.index}-${selection.card.fullName}`}
                    type="button"
                    className={cn(s.cardPrompt, s.selectedCard)}
                    disabled={disabled}
                    onClick={() => onRemoveSelection(selection)}
                    title={t('REACT_DISCARD_ENERGY_REMOVE', { defaultValue: 'Remove' })}
                  >
                    <CardFace
                      card={selection.card}
                      src={getScanUrl(selection.card)}
                      name={selection.card.name}
                    />
                    <span
                      className={s.energyGem}
                      style={{ ['--gem' as string]: energyGemVar(selection.card) }}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <p className={s.selectedEmpty}>
                {t('REACT_DISCARD_ENERGY_NONE_SELECTED', {
                  defaultValue: 'No energy selected.',
                })}
              </p>
            )}
          </div>
        </div>

        <div className={s.promptActions}>
          <ShellButton type="button" variant="secondary" onClick={reset} disabled={disabled || selections.length === 0}>
            {t('PROMPT_RESET', { defaultValue: 'Reset' })}
          </ShellButton>
          <div className={s.actionsGrow} aria-hidden />
          {confirmAction}
        </div>
      </div>
    </div>
  );
}
