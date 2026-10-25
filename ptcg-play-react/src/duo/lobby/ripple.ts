import type { PointerEvent } from 'react';
import './ripple.css';

const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Iridescent ripple — PTCG Pocket style press feedback.
 * Appends a short-lived rainbow bloom at the press point. The host element
 * needs `position: relative; overflow: hidden` (buttons already have it).
 */
export function spawnRipple(event: PointerEvent<HTMLElement>): void {
  if (reducedMotion()) return;
  const host = event.currentTarget;
  const rect = host.getBoundingClientRect();
  const start = 18;
  const scale = Math.max(1, (Math.max(rect.width, rect.height) / start) * 1.15);
  const ripple = document.createElement('span');
  ripple.className = 'duo-ripple';
  ripple.style.left = `${event.clientX - rect.left}px`;
  ripple.style.top = `${event.clientY - rect.top}px`;
  ripple.style.setProperty('--ripple-scale', String(scale));
  host.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
  window.setTimeout(() => ripple.remove(), 900);
}
