import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Card, CardList, EnergyCard, Player, PokemonCard, TrainerCard } from 'ptcg-server';
import { BoardEffect, CardType, CardTag, EnergyType, getPokemonCardTypes, PokemonCardList, PowerType, SuperType, TrainerType } from 'ptcg-server';
import { CardSwapDialog } from './CardSwapDialog';
import { EnergyTypeIcon } from './EnergyTypeIcon';
import { isFavoriteCard, toggleFavoriteCard } from './favoriteCardsStorage';
import { getCardRuleText, getGroupedAlternativePrintings, getComputedHp, getCurrentHp, getDisplayAttacks,
  getDisplayPowers, getDisplayRuleBoxes, getInPlayTransformCopy, isToolCardInList, powerTypeLabel,
  stageLabel, formatCardText, CARD_INFO_ENERGY_ICON_SIZE } from './cardInfoUtils';
import { hasBothDualLegendHalvesInHand } from '../table/board3d/dual-legend.utils';
import { useOptionalSettings } from '../context/SettingsContext';
import { HoverHighlight } from './HoverHighlight';
import { CardInfoImageColumn } from './CardInfoImageColumn';
import { TrainerTypeStrip } from './TrainerTypeStrip';
import { cardDisplayName, chineseCard, chineseName, displayAttack, displayPower, isChineseCard } from '../duo/chineseCatalog';
import styles from './CardInfoPane.module.css';

export type CardInfoPaneOptions = {
  enableAttack?: boolean; enableTrainer?: boolean; enableRetreat?: boolean;
  attackBlockReasons?: Record<string, string>;
  enableAbility?: { useWhenInPlay?: boolean; useFromHand?: boolean; useFromDiscard?: boolean };
};
export type CardInfoTableAction = { card: Card; attack?: string; ability?: string; trainer?: boolean; retreat?: boolean };
export type CardInfoPaneProps = {
  card: Card; cardList?: CardList; players?: Player[]; facedown: boolean; catalog: Card[];
  getScanUrl: (card: Card) => string; isInGame: boolean; options?: CardInfoPaneOptions;
  showTags?: boolean; cardTextKerning?: number;
  onCardSwap?: (event: { originalCard: Card; replacementCard: Card }) => void;
  onTableAction?: (action: CardInfoTableAction) => void;
  omitScanColumn?: boolean; swapOpen?: boolean; onSwapOpenChange?: (open: boolean) => void;
};

/** Localized presentation only. Card/fullName and attack/ability IDs remain untouched. */
export function CardInfoPane({ card, cardList, players, facedown, catalog, getScanUrl, isInGame,
  options = {}, showTags = false, cardTextKerning = 0, onCardSwap, onTableAction, omitScanColumn = false,
  swapOpen: externalSwap, onSwapOpenChange }: CardInfoPaneProps) {
  const { t } = useTranslation();
  const settings = useOptionalSettings();
  const [localSwap, setLocalSwap] = useState(false);
  const [, favoriteRevision] = useState(0);
  const swapOpen = omitScanColumn ? externalSwap ?? false : localSwap;
  const setSwap = (open: boolean) => omitScanColumn ? onSwapOpenChange?.(open) : setLocalSwap(open);
  const alternatives = useMemo(() => getGroupedAlternativePrintings(
    chineseCard(card) ? catalog.filter(isChineseCard) : catalog, card), [catalog, card]);
  const powers = useMemo(() => getDisplayPowers(card, cardList, players), [card, cardList, players]);
  const attacks = useMemo(() => getDisplayAttacks(card, cardList, players), [card, cardList, players]);
  const transform = useMemo(() => getInPlayTransformCopy(card, cardList, players), [card, cardList, players]);
  const viewCard = transform ?? card;
  const meta = chineseCard(viewCard);
  const pokemon = viewCard as PokemonCard;
  const energy = card as EnergyCard;
  const trainer = card as TrainerCard;
  const isPokemon = card.superType === SuperType.POKEMON;
  const abilityUsed = cardList instanceof PokemonCardList && cardList.boardEffect.includes(BoardEffect.ABILITY_USED);
  const canAttack = !!options.enableAttack && !isToolCardInList(card, cardList);
  const kerning = { letterSpacing: `${settings?.cardTextKerning ?? cardTextKerning}px` };
  const formatted = (text: string) => formatCardText(text, CARD_INFO_ENERGY_ICON_SIZE);
  function canUsePower(power: (typeof powers)[number]): boolean {
    const enable = options.enableAbility;
    if (!enable) return false;
    const allowed = !!(enable.useWhenInPlay && power.useWhenInPlay && !abilityUsed) ||
      !!(enable.useFromDiscard && power.useFromDiscard) || !!(enable.useFromHand && power.useFromHand);
    if (allowed && enable.useFromHand && power.useFromHand && power.powerType === PowerType.LEGEND_ASSEMBLY && card.tags.includes(CardTag.DUAL_LEGEND)) {
      return hasBothDualLegendHalvesInHand(cardList?.cards ?? [], card);
    }
    return allowed;
  }
  const ruleText = meta?.text ?? getCardRuleText(viewCard);
  const ruleBoxes = meta ? (isPokemon && meta.text ? [{ name: '卡牌规则', text: meta.text, isRuleBox: true }] : []) : getDisplayRuleBoxes(card, cardList);
  function trainerLabel(): string {
    if (trainer.trainerType === TrainerType.SUPPORTER) return t('CARDS_SUPPORTER');
    if (trainer.trainerType === TrainerType.STADIUM) return t('CARDS_STADIUM');
    if (trainer.trainerType === TrainerType.TOOL) return t('CARDS_POKEMON_TOOL');
    return t('CARDS_ITEM');
  }
  return <div className={omitScanColumn ? styles.paneEmbed : styles.pane} data-in-game={isInGame || undefined}>
    {!omitScanColumn && <CardInfoImageColumn card={card} catalog={catalog.filter(isChineseCard)} facedown={facedown}
      getScanUrl={getScanUrl} isInGame={isInGame} onSwapClick={() => setSwap(true)} />}
    <div className={styles.textCol}>
      <div className={styles.title}>
        <span>{facedown ? t('CARDS_UNKNOWN') : cardDisplayName(viewCard)}</span>
        {!facedown && <><span className={styles.subtitleSetCode}>{meta?.set ?? card.set} {meta?.number ?? card.setNumber}</span>
          <span className={styles.regulationMark}>{meta?.regulationMark ?? card.regulationMark}</span>
          {isPokemon && <div className={styles.subtitleHpRow}><span className={styles.subtitleHpUnit}>HP</span>
            <span className={styles.subtitleHpValue}>{getCurrentHp(card, cardList, players) ?? '—'}/{getComputedHp(card, cardList, players) ?? '—'}</span>
            {getPokemonCardTypes(pokemon).map(type => <EnergyTypeIcon key={type} type={type} size="compact" />)}</div>}
        </>}
      </div>
      {facedown ? <div className={styles.power}><p className={styles.cardText}>{t('CARDS_FACE_DOWN_HINT')}</p></div> : <>
        <div className={styles.subtitle}>
          <span className={styles.subtitleStage}>{isPokemon ? stageLabel(pokemon) : card.superType === SuperType.ENERGY ?
            t(energy.energyType === EnergyType.BASIC ? 'CARDS_BASIC_ENERGY' : 'CARDS_SPECIAL_ENERGY') : trainerLabel()}</span>
          {isPokemon && pokemon.evolvesFrom && <span className={styles.subtitleSetCode}>{t('CARDS_EVOLVES_FROM', { name: chineseName(pokemon.evolvesFrom) })}</span>}
          {card.superType === SuperType.TRAINER && <TrainerTypeStrip type={trainer.trainerType} className={styles.trainerStripCompact} />}
          <div className={styles.spacer} />
          {!isInGame && <button className={styles.favoriteButton} title={t(isFavoriteCard(card) ? 'FAVORITE_REMOVE' : 'FAVORITE_ADD')}
            onClick={() => { toggleFavoriteCard(card); favoriteRevision(value => value + 1); }}>{isFavoriteCard(card) ? '★' : '☆'}</button>}
        </div>
        {powers.map(power => {
          const label = displayPower(viewCard, power);
          const enabled = canUsePower(power);
          return <HoverHighlight key={power.name} kind={isInGame ? 'ability' : undefined} label={`使用特性：${label.name}`} enabled={enabled} onClick={enabled && onTableAction ? () => onTableAction({ card, ability: power.name }) : undefined}>
            <div className={styles.power}><div className={styles.powerHeader}><div className={styles.powerType}><span className={styles.ability}>{powerTypeLabel(power.powerType)}</span></div><div className={styles.powerName}>{label.name}</div></div>
              <div className={styles.cardText} style={kerning} dangerouslySetInnerHTML={{ __html: formatted(label.text) }} /></div>
          </HoverHighlight>;
        })}
        {attacks.map(attack => {
          const label = displayAttack(viewCard, attack);
          const blocked = options.attackBlockReasons?.[attack.name];
          const enabled = canAttack && !blocked;
          return <HoverHighlight key={attack.name} kind={isInGame ? 'attack' : undefined} label={`使用招式：${label.name}${blocked ? `，${blocked}` : ''}`} enabled={enabled} onClick={enabled && onTableAction ? () => onTableAction({ card, attack: attack.name }) : undefined}>
            <div className={styles.attack}><div className={styles.attackHeader}>
              <div className={styles.attackCost}>{attack.cost.length ? attack.cost.map((cost, index) => <EnergyTypeIcon key={index} type={cost} size="compact" />) : <EnergyTypeIcon type={CardType.NONE} size="compact" />}</div>
              <div className={styles.attackName}>{label.name}</div><div className={styles.spacer} />{label.damage && <div className={styles.attackDamage}>{label.damage}</div>}
            </div><div className={styles.cardText} style={kerning} dangerouslySetInnerHTML={{ __html: formatted(label.text) }} />
              {blocked ? <p className={styles.actionReason}>{blocked}</p> : null}
            </div>
          </HoverHighlight>;
        })}
        {isPokemon && <div className={styles.subtitle}>
          <span className={styles.subtitleSetCode}>{t('CARDS_WEAKNESS')}</span>{pokemon.weakness.map((weakness, index) => <EnergyTypeIcon key={index} type={weakness.type} size="compact" />)}
          <span className={styles.subtitleSetCode}>{t('CARDS_RESISTANCE')}</span>{pokemon.resistance.map((resistance, index) => <EnergyTypeIcon key={index} type={resistance.type} size="compact" />)}
          <div className={styles.spacer} /><HoverHighlight kind={isInGame ? 'retreat' : undefined} label="撤退" enabled={!!options.enableRetreat} onClick={options.enableRetreat && onTableAction ? () => onTableAction({ card, retreat: true }) : undefined}>
            <span className={styles.subtitleSetCode}>{t('CARDS_RETREAT_COST')}</span>{pokemon.retreat.map((cost, index) => <EnergyTypeIcon key={index} type={cost} size="compact" />)}
          </HoverHighlight>
        </div>}
        {!isPokemon && ruleText && <HoverHighlight kind={isInGame ? 'trainer' : undefined} label="使用卡牌效果" enabled={!!options.enableTrainer} onClick={options.enableTrainer && onTableAction ? () => onTableAction({ card, trainer: true }) : undefined}>
          <div className={styles.power}><div className={styles.cardText} style={kerning} dangerouslySetInnerHTML={{ __html: formatted(ruleText) }} /></div>
        </HoverHighlight>}
        {ruleBoxes.map((box, index) => <div className={styles.power} key={index}><div className={styles.powerHeader}><div className={styles.powerName}>{meta ? '卡牌规则' : box.name}</div></div>
          <div className={styles.cardText} style={kerning} dangerouslySetInnerHTML={{ __html: formatted(box.text ?? '') }} /></div>)}
        {(settings?.showTags ?? showTags) && card.tags.length > 0 && <div className={styles.subtitle}>{card.tags.join(' · ')}</div>}
      </>}
    </div>
    <CardSwapDialog open={swapOpen} onClose={() => setSwap(false)} currentCard={card} groupedAlternatives={alternatives} getScanUrl={getScanUrl}
      onSelect={replacementCard => { setSwap(false); onCardSwap?.({ originalCard: card, replacementCard }); }} />
  </div>;
}
