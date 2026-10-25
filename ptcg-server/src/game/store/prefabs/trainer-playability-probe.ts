import { TrainerCard } from '../card/trainer-card';
import { Card } from '../card/card';
import { getOverriddenReduceEffect } from '../card/card-effect-overrides';
import { TrainerType } from '../card/card-types';
import { PlayItemEffect, PlaySupporterEffect } from '../effects/play-card-effects';
import { Player } from '../state/player';
import { State } from '../state/state';
import { Store } from '../store';
import { StoreLike } from '../store-like';

// Keep prototypes and all graph aliases, but never share mutable Card instances.
// The general deepClone utility deliberately supports sharing Cards and uses the
// source object as a prototype, neither of which is suitable for a play probe.
function cloneProbeGraph<T>(source: T, references = new Map<object, any>()): T {
  if (source === null || typeof source !== 'object') return source;
  const object = source as unknown as object;
  if (references.has(object)) return references.get(object);

  let clone: any;
  if (source instanceof Date) {
    clone = new Date(source.getTime());
  } else if (source instanceof Map) {
    clone = new Map();
  } else if (source instanceof Set) {
    clone = new Set();
  } else {
    clone = Array.isArray(source) ? [] : Object.create(Object.getPrototypeOf(source));
  }
  references.set(object, clone);

  if (source instanceof Map) {
    source.forEach((value, key) => clone.set(cloneProbeGraph(key, references), cloneProbeGraph(value, references)));
  } else if (source instanceof Set) {
    source.forEach(value => clone.add(cloneProbeGraph(value, references)));
  } else {
    Object.keys(source).forEach(key => {
      clone[key] = cloneProbeGraph((source as any)[key], references);
    });
  }
  return clone;
}

/**
 * Compatibility check for implemented Items/Supporters without a pure canPlay.
 * Reuse real pre-prompt guards and format overrides on a disposable object graph.
 * Prompt callbacks are never answered; this is not a full effect/target oracle.
 */
export function probeTrainerPlayability(
  store: StoreLike, state: State, player: Player, trainerCard: TrainerCard,
): boolean {
  if (trainerCard.trainerType !== TrainerType.ITEM && trainerCard.trainerType !== TrainerType.SUPPORTER) {
    return false;
  }

  const handler = (store as any).handler;
  const snapshot = cloneProbeGraph({
    state, trainerCard,
    gameSettings: handler?.gameSettings ?? state.gameSettings,
    format: handler?.format,
  });
  const probePlayer = snapshot.state.players.find(p => p.id === player.id);
  if (!probePlayer) return false;
  if (snapshot.trainerCard.reduceEffect === Card.prototype.reduceEffect &&
    !getOverriddenReduceEffect(snapshot.trainerCard, snapshot.gameSettings.format)) {
    return false;
  }

  const probeHandler = {
    onStateChange: () => undefined,
    gameSettings: snapshot.gameSettings, format: snapshot.format,
  };
  const probeStore = new Store(probeHandler, false);
  probeStore.state = snapshot.state;
  const effect = trainerCard.trainerType === TrainerType.ITEM
    ? new PlayItemEffect(probePlayer, snapshot.trainerCard, probePlayer.active)
    : new PlaySupporterEffect(probePlayer, snapshot.trainerCard, probePlayer.active);

  try {
    probeStore.reduceEffect(snapshot.state, effect);
    return true;
  } catch {
    return false;
  } finally {
    probeStore.cleanup();
  }
}
