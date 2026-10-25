import { useLayoutEffect, useState } from 'react';

/** Visible CSS viewport, including browser chrome, keyboards and zoom/panning. */
function readBounds() {
  const viewport = window.visualViewport;
  return { left: viewport?.offsetLeft ?? 0, top: viewport?.offsetTop ?? 0,
    width: viewport?.width ?? window.innerWidth, height: viewport?.height ?? window.innerHeight };
}

export function useViewportBounds() {
  const [bounds, setBounds] = useState(readBounds);
  useLayoutEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = readBounds();
        setBounds(previous => Object.keys(next).every(key => previous[key as keyof typeof next] === next[key as keyof typeof next]) ? previous : next);
      });
    };
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, []);
  return bounds;
}
