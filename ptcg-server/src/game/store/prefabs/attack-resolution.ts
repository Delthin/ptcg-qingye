import { PokemonCard } from '../card/pokemon-card';
import { DealDamageEffect } from '../effects/attack-effects';
import { Effect } from '../effects/effect';
import { AttackEffect } from '../effects/game-effects';
import { AfterAttackEffect, BeforeDoingDamageEffect } from '../effects/game-phase-effects';
import { State } from '../state/state';
import { StoreLike } from '../store-like';

/** Store propagates through these zones, but a remembered attack's card can have left them. */
function reduceAttackPhase(store: StoreLike, state: State, effect: Effect, sourceCard?: PokemonCard): State {
  const propagated = sourceCard === undefined || state.players.some(player => [
    player.stadium, player.supporter, player.active, ...player.bench,
    ...player.prizes, player.hand, player.deck, player.discard,
  ].some(list => list.cards.includes(sourceCard)));
  state = store.reduceEffect(state, effect);
  if (!propagated && sourceCard && !effect.preventDefault) {
    state = sourceCard.reduceEffect(store, state, effect);
  }
  return state;
}

/**
 * Finish an already prepared attack. No cost/status checks, KO check or EndTurn belongs here.
 * A01: damage -> non-damage attack effects (including legacy AfterAttack handlers) -> reactions.
 * Standalone damage Effect APIs remain immediate unless explicitly given a managed queue.
 */
export function* RESOLVE_ATTACK_DAMAGE(
  next: () => void, store: StoreLike, state: State, effect: AttackEffect,
  flushReactions = true, sourceCard?: PokemonCard,
): IterableIterator<State> {
  state = reduceAttackPhase(store, state, new BeforeDoingDamageEffect(effect), sourceCard);
  if (store.hasPrompts()) yield store.waitPrompt(state, next);

  if (effect.damage > 0) {
    state = store.reduceEffect(state, new DealDamageEffect(effect, effect.damage));
    if (store.hasPrompts()) yield store.waitPrompt(state, next);
  }

  // Self-damage must not change the HP used to calculate the main hit (Panic Mask FAQ).
  // It is still damage in step 4, not an AfterAttack/non-damage effect in step 5.
  while (effect.additionalDamageEffects.length > 0) {
    state = effect.additionalDamageEffects.shift()!(state);
    if (store.hasPrompts()) yield store.waitPrompt(state, next);
  }

  while (effect.afterDamageEffects.length > 0) {
    state = effect.afterDamageEffects.shift()!(state);
    if (store.hasPrompts()) yield store.waitPrompt(state, next);
  }

  state = reduceAttackPhase(store, state,
    new AfterAttackEffect(effect.player, effect.opponent, effect.attack), sourceCard);
  if (store.hasPrompts()) yield store.waitPrompt(state, next);

  if (flushReactions) {
    const reactions = effect.pendingDamageReactions || [];
    // Damage caused by a reaction is not part of the original attack's effect phase.
    effect.pendingDamageReactions = undefined;
    while (reactions.length > 0) {
      state = store.reduceEffect(state, reactions.shift()!);
      if (store.hasPrompts()) yield store.waitPrompt(state, next);
    }
  }
  return state;
}

/** Run the same stages for a copied attack without starting another turn/attack action. */
export function* RESOLVE_COPIED_ATTACK(
  next: () => void, store: StoreLike, state: State, parent: AttackEffect,
  copied: AttackEffect, sourceCard?: PokemonCard,
): IterableIterator<State> {
  copied.source = parent.source;
  const ownsReactions = parent.pendingDamageReactions === undefined;
  copied.pendingDamageReactions = parent.pendingDamageReactions || [];
  state = reduceAttackPhase(store, state, copied, sourceCard);
  if (store.hasPrompts()) yield store.waitPrompt(state, next);
  return yield* RESOLVE_ATTACK_DAMAGE(next, store, state, copied, ownsReactions, sourceCard);
}
