import { AttachEnergyEffect } from '../effects/play-card-effects';
import { GameError } from '../../game-error';
import { RESOLVE_PENDING_ENERGY_ATTACH_DAMAGE_COUNTERS } from '../prefabs/attack-effects';
import { GameMessage, GameLog } from '../../game-message';
import { Effect } from '../effects/effect';
import { State } from '../state/state';
import { StoreLike } from '../store-like';
import { EnergyType, SpecialCondition } from '../card/card-types';
import { SlotType } from '../actions/play-card-action';
import { EndTurnEffect } from '../effects/game-phase-effects';

/**
 * Helper function to emit animation events
 */
function emitAnimationEvent(store: StoreLike, eventName: string, data: {
  playerId: number;
  cardId: number | string;
  slot?: string;
  index?: number;
}): void {
  const game = (store as any).handler;
  if (game && game.core && typeof game.core.emit === 'function') {
    game.core.emit((c: any) => {
      if (typeof c.socket !== 'undefined') {
        c.socket.emit(`game[${game.id}]:${eventName}`, data);
      }
    });
  }
}

// Known attachment blockers must run before passive card handlers can mutate state.
export function validateEnergyAttachment(effect: AttachEnergyEffect): void {
  if (effect.source === effect.target || !effect.source.cards.includes(effect.energyCard)
    || effect.target.cards.includes(effect.energyCard)) {
    throw new GameError(GameMessage.INVALID_PROMPT_RESULT);
  }
  if (effect.target.getPokemonCard() === undefined) {
    throw new GameError(GameMessage.INVALID_TARGET);
  }
  if (effect.player.cannotPlayEnergyCards
    || (effect.energyCard.energyType === EnergyType.SPECIAL && effect.player.cannotPlaySpecialEnergyCards)
    || (effect.source === effect.player.hand && effect.target.cannotAttachEnergyFromHandNextTurn)) {
    throw new GameError(GameMessage.BLOCKED_BY_EFFECT);
  }
}

export function playEnergyReducer(store: StoreLike, state: State, effect: Effect): State {


  /* Play energy card */
  if (effect instanceof AttachEnergyEffect) {
    validateEnergyAttachment(effect);
    const pokemonCard = effect.target.getPokemonCard()!;
    const fromHand = effect.source === effect.player.hand;

    if (fromHand && effect.target.pendingEnergyAttachDamageCounters) {
      state = RESOLVE_PENDING_ENERGY_ATTACH_DAMAGE_COUNTERS(store, state, effect);
    }

    // Move card to main PokemonCardList first (so it's in the cards array).
    effect.source.moveCardTo(effect.energyCard, effect.target);
    if (effect.source.cards.includes(effect.energyCard) || !effect.target.cards.includes(effect.energyCard)) {
      throw new GameError(GameMessage.INVALID_PROMPT_RESULT);
    }
    store.log(state, GameLog.LOG_PLAYER_ATTACHES_CARD, {
      name: effect.player.name,
      card: effect.energyCard.name,
      pokemon: pokemonCard.name
    });
    // Then also add it to the energies CardList
    if (!effect.target.energies.cards.includes(effect.energyCard)) {
      effect.target.energies.cards.push(effect.energyCard);
    }

    // These two scoped passive consumers only run after a real successful move.
    effect.onAttached.forEach(callback => callback());

    // Derive slot and index for animation/sound event
    const slot = effect.target === effect.player.active ? SlotType.ACTIVE : SlotType.BENCH;
    const index = slot === SlotType.BENCH ? effect.player.bench.indexOf(effect.target) : undefined;
    emitAnimationEvent(store, 'attachEnergy', {
      playerId: effect.player.id,
      cardId: effect.energyCard.id,
      slot: String(slot),
      index
    });

    if (fromHand && effect.target.pendingEnergyAttachFromHandConsequence) {
      const consequence = effect.target.pendingEnergyAttachFromHandConsequence;
      if (consequence.asleep) {
        effect.target.addSpecialCondition(SpecialCondition.ASLEEP);
      }
      if (consequence.endTurn) {
        state = store.reduceEffect(state, new EndTurnEffect(effect.player));
      }
    }

    return state;
  }

  return state;
}
