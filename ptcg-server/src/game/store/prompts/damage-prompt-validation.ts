import { CardTarget, PlayerType, SlotType } from '../actions/play-card-action';
import { PokemonCardList } from '../state/pokemon-card-list';
import { State } from '../state/state';
import type { DamageMap, DamageTransfer } from './move-damage-prompt';

export function getDamagePromptTarget(state: State, playerId: number, value: unknown): PokemonCardList | undefined {
  if (value === null || typeof value !== 'object') return undefined;
  const target = value as Partial<CardTarget>;
  if (target.player !== PlayerType.TOP_PLAYER && target.player !== PlayerType.BOTTOM_PLAYER) return undefined;
  if (!Number.isSafeInteger(target.index) || target.index! < 0) return undefined;
  const perspective = state.players.find(player => player.id === playerId);
  if (perspective === undefined) return undefined;
  const owner = target.player === PlayerType.TOP_PLAYER
    ? state.players.find(player => player.id !== perspective.id) : perspective;
  if (owner === undefined) return undefined;
  let list: PokemonCardList | undefined;
  if (target.slot === SlotType.ACTIVE && target.index === 0) list = owner.active;
  else if (target.slot === SlotType.BENCH) list = owner.bench[target.index!];
  if (list === undefined || list.getPokemonCard() === undefined
    || !Number.isSafeInteger(list.damage) || list.damage < 0) return undefined;
  return list;
}

export function damageTargetsEqual(a: CardTarget, b: CardTarget): boolean {
  return a.player === b.player && a.slot === b.slot && a.index === b.index;
}

export function isDamageStep(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value % 10 === 0;
}

export function damageTargetCap(target: CardTarget, caps: DamageMap[]): number | undefined {
  const matches = caps.filter(entry => damageTargetsEqual(entry.target, target));
  if (matches.length === 0) return undefined;
  if (matches.some(entry => !Number.isSafeInteger(entry.damage) || entry.damage < 0)) return NaN;
  return Math.min(...matches.map(entry => entry.damage));
}

export interface DamageTransferValidation {
  playerType: PlayerType;
  slots: SlotType[];
  maxAllowedDamage: DamageMap[];
  allowCancel: boolean;
  min: number;
  max: number | undefined;
  blockedFrom: CardTarget[];
  blockedTo: CardTarget[];
  singleSourceTarget: boolean;
  singleDestinationTarget: boolean;
  damageMultiple?: number;
  fixedSourceCounters?: number;
}

export function validateDamageTransfers(
  state: State,
  playerId: number,
  result: unknown,
  options: DamageTransferValidation,
): boolean {
  if (result === null) return options.allowCancel;
  const step = options.damageMultiple === undefined ? 10 : options.damageMultiple;
  if (options.fixedSourceCounters !== undefined
    && (!Number.isSafeInteger(options.fixedSourceCounters) || options.fixedSourceCounters < 1)) return false;
  if (!Array.isArray(result) || !isDamageStep(step)
    || !Number.isSafeInteger(options.min) || options.min < 0
    || (options.max !== undefined && (!Number.isSafeInteger(options.max) || options.max < options.min))
    || result.length < options.min || (options.max !== undefined && result.length > options.max)
    || state.players.every(player => player.id !== playerId)) return false;

  const outgoing = new Map<PokemonCardList, number>();
  const incoming = new Map<PokemonCardList, number>();
  const destinationTargets = new Map<PokemonCardList, CardTarget>();
  for (const entry of result) {
    if (entry === null || typeof entry !== 'object') return false;
    const transfer = entry as Partial<DamageTransfer>;
    const from = getDamagePromptTarget(state, playerId, transfer.from);
    const to = getDamagePromptTarget(state, playerId, transfer.to);
    if (from === undefined || to === undefined || from === to) return false;
    const fromTarget = transfer.from!;
    const toTarget = transfer.to!;
    if ((options.playerType !== PlayerType.ANY
      && (fromTarget.player !== options.playerType || toTarget.player !== options.playerType))
      || !options.slots.includes(fromTarget.slot) || !options.slots.includes(toTarget.slot)
      || options.blockedFrom.some(target => damageTargetsEqual(target, fromTarget))
      || options.blockedTo.some(target => damageTargetsEqual(target, toTarget))) return false;
    outgoing.set(from, (outgoing.get(from) || 0) + step);
    incoming.set(to, (incoming.get(to) || 0) + step);
    destinationTargets.set(to, toTarget);
  }
  if ((options.singleSourceTarget && outgoing.size > 1)
    || (options.singleDestinationTarget && incoming.size > 1)) return false;
  if (options.fixedSourceCounters !== undefined) {
    if (outgoing.size !== 1) return false;
    const [source, amount] = Array.from(outgoing.entries())[0];
    if (amount !== Math.min(options.fixedSourceCounters, Math.floor(source.damage / step)) * step) return false;
  }
  // A result can only move counters that existed when the prompt was answered.
  for (const [source, amount] of outgoing) {
    if (!Number.isSafeInteger(amount) || amount > source.damage) return false;
  }
  for (const [target, amount] of incoming) {
    const finalDamage = target.damage + amount - (outgoing.get(target) || 0);
    const cap = damageTargetCap(destinationTargets.get(target)!, options.maxAllowedDamage);
    if (!Number.isSafeInteger(finalDamage) || finalDamage < 0
      || (cap !== undefined && (!Number.isFinite(cap) || finalDamage > cap))) return false;
  }
  return true;
}
