import { AlertPrompt } from '../../game/store/prompts/alert-prompt';
import { Card } from '../../game/store/card/card';
import { CardList } from '../../game/store/state/card-list';
import { ChooseCardsPrompt } from '../../game/store/prompts/choose-cards-prompt';
import { Client } from '../../game/client/client.interface';
import { ConfirmPrompt } from '../../game/store/prompts/confirm-prompt';
import { GameMessage } from '../../game/game-message';
import { SocketCache } from './socket-cache';
import { GamePhase, State } from '../../game/store/state/state';
import { UnknownCard } from '../../game/store/card/unknown-card';
import { deepClone } from '../../utils';

export interface SanitizeViewer {
  playerId: number;
  roleId: number;
}

export interface SanitizeOptions {
  trimLogs?: boolean;
  lastLogId?: number;
  onLogsTrimmed?: (lastLogId: number) => void;
}

export class StateSanitizer {

  constructor(
    private client: Client,
    private cache: SocketCache
  ) { }

  public sanitize(state: State, gameId: number, viewingAsPlayerId?: number): State {
    const pid = viewingAsPlayerId !== undefined ? viewingAsPlayerId : this.client.id;
    return StateSanitizer.sanitizeForViewer(state, {
      playerId: pid,
      roleId: this.client.user.roleId,
    }, {
      trimLogs: true,
      lastLogId: this.cache.lastLogIdCache[gameId] || 0,
      onLogsTrimmed: (lastLogId) => {
        this.cache.lastLogIdCache[gameId] = lastLogId;
      },
    });
  }

  public static sanitizeForViewer(
    state: State,
    viewer: SanitizeViewer,
    options: SanitizeOptions = {}
  ): State {
    let next = deepClone(state, [Card]);
    next = filterPrompts(next, viewer.playerId);
    if (options.trimLogs) {
      next = removeLogs(next, options.lastLogId || 0, options.onLogsTrimmed);
    }
    next = hideSecretCards(next, viewer);
    return next;
  }
}

function hideSecretCards(state: State, viewer: SanitizeViewer): State {
  if (state.cardNames.length === 0) {
    return state;
  }
  const secretLists = new Set(getSecretCardLists(state, viewer));
  const visible = new Set<number>();
  const visited = new Set<object>();
  const walk = (value: unknown): void => {
    if (!value || typeof value !== 'object' || visited.has(value as object)) return;
    visited.add(value as object);
    if (secretLists.has(value as CardList)) return;
    if (value instanceof Card) {
      if (value.id >= 0 && value.id < state.cardNames.length) visible.add(value.id);
      return;
    }
    if (Array.isArray(value)) { value.forEach(walk); return; }
    Object.values(value as Record<string, unknown>).forEach(walk);
  };
  walk(state);
  // The old global dictionary contained both complete decks even when list entries
  // were face-down. Mask unused names as well as card contents.
  state.cardNames = state.cardNames.map((name, index) => visible.has(index) ? name : 'Unknown');
  // Anonymous IDs must not identify previously revealed cards shuffled into a deck.
  // Keep the real-card index space intact for visible cards and use new dummy slots.
  for (const list of secretLists) {
    list.cards = list.cards.map(() => {
      const unknown = new UnknownCard();
      unknown.id = state.cardNames.length;
      state.cardNames.push('Unknown');
      return unknown;
    });
  }
  return state;
}

function getSecretCardLists(state: State, viewer: SanitizeViewer): CardList[] {
  const sandboxRevealDecks =
    state.gameSettings?.sandboxMode === true && viewer.roleId === 4;
  const players = state.players.filter(p => p.id === viewer.playerId);
  const cardLists: CardList[] = [];
  players.forEach(player => {
    if (player.deck.isSecret && !sandboxRevealDecks) {
      cardLists.push(player.deck);
    }
    player.prizes.forEach(prize => {
      if (prize.isSecret) {
        cardLists.push(prize);
      }
    });
  });

  const opponents = state.players.filter(p => p.id !== viewer.playerId);
  const isPlaying = state.players.some(p => p.id === viewer.playerId);
  const isObserver = !isPlaying;

  opponents.forEach(opponent => {
    // Setup selections and extra mulligan bench placements stay private on the wire,
    // not only face-down in the renderer.
    [opponent.active, ...opponent.bench].forEach(list => {
      if (list.isSecret) {
        cardLists.push(list);
      }
    });
    if (!opponent.hand.isPublic && (!isObserver || (viewer.roleId !== 4 && viewer.roleId !== 5))) {
      cardLists.push(opponent.hand);
    }
    if (!opponent.deck.isPublic && !sandboxRevealDecks) {
      cardLists.push(opponent.deck);
    }
    const adminObserver = isObserver && viewer.roleId === 4;
    opponent.prizes.forEach(prize => {
      if (!prize.isPublic && !adminObserver) {
        cardLists.push(prize);
      }
    });
  });

  state.prompts.forEach(prompt => {
    if (prompt instanceof ChooseCardsPrompt && prompt.options.isSecret) {
      cardLists.push(prompt.cards);
    }
  });

  return cardLists;
}

function filterPrompts(state: State, viewerPlayerId: number): State {
  state.prompts = state.prompts.filter(prompt => {
    return prompt.result === undefined;
  });

  state.prompts = state.prompts.map(prompt => {
    if (prompt.playerId !== viewerPlayerId) {
      // Only expose who is choosing the opening turn, never their actionable prompt.
      const message = state.phase === GamePhase.SETUP
        && prompt instanceof ConfirmPrompt && prompt.message === GameMessage.GO_FIRST
        ? GameMessage.GO_FIRST : GameMessage.NOT_YOUR_TURN;
      return new AlertPrompt(prompt.playerId, message);
    }
    return prompt;
  });

  state.prompts = deepClone(state.prompts, [Card]);
  return state;
}

function removeLogs(
  state: State,
  lastLogId: number,
  onLogsTrimmed?: (lastLogId: number) => void
): State {
  state.logs = state.logs.filter(log => log.id > lastLogId);
  if (state.logs.length > 0 && onLogsTrimmed) {
    onLogsTrimmed(state.logs[state.logs.length - 1].id);
  }
  return state;
}
