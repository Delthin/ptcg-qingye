import { PlayPokemonFromDiscardEffect } from '../effects/play-card-effects';
import { GameError } from '../../game-error';
import { GameMessage, GameLog } from '../../game-message';
import { Effect } from '../effects/effect';
import { State } from '../state/state';
import { StoreLike } from '../store-like';

import { emitPokemonAnimationEvent } from './pokemon-animation';

export function playPokemonFromDiscardReducer(store: StoreLike, state: State, effect: Effect): State {

  /* Play pokemon card from discard */
  if (effect instanceof PlayPokemonFromDiscardEffect) {

    // Check if target is empty (for Basic Pokémon)
    if (effect.target.cards.length === 0) {
      store.log(state, GameLog.LOG_PLAYER_PLAYS_BASIC_POKEMON, {
        name: effect.player.name,
        card: effect.pokemonCard.name
      });
      effect.player.discard.moveCardTo(effect.pokemonCard, effect.target);
      effect.target.pokemonPlayedTurn = state.turn;
      if (effect.target.cards.includes(effect.pokemonCard)) {
        for (const onPlayed of effect.onPlayed) onPlayed();
      }

      // Emit basic animation event
      emitPokemonAnimationEvent(store, state, 'playBasicAnimation', effect.pokemonCard, effect.target);

      return state;
    }

    throw new GameError(GameMessage.INVALID_TARGET);
  }

  return state;
}
