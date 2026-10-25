import type { CardTarget, DamageMap, MoveDamagePrompt, PutDamagePrompt, RemoveDamagePrompt } from 'ptcg-server';
import { buildDamageTransfers, computeNetPendingDamageRemoved, findItemByTarget, patchDamageForTarget, targetsEqual } from './removeDamagePromptModel';
import { buildPutDamageResult, computeNetDamagePlaced } from './putDamagePromptModel';
import type { PokemonRow } from './pokemonPromptRows';

export type BoardDamagePrompt = PutDamagePrompt | MoveDamagePrompt | RemoveDamagePrompt;
export function isPutDamage(prompt: BoardDamagePrompt): prompt is PutDamagePrompt {
  return 'damage' in prompt;
}
export function damageStep(prompt: BoardDamagePrompt): number {
  return 'damageMultiple' in prompt.options ? prompt.options.damageMultiple ?? 10 : 10;
}
function originalDamage(initial: DamageMap[], target: CardTarget): number {
  return initial.find(item => targetsEqual(item.target, target))?.damage ?? 0;
}
function shapeValid(prompt: BoardDamagePrompt, rows: PokemonRow[], initial: DamageMap[]): boolean {
  if (isPutDamage(prompt)) {
    const max = 'maxTargets' in prompt.options ? prompt.options.maxTargets : undefined;
    return max === undefined || (typeof max === 'number' && Number.isSafeInteger(max) && max > 0
      && buildPutDamageResult(rows, initial).length <= max);
  }
  const options = prompt.options;
  const oneSource = 'sameSource' in options ? options.sameSource : options.singleSourceTarget;
  const oneTarget = 'sameTarget' in options ? options.sameTarget : options.singleDestinationTarget;
  let sources = 0, destinations = 0;
  for (const item of rows.flatMap(row => row.items)) {
    const delta = item.cardList.damage - originalDamage(initial, item.target);
    if (delta < 0) sources++;
    if (delta > 0) destinations++;
  }
  return (!oneSource || sources <= 1) && (!oneTarget || destinations <= 1);
}

/** Each press and drop rechecks the current immutable draft, not just a disabled button. */
export function canAdjustDamage(prompt: BoardDamagePrompt, rows: PokemonRow[], initial: DamageMap[], target: CardTarget, direction: -1 | 1): boolean {
  const item = findItemByTarget(rows, target);
  const step = damageStep(prompt);
  if (!item?.cardList.cards.length || !Number.isFinite(step) || step <= 0) return false;
  const current = item.cardList.damage;
  const original = originalDamage(initial, target);
  const cap = prompt.maxAllowedDamage.find(entry => targetsEqual(entry.target, target))?.damage;
  if (isPutDamage(prompt)) {
    if (prompt.options.blocked.some(blocked => targetsEqual(blocked, target))) return false;
    const allowed = direction < 0 ? current - step >= original :
      computeNetDamagePlaced(rows, initial) + step <= prompt.damage && (cap === undefined || current + step <= cap);
    return allowed && shapeValid(prompt, patchDamageForTarget(rows, target, direction * step), initial);
  }
  const pending = computeNetPendingDamageRemoved(rows, initial);
  if (direction < 0) {
    if (current < step) return false;
    const blocked = prompt.options.blockedFrom.some(entry => targetsEqual(entry, target));
    // Returning a counter placed during this draft is undo, not taking original damage.
    if (blocked && current - step < original) return false;
    const used = buildDamageTransfers(rows, initial, step).length + pending / step;
    if (prompt.options.max !== undefined && used >= prompt.options.max && current <= original) return false;
  } else {
    if (pending < step || (current + step > original && cap !== undefined && current + step > cap)) return false;
    if (prompt.options.blockedTo.some(entry => targetsEqual(entry, target)) && current + step > original) return false;
  }
  return shapeValid(prompt, patchDamageForTarget(rows, target, direction * step), initial);
}

export function adjustDamageDraft(prompt: BoardDamagePrompt, rows: PokemonRow[], initial: DamageMap[], target: CardTarget, direction: -1 | 1): PokemonRow[] {
  return canAdjustDamage(prompt, rows, initial, target, direction) ? patchDamageForTarget(rows, target, direction * damageStep(prompt)) : rows;
}

/** A physical transfer is atomic: an invalid destination never takes a source counter. */
export function transferDamageDraft(prompt: BoardDamagePrompt, rows: PokemonRow[], initial: DamageMap[], from: CardTarget, to: CardTarget): PokemonRow[] {
  if (isPutDamage(prompt) || targetsEqual(from, to)) return rows;
  const removed = adjustDamageDraft(prompt, rows, initial, from, -1);
  if (removed === rows) return rows;
  const added = adjustDamageDraft(prompt, removed, initial, to, 1);
  return added === removed ? rows : added;
}

export function damageDraftResult(prompt: BoardDamagePrompt, rows: PokemonRow[], initial: DamageMap[]) {
  return isPutDamage(prompt) ? buildPutDamageResult(rows, initial) : buildDamageTransfers(rows, initial, damageStep(prompt));
}

export function damageTransferGoal(prompt: BoardDamagePrompt, rows: PokemonRow[], initial: DamageMap[]): number | undefined {
  if (isPutDamage(prompt)) return undefined;
  const fixed = 'fixedSourceCounters' in prompt.options ? prompt.options.fixedSourceCounters : undefined;
  if (fixed === undefined) return prompt.options.max;
  if (typeof fixed !== 'number' || !Number.isSafeInteger(fixed) || fixed < 1) return undefined;
  const source = rows.flatMap(row => row.items).find(item => item.cardList.damage < originalDamage(initial, item.target));
  return source ? Math.min(fixed, Math.floor(originalDamage(initial, source.target) / damageStep(prompt))) : fixed;
}

export function isDamageDraftValid(prompt: BoardDamagePrompt, rows: PokemonRow[], initial: DamageMap[]): boolean {
  if (!rows.length || !shapeValid(prompt, rows, initial)) return false;
  if (isPutDamage(prompt)) {
    const remaining = prompt.damage - computeNetDamagePlaced(rows, initial);
    return remaining >= 0 && (remaining === 0 || !!prompt.options.allowPlacePartialDamage);
  }
  if (computeNetPendingDamageRemoved(rows, initial) !== 0) return false;
  const transfers = buildDamageTransfers(rows, initial, damageStep(prompt));
  if (transfers.length < prompt.options.min || (prompt.options.max !== undefined && transfers.length > prompt.options.max)) return false;
  if ('fixedSourceCounters' in prompt.options && prompt.options.fixedSourceCounters !== undefined) {
    if (transfers.length === 0 || transfers.length !== damageTransferGoal(prompt, rows, initial)
      || transfers.some(transfer => !targetsEqual(transfer.from, transfers[0].from))) return false;
  }
  return transfers.every(transfer => !prompt.options.blockedFrom.some(target => targetsEqual(target, transfer.from)) &&
    !prompt.options.blockedTo.some(target => targetsEqual(target, transfer.to)));
}
