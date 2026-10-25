import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import type { TFunction } from 'i18next';
import type { Card, CardTarget, ChooseEnergyPrompt, EnergyMap } from 'ptcg-server';
import { PlayerType, SlotType, StateUtils } from 'ptcg-server';
import type { BoardInteractionService } from '../BoardInteractionService';
import { useBoardEffectInteraction, useBoardEffectSubmission } from '../useBoardEffectInteraction';
import { buildPokemonPromptRows } from './pokemonPromptRows';
import { getPromptPerspectivePlayerId, promptNeedsPerspectiveSwap, remapCardTargetSeat } from './promptPerspective';
import { targetsEqual } from './removeDamagePromptModel';
import type { LocalGameState } from '../types/localGameState';
import { CardFace } from '../../components/cards/CardFace';
import { CardInfoPopup } from '../../card-info/CardInfoPopup';
import { EnergyTypeIcon } from '../../card-info/EnergyTypeIcon';
import { TableConfirmAction } from '../hud/TablePrimaryAction';
import styles from './TablePromptLayer.module.css';

export type ChooseEnergyPromptPanelProps = {
  prompt: ChooseEnergyPrompt;
  localGame: LocalGameState;
  boardInteraction: BoardInteractionService;
  clientId: number;
  catalog: Card[];
  getScanUrl: (card: Card) => string;
  t: TFunction;
  gameMessageText: (t: TFunction, message: string | number) => string;
  resolve: (id: number, result: unknown) => void | Promise<void>;
};

export function ChooseEnergyPromptPanel(props: ChooseEnergyPromptPanelProps) {
  const { prompt, localGame, boardInteraction, clientId, catalog, getScanUrl, t, gameMessageText, resolve } = props;
  const { pending, submit } = useBoardEffectSubmission(prompt.id, resolve);
  const requestRef = useRef<{ promptId: number } | null>(null);
  const frozen = () => pending || !!localGame.deleted || !!localGame.replay || requestRef.current?.promptId === prompt.id;
  const submitResult = (result: unknown) => {
    if (frozen()) return;
    const request = { promptId: prompt.id };
    requestRef.current = request;
    return submit(result).finally(() => { if (requestRef.current === request) requestRef.current = null; });
  };
  const disabled = pending || !!localGame.deleted || !!localGame.replay;
  const mapTarget = (target: CardTarget) => promptNeedsPerspectiveSwap(prompt, clientId) ? remapCardTargetSeat(target) : target;
  const { allowCancel } = prompt.options;
  const cost = prompt.cost;
  const max = cost.length;
  const cards = useMemo(() => prompt.energy.map((e) => e.card), [prompt.energy]);

  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [detail, setDetail] = useState<Card | null>(null);
  const [focusedTarget, setFocusedTarget] = useState<CardTarget | undefined>();
  const selectedIndicesRef = useRef(selectedIndices);
  selectedIndicesRef.current = selectedIndices;

  useEffect(() => {
    setSelectedIndices([]);
    setDetail(null);
    setFocusedTarget(undefined);
  }, [prompt.id]);

  const selectedSet = useMemo(() => new Set(selectedIndices), [selectedIndices]);

  const isValid = useMemo(() => {
    const energy: EnergyMap[] = selectedIndices.map((i) => prompt.energy[i]);
    return StateUtils.checkExactEnergy(energy, cost);
  }, [selectedIndices, prompt.energy, cost]);

  const toggleUnit = (index: number) => {
    if (frozen() || !Number.isInteger(index) || !prompt.energy[index]) return;
    const previous = selectedIndicesRef.current;
    if (previous.includes(index)) selectedIndicesRef.current = previous.filter((i) => i !== index);
    else if (previous.length < max) selectedIndicesRef.current = [...previous, index];
    setSelectedIndices(selectedIndicesRef.current);
  };
  const toggleCard = (index: number, e: MouseEvent<HTMLButtonElement>) => {
    if (frozen()) return;
    const card = cards[index];
    if (e.shiftKey && card) { setDetail(card); return; }
    toggleUnit(index);
  };
  const removeSlot = (slotIndex: number) => {
    if (frozen()) return;
    selectedIndicesRef.current = selectedIndicesRef.current.filter((_, i) => i !== slotIndex);
    setSelectedIndices(selectedIndicesRef.current);
  };
  const onConfirm = () => {
    if (frozen() || !StateUtils.checkExactEnergy(selectedIndicesRef.current.map((i) => prompt.energy[i]), cost)) return;
    return submitResult([...selectedIndicesRef.current]);
  };

  const title = t('PROMPT_CHOOSE_ENERGY_TITLE', { defaultValue: 'Select Energy' });
  const pokemonItems = buildPokemonPromptRows(localGame.state, getPromptPerspectivePlayerId(prompt),
    PlayerType.ANY, [SlotType.ACTIVE, SlotType.BENCH]).flatMap((row) => row.items)
    .filter((item) => !!item.cardList.getPokemonCard());
  const sources = cards.map((card) => {
    const identity = pokemonItems.find((item) => item.cardList.energies.cards.includes(card) || item.cardList.cards.includes(card));
    if (identity) return identity.target;
    const matches = pokemonItems.filter((item) => item.cardList.cards.some((attached) =>
      card.id != null && attached.id === card.id && attached.fullName === card.fullName));
    return matches.length === 1 ? matches[0].target : undefined;
  });
  const confirmAction = <TableConfirmAction onCancel={allowCancel ? () => submitResult(null) : undefined}
    cancelDisabled={disabled} disabled={disabled || !isValid} onClick={onConfirm}>{t('BUTTON_OK')}</TableConfirmAction>;
  const onBoard = useBoardEffectInteraction(boardInteraction, {
    id: `energy-choose-${prompt.id}`, kind: 'energy-choose', title,
    message: gameMessageText(t, prompt.message), progress: `${selectedIndices.length}/${max}`, disabled, getScanUrl,
    focusedTarget: focusedTarget && mapTarget(focusedTarget),
    targets: pokemonItems.filter((item) => sources.some((source) => source && targetsEqual(source, item.target))).map((item) => ({
      target: mapTarget(item.target), name: item.cardList.getPokemonCard()?.name ?? '', disabled,
      selected: selectedIndices.some((i) => sources[i] && targetsEqual(sources[i], item.target)),
    })),
    // An energy map entry is a payable unit. DCE deliberately yields separate chips for the same physical card.
    chips: cards.map((card, index) => ({ id: `choose-energy-${index}`, label: `${card.name} · ${index + 1}`, card,
      source: sources[index] && mapTarget(sources[index]), selected: selectedSet.has(index),
      disabled: disabled || (!selectedSet.has(index) && selectedIndices.length >= max),
    })),
    onChip: (id) => { const match = /^choose-energy-(\d+)$/.exec(id); if (match) toggleUnit(Number(match[1])); },
    onTarget: (visualTarget) => {
      if (frozen()) return;
      const target = mapTarget(visualTarget);
      if (sources.some((source) => source && targetsEqual(source, target))) setFocusedTarget(target);
    },
    onReset: () => {
      if (frozen()) return;
      selectedIndicesRef.current = [];
      setSelectedIndices([]);
      setFocusedTarget(undefined);
    },
  });
  if (onBoard) return confirmAction;

  return (
    <>
      <div className={styles.backdrop} role="presentation">
        <div className={`${styles.panel} ${styles.panelWide}`} role="dialog" aria-modal="true">
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.message}>{gameMessageText(t, prompt.message)}</p>

          <p className={styles.chooseSelectionMeta}>
            {t('REACT_CHOOSE_ENERGY_COUNT', {
              defaultValue: 'Selected {{n}} / {{max}}',
              n: selectedIndices.length,
              max,
            })}
          </p>

          <div className={styles.chooseCardsGrid}>
            {cards.map((card, index) => {
              if (selectedSet.has(index)) {
                return null;
              }
              return (
                <button
                  key={`${index}-${card.id}-${card.fullName}`}
                  type="button"
                  className={styles.chooseCardBtn}
                  disabled={disabled || selectedIndices.length >= max}
                  onClick={(e) => toggleCard(index, e)}
                  title={t('REACT_CHOOSE_CARDS_CARD_HINT', {
                    defaultValue: '{{name}} — Shift+click for card info',
                    name: card.name,
                  })}
                >
                  <CardFace
                    card={card}
                    src={getScanUrl(card)}
                    name={card.name}
                    style={{ width: 100, height: 140 }}
                  />
                </button>
              );
            })}
          </div>

          <div
            className={styles.chooseEnergySlots}
            aria-label={t('REACT_CHOOSE_ENERGY_SLOTS', { defaultValue: 'Energy cost slots' })}
          >
            {cost.map((costType, slotIndex) => {
              const energyIndex = selectedIndices[slotIndex];
              const selectedCard = energyIndex !== undefined ? cards[energyIndex] : undefined;
              return (
                <button
                  key={`slot-${slotIndex}-${prompt.id}`}
                  type="button"
                  className={styles.chooseEnergySlot}
                  onClick={() => {
                    if (selectedCard) {
                      removeSlot(slotIndex);
                    }
                  }}
                  disabled={disabled || !selectedCard}
                  aria-label={
                    selectedCard
                      ? t('REACT_CHOOSE_ENERGY_SLOT_SELECTED', {
                          defaultValue: 'Selected {{name}}, click to remove',
                          name: selectedCard.name,
                        })
                      : t('REACT_CHOOSE_ENERGY_SLOT_EMPTY', { defaultValue: 'Empty slot' })
                  }
                >
                  {selectedCard ? (
                    <CardFace
                      card={selectedCard}
                      src={getScanUrl(selectedCard)}
                      name={selectedCard.name}
                      style={{ width: 87, height: 120 }}
                    />
                  ) : (
                    <EnergyTypeIcon type={costType} className={styles.chooseEnergySlotIcon} />
                  )}
                </button>
              );
            })}
          </div>

          <div className={styles.actions}>
            {confirmAction}
          </div>
        </div>
      </div>
      {detail ? (
        <CardInfoPopup
          card={detail}
          players={localGame.state.players}
          catalog={catalog}
          getScanUrl={getScanUrl}
          onClose={() => { if (!frozen()) setDetail(null); }}
          isInGame
        />
      ) : null}
    </>
  );
}
