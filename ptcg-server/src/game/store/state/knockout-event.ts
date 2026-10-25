import { CardTag, CardType } from '../card/card-types';
import { PokemonCard } from '../card/pokemon-card';
import { CheckHpEffect, CheckPokemonTypeEffect } from '../effects/check-effects';
import { AbstractAttackEffect } from '../effects/attack-effects';
import { KnockOutEffect } from '../effects/game-effects';
import { StateUtils } from '../state-utils';
import { StoreLike } from '../store-like';
import { GamePhase, State } from './state';

/** Snapshots belong to one KO, never to the player's other damaged Pokémon. */
export interface KnockoutEvent {
  turn: number;
  phase: GamePhase;
  target: PokemonCard;
  targetPlayerId: number;
  targetTypes: CardType[];
  targetTags: CardTag[];
  cause: 'attack-damage' | 'attack-effect' | 'other';
  source?: PokemonCard;
  sourcePlayerId?: number;
  attackName?: string;
}

export interface PendingKnockout {
  event: KnockoutEvent;
  damage: number;
}

/** Called after actual damage (including survival adjustments), before AfterDamage. */
export function recordKnockoutCause(
  store: StoreLike, state: State, effect: AbstractAttackEffect,
  cause: 'attack-damage' | 'attack-effect', damage: number,
): void {
  const target = effect.target;
  if (damage <= 0) return;
  const previous = target.pendingKnockout;
  target.pendingKnockout = undefined;
  const card = target.getPokemonCard();
  if (!card) return;
  const owner = StateUtils.findOwner(state, target);
  const hp = new CheckHpEffect(owner, target);
  store.reduceEffect(state, hp);
  if (target.damage < hp.hp) return;
  // Effects finish before checkState processes KOs. Further damage to an already
  // lethally hit target must not rewrite the event that actually caused its KO.
  if (previous && previous.event.target === card && previous.event.turn === state.turn
    && previous.event.phase === state.phase && previous.damage === target.damage - damage
    && previous.damage >= hp.hp) {
    target.pendingKnockout = { event: previous.event, damage: target.damage };
    return;
  }
  if (target.damage - damage >= hp.hp) return;
  const types = new CheckPokemonTypeEffect(target);
  store.reduceEffect(state, types);
  const sourceOwner = StateUtils.findOwner(state, effect.source);
  target.pendingKnockout = {
    damage: target.damage,
    event: {
      turn: state.turn, phase: state.phase, target: card, targetPlayerId: owner.id,
      targetTypes: types.cardTypes.slice(), targetTags: card.tags.slice(),
      cause: state.phase === GamePhase.ATTACK && state.players[state.activePlayer] === sourceOwner
        && sourceOwner !== owner ? cause : 'other',
      source: effect.source.getPokemonCard(), sourcePlayerId: sourceOwner.id,
      attackName: effect.attack.name,
    }
  };
}

/** Run before card propagation: tools must see the same causality as history. */
export function prepareKnockoutEvent(store: StoreLike, state: State, effect: KnockOutEffect): void {
  const target = effect.target;
  const card = target.getPokemonCard();
  if (!card) return;
  const pending = target.pendingKnockout;
  const hp = new CheckHpEffect(effect.player, target);
  store.reduceEffect(state, hp);
  if (pending && pending.event.target === card && pending.event.turn === state.turn
    && pending.event.phase === state.phase && pending.damage === target.damage && target.damage >= hp.hp) {
    effect.knockoutEvent = pending.event;
  } else {
    const types = new CheckPokemonTypeEffect(target);
    store.reduceEffect(state, types);
    effect.knockoutEvent = {
      turn: state.turn, phase: state.phase, target: card, targetPlayerId: effect.player.id,
      targetTypes: types.cardTypes.slice(), targetTags: card.tags.slice(), cause: 'other',
    };
  }
  target.pendingKnockout = undefined;
}

export function clearInvalidKnockoutCauses(state: State): void {
  for (const player of state.players) {
    for (const list of [player.active, ...player.bench]) {
      const pending = list.pendingKnockout;
      if (pending && (pending.event.target !== list.getPokemonCard()
        || pending.event.turn !== state.turn || pending.event.phase !== state.phase
        || pending.damage !== list.damage)) {
        list.pendingKnockout = undefined;
      }
    }
  }
}
