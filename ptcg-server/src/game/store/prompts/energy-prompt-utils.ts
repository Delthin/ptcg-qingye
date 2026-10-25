import { CardTarget, PlayerType, SlotType } from '../actions/play-card-action';
import { Card } from '../card/card';
import { SuperType } from '../card/card-types';
import { PokemonCardList } from '../state/pokemon-card-list';
import { State } from '../state/state';
import { FilterType } from './choose-cards-prompt';

export function sameEnergyTarget(a: CardTarget, b: CardTarget): boolean {
  return a.player === b.player && a.slot === b.slot && a.index === b.index;
}

export function validEnergyTarget(target: CardTarget, playerType: PlayerType, slots: SlotType[],
  blocked: CardTarget[], perspectiveId: number, state?: State): boolean {
  if (!target || (target.player !== PlayerType.BOTTOM_PLAYER && target.player !== PlayerType.TOP_PLAYER)
    || (playerType !== PlayerType.ANY && target.player !== playerType)
    || !slots.includes(target.slot) || (target.slot !== SlotType.ACTIVE && target.slot !== SlotType.BENCH)
    || !Number.isInteger(target.index) || target.index < 0
    || (target.slot === SlotType.ACTIVE && target.index !== 0)
    || blocked.some(b => sameEnergyTarget(b, target))) {
    return false;
  }
  return state === undefined || energyTarget(state, perspectiveId, target)?.getPokemonCard() !== undefined;
}

export function energyTarget(state: State, perspectiveId: number, target: CardTarget): PokemonCardList | undefined {
  if (!state.players.some(p => p.id === perspectiveId)) return undefined;
  const player = state.players.find(p => target.player === PlayerType.BOTTOM_PLAYER
    ? p.id === perspectiveId : p.id !== perspectiveId);
  return target.slot === SlotType.ACTIVE ? player?.active : player?.bench[target.index];
}

export function validEnergySelection(card: Card, from: CardTarget, filter: FilterType,
  blockedMap: { source: CardTarget, blocked: number[] }[], perspectiveId: number, state?: State): boolean {
  if (!(card instanceof Card) || card.superType !== SuperType.ENERGY
    || !Object.keys(filter).every(key => (filter as any)[key] === (card as any)[key])) return false;
  if (state !== undefined) {
    const source = energyTarget(state, perspectiveId, from);
    const index = source?.cards.indexOf(card) ?? -1;
    if (index < 0 || blockedMap.some(b => sameEnergyTarget(b.source, from) && b.blocked.includes(index))) return false;
  }
  return true;
}
