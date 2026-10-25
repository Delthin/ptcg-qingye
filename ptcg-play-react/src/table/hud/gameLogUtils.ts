import type { TFunction } from 'i18next';
import type { Player, StateLog } from 'ptcg-server';
import { localizeGameValue, trainerDisplayName } from '../../duo/chineseCatalog';

export function logPlayerName(log: StateLog, players: Player[]): string {
  if (log.client === 0) {
    return '系统';
  }
  return trainerDisplayName(players.find((p) => p.id === log.client)?.name ?? `训练家 ${log.client}`);
}

export function isLogHidden(log: StateLog, clientId: number): boolean {
  return String(log.params?.private) === 'true' && log.client !== clientId && log.client !== 0;
}

export function formatGameLogLine(t: TFunction, log: StateLog): string {
  // User chat is opaque text, not a catalog value or an i18next template.
  if (log.message === 'LOG_TEXT') return typeof log.params?.text === 'string' ? log.params.text : '';
  return t(`GAME_LOGS.${log.message}`, {
    ...Object.fromEntries(Object.entries(log.params ?? {}).map(([key, value]) => [key, localizeGameValue(value)])),
    defaultValue: String(log.message),
  });
}

export type GameLogSpeakerClass = 'system' | 'active' | 'opponent' | 'default';

/** Visual accent for a log line: drives the small type-colored marker dot. */
export type GameLogAccent =
  | 'damage'
  | 'ko'
  | 'energy'
  | 'evolve'
  | 'status'
  | 'draw'
  | 'attack'
  | 'ability'
  | 'coin'
  | 'system'
  | 'misc';

const LOG_ACCENTS: Record<string, GameLogAccent> = {
  LOG_POKEMON_KO: 'ko',
  LOG_PLAYER_DEALS_DAMAGE: 'damage',
  LOG_PLAYER_PLACES_DAMAGE_COUNTERS: 'damage',
  LOG_HURTS_ITSELF: 'damage',
  LOG_SURVIVES_ON_TEN_HP: 'damage',
  LOG_ABILITY_BLOCKS_DAMAGE: 'damage',
  LOG_PLAYER_ATTACHES_CARD: 'energy',
  LOG_PLAYER_EVOLVES_POKEMON: 'evolve',
  LOG_PLAYER_TRANSFORMS_INTO_POKEMON: 'evolve',
  LOG_FLIP_ASLEEP: 'status',
  LOG_FLIP_CONFUSION: 'status',
  LOG_PLAYER_DRAWS_CARD: 'draw',
  LOG_PLAYER_PUTS_CARD_IN_HAND: 'draw',
  LOG_PLAYER_RETURNS_CARD_TO_HAND: 'draw',
  LOG_PLAYER_PUTS_CARD_ON_BOTTOM_OF_DECK: 'draw',
  LOG_PLAYER_RETURNS_TO_DECK_FROM_DISCARD: 'draw',
  LOG_SHUFFLE_POKEMON_INTO_DECK: 'draw',
  LOG_HISUIAN_HEAVY_BALL: 'draw',
  LOG_PLAYER_SWITCHES_POKEMON_WITH_POKEMON_FROM_DECK: 'draw',
  LOG_PLAYER_USES_ATTACK: 'attack',
  LOG_PLAYER_COPIES_ATTACK: 'attack',
  LOG_PLAYER_DISABLES_ATTACK: 'attack',
  LOG_PLAYER_RETREATS: 'attack',
  LOG_PLAYER_GUSTS_POKEMON_TO_ACTIVE: 'attack',
  LOG_PLAYER_SWITCHES_POKEMON_TO_ACTIVE: 'attack',
  LOG_PLAYER_USES_ABILITY: 'ability',
  LOG_STARTS_BECAUSE_OF_ABILITY: 'ability',
  LOG_PLAYER_FLIPS_HEADS: 'coin',
  LOG_PLAYER_FLIPS_TAILS: 'coin',
  LOG_PLAYER_REFLIPS_WITH_BACKTRACK_BADGE: 'coin',
  LOG_PLAYER_REFLIPS_WITH_GLIMWOOD_TANGLE: 'coin',
  LOG_PLAYER_REFLIPS_WITH_TRICK_COIN: 'coin',
  LOG_TURN: 'system',
  LOG_GAME_FINISHED: 'system',
  LOG_GAME_FINISHED_BEFORE_STARTED: 'system',
  LOG_GAME_FINISHED_DRAW: 'system',
  LOG_GAME_FINISHED_WINNER: 'system',
  LOG_PLAYER_ENDS_TURN: 'system',
  LOG_PLAYER_LEFT_THE_GAME: 'system',
  LOG_PLAYER_CONCEDED: 'system',
  LOG_TIME_ELAPSED: 'system',
};

export function logAccent(message: string): GameLogAccent {
  return LOG_ACCENTS[message] ?? 'misc';
}

export function logSpeakerClass(
  log: StateLog,
  activePlayerId: number | undefined,
): GameLogSpeakerClass {
  if (log.client === 0) {
    return 'system';
  }
  if (activePlayerId != null && log.client === activePlayerId) {
    return 'active';
  }
  if (activePlayerId != null && log.client !== activePlayerId) {
    return 'opponent';
  }
  return 'default';
}

export type GameLogTurnSection = {
  key: string;
  title: string;
  turn: number | null;
  logs: StateLog[];
};

export function groupLogsByTurn(
  logs: StateLog[],
  t: TFunction,
  clientId: number,
): GameLogTurnSection[] {
  const sections: GameLogTurnSection[] = [];
  let current: GameLogTurnSection = {
    key: 'setup',
    title: t('REACT_GAME_LOG_SETUP', { defaultValue: 'Setup' }),
    turn: null,
    logs: [],
  };

  for (const log of logs) {
    if (isLogHidden(log, clientId)) {
      continue;
    }
    if (log.message === 'LOG_TURN') {
      if (current.logs.length > 0) {
        sections.push(current);
      }
      const turn = Number(log.params?.turn ?? 0);
      current = {
        key: `turn-${turn}-${log.id}`,
        title: formatGameLogLine(t, log),
        turn,
        logs: [log],
      };
    } else {
      current.logs.push(log);
    }
  }

  if (current.logs.length > 0) {
    sections.push(current);
  }

  return sections;
}
