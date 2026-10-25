import { useRef, type CSSProperties, type PointerEvent, type ReactNode } from 'react';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * 指针驱动的 3D 卡牌容器：随鼠标倾斜并移动卡面反光/全息光斑。
 * 纯视觉包装，不拦截任何指针事件；触屏与 reduced-motion 下保持静止。
 */
export function TiltCard({
  children,
  className = '',
  maxTilt = 8,
  style,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  style?: CSSProperties;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function move(event: PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || prefersReducedMotion() || event.pointerType !== 'mouse') return;
    const rect = el.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const py = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    el.style.setProperty('--ry', `${((px - 0.5) * 2 * maxTilt).toFixed(2)}deg`);
    el.style.setProperty('--rx', `${((0.5 - py) * 2 * maxTilt).toFixed(2)}deg`);
    el.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
  }

  function leave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--rx', '0deg');
  }

  return (
    <div ref={ref} className={`fx-tilt ${className}`} style={style} onPointerMove={move} onPointerLeave={leave}>
      {children}
      {glare && <span className="fx-glare" aria-hidden />}
    </div>
  );
}
