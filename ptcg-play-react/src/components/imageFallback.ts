import type { SyntheticEvent } from 'react';

/** Local card back used when private card art cannot be loaded. */
export const CARD_BACK_FALLBACK = '/assets/duo-cardback.svg';

/**
 * Private card scans are served from /scans behind the room cookie. When that request fails
 * (cookie expired, scan missing, offline stretch) the browser would otherwise paint the alt
 * text on top of the card-back decoration, which reads as an unfinished page. Swap in the local
 * card back once and drop the alt text so the tile still looks intentional.
 */
export function onImageError(event: SyntheticEvent<HTMLImageElement>, fallback: string = CARD_BACK_FALLBACK): void {
  const image = event.currentTarget;
  image.onerror = null;
  image.removeAttribute('alt');
  if (image.getAttribute('src') !== fallback) {
    image.src = fallback;
  }
}
