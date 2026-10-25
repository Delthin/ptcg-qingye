import gsap from 'gsap';
import { coinById } from '../../collection/coinCatalog';
import {
  CanvasTexture,
  CylinderGeometry,
  FrontSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SRGBColorSpace,
} from 'three';
import { BOARD_3D_GRID_Y } from './board3d-constants';
import { ZONE_POSITIONS } from './board-3d-zone-positions';
import { COIN_FLIP_SPIN_DURATION_SEC, getCoinFlipSpinKeyframes } from '../coin-flip-animation';

const COIN_EDGE_COLOR = 0xb59b60;
export const COIN_FLIP_RADIUS = 1.45;
const COIN_THICKNESS = COIN_FLIP_RADIUS / 10;
/** Sits on the board surface (cards are at {@link BOARD_3D_GRID_Y}). */
const COIN_REST_Y = BOARD_3D_GRID_Y + COIN_THICKNESS / 2 + 0.04;
/** World X offset from board center (between actives) — sits right of the twinleaf emblem. */
const COIN_FLIP_X_OFFSET_FROM_CENTER = 7.25;

const deg = (d: number) => (d * Math.PI) / 180;

function createCoinFaceTexture(label: '正' | '反') {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  let generation = 0;
  let disposed = false;
  const placeholder = () => {
    if (!ctx) return;
    ctx.clearRect(0, 0, 256, 256);
    ctx.fillStyle = '#b59b60'; ctx.beginPath(); ctx.arc(128, 128, 124, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#252a21'; ctx.font = 'bold 96px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, 128, 128);
    texture.needsUpdate = true;
  };
  placeholder();
  const setImage = (path: string, fallback: string) => {
    const request = ++generation;
    placeholder();
    const load = (src: string, mayFallback: boolean) => {
      const image = new Image();
      image.onload = () => {
        if (disposed || generation !== request || !ctx) return;
        ctx.clearRect(0, 0, 256, 256); ctx.drawImage(image, 0, 0, 256, 256); texture.needsUpdate = true;
      };
      image.onerror = () => {
        if (!disposed && generation === request && mayFallback && src !== fallback) load(fallback, false);
      };
      image.src = src;
    };
    load(path, true);
  };
  return { texture, setImage, dispose: () => { disposed = true; generation++; texture.dispose(); } };
}

/** Flat on the board: heads (+Y) or tails (−Y flipped up). */
export function snapCoinRestPose(coin: Group, isHeads: boolean): void {
  coin.rotation.set(isHeads ? 0 : Math.PI, 0, 0);
  coin.scale.set(1, 1, 1);
  coin.position.y = 0;
}

/** Permanent 180° correction so the printed faces are upright from the camera. */
const COIN_ORIENTATION_Y = Math.PI;

export type CoinFlipSceneGraph = {
  root: Group;
  coin: Group;
  setCoinId: (coinId?: string) => void;
  dispose: () => void;
};

export function createCoinFlipSceneGraph(): CoinFlipSceneGraph {
  const midX = (ZONE_POSITIONS.bottomPlayer.active.x + ZONE_POSITIONS.topPlayer.active.x) / 2;
  const midZ = (ZONE_POSITIONS.bottomPlayer.active.z + ZONE_POSITIONS.topPlayer.active.z) / 2;

  const root = new Group();
  root.position.set(midX + COIN_FLIP_X_OFFSET_FROM_CENTER, COIN_REST_Y, midZ);
  root.renderOrder = 2000;

  const coinOrientation = new Group();
  coinOrientation.rotation.y = COIN_ORIENTATION_Y;
  root.add(coinOrientation);

  const coin = new Group();
  snapCoinRestPose(coin, true);
  coinOrientation.add(coin);

  const bodyGeometry = new CylinderGeometry(COIN_FLIP_RADIUS, COIN_FLIP_RADIUS, COIN_THICKNESS, 48, 1);
  const faceGeometry = new PlaneGeometry(COIN_FLIP_RADIUS * 2, COIN_FLIP_RADIUS * 2);
  const headsTexture = createCoinFaceTexture('正');
  const tailsTexture = createCoinFaceTexture('反');

  const bodyMaterial = new MeshBasicMaterial({ color: COIN_EDGE_COLOR });
  const faceMaterialOptions = {
    transparent: true,
    alphaTest: 0.01,
    toneMapped: false,
    depthWrite: true,
    side: FrontSide,
  } as const;
  const headsMaterial = new MeshBasicMaterial({ map: headsTexture.texture, ...faceMaterialOptions });
  const tailsMaterial = new MeshBasicMaterial({ map: tailsTexture.texture, ...faceMaterialOptions });

  // Cylinder axis = Y (default) — coin lies flat on the board.
  const body = new Mesh(bodyGeometry, bodyMaterial);
  coin.add(body);

  const headsFace = new Mesh(faceGeometry, headsMaterial);
  headsFace.name = 'coin-heads';
  headsFace.rotation.x = -Math.PI / 2;
  headsFace.position.y = COIN_THICKNESS / 2 + 0.001;
  coin.add(headsFace);

  const tailsFace = new Mesh(faceGeometry, tailsMaterial);
  tailsFace.name = 'coin-tails';
  tailsFace.rotation.x = Math.PI / 2;
  tailsFace.position.y = -(COIN_THICKNESS / 2 + 0.001);
  coin.add(tailsFace);

  const dispose = (): void => {
    bodyGeometry.dispose();
    faceGeometry.dispose();
    bodyMaterial.dispose();
    headsMaterial.dispose();
    tailsMaterial.dispose();
    headsTexture.dispose();
    tailsTexture.dispose();
  };

  let currentId: string | undefined;
  const setCoinId = (id?: string) => {
    const artwork = coinById(id);
    if (currentId === artwork.id) return;
    currentId = artwork.id;
    headsTexture.setImage(artwork.frontImage, coinById().frontImage);
    tailsTexture.setImage(artwork.backImage, coinById().backImage);
  };
  setCoinId();
  return { root, coin, setCoinId, dispose };
}

export function buildCoinFlipTimeline(
  coin: Group,
  isHeads: boolean,
  onComplete: () => void,
): gsap.core.Timeline {
  snapCoinRestPose(coin, true);

  const keyframes = getCoinFlipSpinKeyframes(isHeads);
  const timeline = gsap.timeline({
    onComplete: () => {
      snapCoinRestPose(coin, isHeads);
      onComplete();
    },
  });

  const spinDur = COIN_FLIP_SPIN_DURATION_SEC;
  // Physical rise, fall and two small bounces; no extra game or queue delay.
  timeline.to(coin.position, { y: 4.2, duration: spinDur * .3, ease: 'power2.out' }, 0)
    .to(coin.position, { y: 0, duration: spinDur * .38, ease: 'power2.in' }, spinDur * .3)
    .to(coin.position, { y: .65, duration: spinDur * .1, ease: 'power2.out' }, spinDur * .68)
    .to(coin.position, { y: 0, duration: spinDur * .09, ease: 'power2.in' }, spinDur * .78)
    .to(coin.position, { y: .12, duration: spinDur * .06, ease: 'power2.out' }, spinDur * .87)
    .to(coin.position, { y: 0, duration: spinDur * .07, ease: 'power2.in' }, spinDur * .93);

  for (let i = 1; i < keyframes.length; i++) {
    const prev = keyframes[i - 1];
    const curr = keyframes[i];
    const segmentDur = (curr.offset - prev.offset) * spinDur;
    const startAt = prev.offset * spinDur;

    timeline.to(
      coin.rotation,
      {
        x: deg(curr.rotXDeg),
        y: deg(curr.rotYDeg),
        duration: segmentDur,
        ease: 'none',
      },
      startAt,
    );
    timeline.to(
      coin.scale,
      {
        x: curr.scale,
        y: curr.scale,
        z: curr.scale,
        duration: segmentDur,
        ease: 'none',
      },
      startAt,
    );
  }

  return timeline;
}
