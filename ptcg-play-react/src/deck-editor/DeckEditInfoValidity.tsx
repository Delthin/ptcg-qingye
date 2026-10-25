import { useMemo } from 'react';
import type { Card, PokemonCard } from 'ptcg-server';
import { SuperType, CardTag, Stage } from 'ptcg-server';
import { isBasicEnergy } from './deckRules';
import { cardDisplayName } from '../duo/chineseCatalog';
import type { DeckSlot } from './types';
import styles from './DeckEditInfoValidity.module.css';

export type DeckEditInfoValidityProps = { slots: DeckSlot[]; allCards: Card[]; onSave?: () => void; saving?: boolean; disabled?: boolean; savedIsValid?: boolean; dirty?: boolean };
export function DeckEditInfoValidity({ slots, onSave, saving = false, disabled = false, savedIsValid, dirty = false }: DeckEditInfoValidityProps) {
  const counts = useMemo(() => ({
    total: slots.reduce((sum, slot) => sum + slot.count, 0),
    pokemon: slots.filter(slot => slot.card.superType === SuperType.POKEMON).reduce((sum, slot) => sum + slot.count, 0),
    trainer: slots.filter(slot => slot.card.superType === SuperType.TRAINER).reduce((sum, slot) => sum + slot.count, 0),
    energy: slots.filter(slot => slot.card.superType === SuperType.ENERGY).reduce((sum, slot) => sum + slot.count, 0),
  }), [slots]);
  const validation = useMemo(() => {
    if (counts.total !== 60) return { ok: false, text: counts.total < 60 ? `还差 ${60 - counts.total} 张卡牌` : `需要移除 ${counts.total - 60} 张卡牌` };
    const sameNames = new Map<string, number>();
    for (const slot of slots) {
      if (isBasicEnergy(slot.card)) continue;
      const count = (sameNames.get(slot.card.name) ?? 0) + slot.count;
      sameNames.set(slot.card.name, count);
      if (count > 4) return { ok: false, text: `${cardDisplayName(slot.card)} 同名卡超过 4 张` };
    }
    const ace = slots.filter(slot => slot.card.tags.includes(CardTag.ACE_SPEC)).reduce((sum, slot) => sum + slot.count, 0);
    if (ace > 1) return { ok: false, text: 'ACE SPEC 卡牌合计只能放 1 张' };
    if (!slots.some(slot => slot.card.superType === SuperType.POKEMON && (slot.card as PokemonCard).stage === Stage.BASIC)) return { ok: false, text: '至少需要 1 张基础宝可梦' };
    // CardsInfo is plain JSON. Do not run instanceof-based DeckAnalyser here.
    // Only a saved server response confirms full deck legality, including special rules.
    if (!dirty && savedIsValid !== undefined) return { ok: savedIsValid, text: savedIsValid ? '60 张完整 · 可自由对战' : '服务端校验未通过 · 可继续编辑' };
    return { ok: false, text: dirty ? '基础构筑完整 · 保存后由服务端校验' : '已保存 · 合法性待核对' };
  }, [slots, counts.total, savedIsValid, dirty]);
  return <footer className={styles.bar}><div className={styles.summary}><div className={styles.formats}><span role="status" className={validation.ok ? styles.chip : styles.chipMuted}>{validation.text}</span></div></div>{onSave && <button type="button" className={styles.mobileSave} onClick={onSave} disabled={disabled || saving}>{saving ? '保存中…' : '保存卡组'}</button>}</footer>;
}
