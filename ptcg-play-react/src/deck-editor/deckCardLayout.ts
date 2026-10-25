/** Card art height/width (standard TCG), matches deck grid. */
export const DECK_CARD_AR = 88 / 63;
/** Gap between cards in deck grid and library grid (px). */
export const DECK_CARD_GAP_PX = 10;
/** Horizontal + vertical padding inside deck drop zone (px). */
export const DECK_DROP_ZONE_PAD_X = 12;
export const DECK_DROP_ZONE_PAD_TOP = 12;
/** Minimum library slot width; extra space is shared before another column fits. */
export const DECK_DEFAULT_SLOT_W = 102;
/** Cap card art height in the deck grid so a nearly empty deck does not blow up thumbnails. */
export const DECK_MAX_CARD_HEIGHT_PX = 184;
/** Max slot width consistent with {@link DECK_MAX_CARD_HEIGHT_PX} and {@link DECK_CARD_AR}. */
export const DECK_MAX_SLOT_W = Math.floor(DECK_MAX_CARD_HEIGHT_PX / DECK_CARD_AR);
