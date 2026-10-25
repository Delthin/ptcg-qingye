import { useCallback, useEffect, useRef } from 'react';

const hoverFine = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Pointer-driven 3D tilt with a tracking glare highlight.
 * Writes CSS custom properties (--rx/--ry/--gx/--gy) on the element;
 * the stylesheet decides how to use them. Disabled on touch and
 * for prefers-reduced-motion users.
 */
export function useTilt<T extends HTMLElement>(max = 9) {
  const ref = useRef<T | null>(null);

  const onPointerMove = useCallback(
    (event: { clientX: number; clientY: number }) => {
      const el = ref.current;
      if (!el || !hoverFine() || reducedMotion()) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty('--rx', `${(-py * max).toFixed(2)}deg`);
      el.style.setProperty('--ry', `${(px * max).toFixed(2)}deg`);
      el.style.setProperty('--gx', `${((px + 0.5) * 100).toFixed(1)}%`);
      el.style.setProperty('--gy', `${((py + 0.5) * 100).toFixed(1)}%`);
    },
    [max],
  );

  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--gx', '50%');
    el.style.setProperty('--gy', '50%');
  }, []);

  return { ref, onPointerMove, onPointerLeave };
}

/**
 * Scene parallax: normalised pointer position (--px/--py in -0.5..0.5)
 * written to the arena root with rAF throttling, so backdrop layers can
 * drift at different depths. Desktop pointers only.
 */
export function useParallax<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const frame = useRef(0);

  const onPointerMove = useCallback((event: { clientX: number; clientY: number }) => {
    if (!hoverFine() || reducedMotion()) return;
    const el = ref.current;
    if (!el) return;
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty('--px', x.toFixed(3));
      el.style.setProperty('--py', y.toFixed(3));
    });
  }, []);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return { ref, onPointerMove };
}
