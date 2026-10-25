import { SlotType } from '../actions/play-card-action';
import { PokemonCard } from '../card/pokemon-card';
import { PokemonCardList } from '../state/pokemon-card-list';
import { State } from '../state/state';
import { StoreLike } from '../store-like';

/** Resolve animation coordinates from the board, never from optional caller hints. */
export function emitPokemonAnimationEvent(
  store: StoreLike, state: State, eventName: 'playBasicAnimation' | 'evolution',
  card: PokemonCard, target: PokemonCardList
): void {
  const owner = state.players.find(player => player.active === target || player.bench.includes(target));
  // A detached list has no board coordinates. Do not animate an unrelated slot.
  if (owner === undefined) {
    return;
  }
  const active = owner.active === target;
  const data = {
    playerId: owner.id,
    cardId: card.id,
    slot: String(active ? SlotType.ACTIVE : SlotType.BENCH),
    index: active ? 0 : owner.bench.indexOf(target)
  };
  const game = (store as any).handler;
  if (game && game.core && typeof game.core.emit === 'function') {
    game.core.emit((client: any) => {
      if (typeof client.socket !== 'undefined') {
        client.socket.emit(`game[${game.id}]:${eventName}`, data);
      }
    });
  }
}
