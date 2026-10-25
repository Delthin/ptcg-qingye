import { TouchSensor, type Activators, type SensorProps } from '@dnd-kit/core';

/** Arbitrate direction before activating, including fast diagonal first frames. */
export class BoardTouchSensor {
  static setup = TouchSensor.setup;
  static activators: Activators<{}> = [{ eventName: 'onTouchStart',
    handler: event => event.nativeEvent.touches.length === 1 }];
  autoScrollEnabled = true;
  private readonly document: Document;
  private readonly window: Window;
  private readonly origin: { x: number; y: number };
  private readonly touchId: number;
  private readonly hand: boolean;
  private activated = false;
  private ended = false;

  constructor(private readonly props: SensorProps<{}>) {
    const event = props.event as TouchEvent;
    const touch = event.touches[0];
    this.origin = { x: touch.clientX, y: touch.clientY };
    this.touchId = touch.identifier;
    this.hand = props.activeNode.data.current?.type === 'hand';
    this.document = props.activeNode.node.current?.ownerDocument ?? document;
    this.window = this.document.defaultView ?? window;
    this.document.addEventListener('touchmove', this.move, { passive: false });
    this.document.addEventListener('touchend', this.end);
    this.document.addEventListener('touchcancel', this.cancel);
    this.document.addEventListener('keydown', this.keydown);
    this.document.addEventListener('visibilitychange', this.cancel);
    this.window.addEventListener('resize', this.cancel);
  }

  private move = (event: TouchEvent) => {
    if (event.touches.length !== 1) { this.cancel(); return; }
    const touch = Array.from(event.touches).find(item => item.identifier === this.touchId);
    if (!touch) { this.cancel(); return; }
    const point = { x: touch.clientX, y: touch.clientY };
    if (!this.activated) {
      const dx = Math.abs(point.x - this.origin.x), dy = Math.abs(point.y - this.origin.y);
      if (Math.max(dx, dy) < 8) return;
      // A horizontal gesture belongs to native hand scrolling; do not prevent it.
      if (this.hand && dx > dy) { this.cancel(); return; }
      this.activated = true;
      this.document.addEventListener('click', this.stopClick, true);
      this.props.onStart(this.origin);
      if (event.cancelable) event.preventDefault();
      return;
    }
    if (event.cancelable) event.preventDefault();
    this.props.onMove(point);
  };
  private stopClick = (event: Event) => event.stopPropagation();
  private keydown = (event: KeyboardEvent) => { if (event.key === 'Escape') this.cancel(); };
  private cleanup() {
    this.document.removeEventListener('touchmove', this.move);
    this.document.removeEventListener('touchend', this.end);
    this.document.removeEventListener('touchcancel', this.cancel);
    this.document.removeEventListener('keydown', this.keydown);
    this.document.removeEventListener('visibilitychange', this.cancel);
    this.window.removeEventListener('resize', this.cancel);
    if (this.activated) this.window.setTimeout(() => this.document.removeEventListener('click', this.stopClick, true), 50);
  }
  private end = () => {
    if (this.ended) return;
    this.ended = true; this.cleanup();
    if (!this.activated) this.props.onAbort(this.props.active);
    this.props.onEnd();
  };
  private cancel = () => {
    if (this.ended) return;
    this.ended = true; this.cleanup();
    if (!this.activated) this.props.onAbort(this.props.active);
    this.props.onCancel();
  };
}
