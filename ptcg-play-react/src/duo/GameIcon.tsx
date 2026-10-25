import type { ReactNode } from 'react';

/** Single-weight line icons for the game shell. Native SVG strokes only — no emoji, no assets. */
export type GameIconName =
  | 'home' | 'decks' | 'collection' | 'pack' | 'records'
  | 'arrow' | 'plus' | 'edit' | 'trash' | 'back' | 'check'
  | 'pokemon' | 'trainer' | 'energy' | 'scissors' | 'close';

const PATHS: Record<GameIconName, ReactNode> = {
  home: <><path d="M4 11.5 12 4.5l8 7" /><path d="M6.5 10v9.5h11V10" /><path d="M10.5 19.5v-5h3v5" /></>,
  decks: <><path d="M9 3.5h8.5A1.5 1.5 0 0 1 19 5v11" /><path d="M6.5 7.5H14A1.5 1.5 0 0 1 15.5 9v10A1.5 1.5 0 0 1 14 20.5H6.5A1.5 1.5 0 0 1 5 19V9a1.5 1.5 0 0 1 1.5-1.5Z" /></>,
  collection: <><path d="M6 3.5h12A1.5 1.5 0 0 1 19.5 5v14a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 6 3.5Z" /><path d="m12 8.2 1.2 2.6 2.6 1.2-2.6 1.2L12 15.8l-1.2-2.6-2.6-1.2 2.6-1.2Z" /></>,
  pack: <><path d="m5 8.5 1.8-3.5h10.4L19 8.5" /><path d="M4.5 8.5h15V19a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19Z" /><path d="M12 11.2v5M9.7 13.5h4.6" /></>,
  records: <><path d="M5 19.5v-6M10.5 19.5v-11M16 19.5V9" /><path d="M3.5 19.5h17" /></>,
  arrow: <path d="M4.5 12h14M13 6.5l5.5 5.5L13 17.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  edit: <><path d="m14.5 5.5 4 4L8 20H4v-4Z" /><path d="m12.5 7.5 4 4" /></>,
  trash: <><path d="M5 7h14M9.5 7V4.8a1.3 1.3 0 0 1 1.3-1.3h2.4a1.3 1.3 0 0 1 1.3 1.3V7" /><path d="m7 7 .8 12a1.5 1.5 0 0 0 1.5 1.4h5.4A1.5 1.5 0 0 0 16.2 19L17 7M10.5 11v6M13.5 11v6" /></>,
  back: <path d="M19.5 12h-14M11 6.5 5.5 12l5.5 5.5" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  pokemon: <><circle cx="12" cy="12" r="8" /><path d="M4 12h5.6M14.4 12h5.6" /><circle cx="12" cy="12" r="2.4" /></>,
  trainer: <><circle cx="12" cy="8.5" r="3.2" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></>,
  energy: <path d="M13 3 6.5 13.5H11L10 21l6.8-10.5H12Z" />,
  scissors: <><circle cx="7.5" cy="6.3" r="2.3" /><circle cx="7.5" cy="17.7" r="2.3" /><path d="M9.4 7.9 17.5 17M9.4 16.1 17.5 7" /></>,
  close: <path d="m6 6 12 12M18 6 6 18" />,
};

export function GameIcon({ name, size = 18, className }: { name: GameIconName; size?: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}
    strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>{PATHS[name]}</svg>;
}
