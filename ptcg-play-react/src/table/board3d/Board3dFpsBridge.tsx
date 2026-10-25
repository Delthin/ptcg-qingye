import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { BOARD3D_DECK_BULK_VISUAL_UD } from './board3d-constants';

type Board3dFpsBridgeProps = {
  onFps: (fps: number) => void;
  /** How often to call `onFps` with a fresh average (ms). */
  reportIntervalMs?: number;
};

/**
 * Samples the React Three Fiber render loop—the same cadence as the board WebGL frame loop—and
 * reports averaged FPS. The app does not set a custom FPS cap; the browser typically ties rAF to
 * display refresh (e.g. 60 Hz or 120 Hz on ProMotion).
 */
export function Board3dFpsBridge({ onFps, reportIntervalMs = 400 }: Board3dFpsBridgeProps) {
  const onFpsRef = useRef(onFps);
  onFpsRef.current = onFps;

  const windowStartRef = useRef(performance.now());
  const framesInWindowRef = useRef(0);

  useFrame((state) => {
    framesInWindowRef.current++;
    const now = performance.now();
    const elapsed = now - windowStartRef.current;
    if (elapsed < reportIntervalMs) {
      return;
    }
    const canvas = state.gl.domElement;
    canvas.dataset.boardDrawCalls = String(state.gl.info.render.calls);
    canvas.dataset.boardTriangles = String(state.gl.info.render.triangles);
    let cards = 0, deckLayers = 0, meshes = 0;
    state.scene.traverse(object => {
      if (object.userData.isCard) cards++;
      if (object.userData[BOARD3D_DECK_BULK_VISUAL_UD]) deckLayers++;
      if ((object as { isMesh?: boolean }).isMesh && object.visible) meshes++;
    });
    canvas.dataset.boardCards = String(cards);
    canvas.dataset.boardDeckLayers = String(deckLayers);
    canvas.dataset.boardMeshes = String(meshes);
    if (elapsed > 0) {
      onFpsRef.current(Math.round((framesInWindowRef.current / elapsed) * 1000));
    }
    windowStartRef.current = now;
    framesInWindowRef.current = 0;
  });

  return null;
}
