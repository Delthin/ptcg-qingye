import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Euler,
  Matrix4,
  PlaneGeometry,
  Quaternion,
  RepeatWrapping,
  SRGBColorSpace,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Art-direction palette for the 3D battle table.
 * Deep ink-blue felt, walnut rails, brass inlay, restrained amber/ice accents.
 * Colors are tuned for ACES tone mapping at exposure ~1.2 with the warm key /
 * cool ambient / cool rim rig in `board3dLightingConfig`.
 */
export const BOARD3D_SCENE_PALETTE = {
  /** Felt top color — deep slate-blue that recedes under the cards. */
  felt: 0x3e4f64,
  /** Table slab sides / underside — dark walnut. */
  slabSide: 0x1d1712,
  /** Raised perimeter rail — walnut, matte, catches the key light softly. */
  railWood: 0x30241b,
  /** Brass inlay field ring — metalness high, reads via key speculars. */
  brass: 0xa8853f,
  /** Painted center (battle) line — muted amber gold, aligned with site gold #d5b782. */
  lineAmber: 0xd5b782,
  /** Room tone — reference color matching the CSS backdrop gradient in
   * Board3DCanvas.module.css. Not used for scene fog (removed so far card
   * art stays clean under the aspect-fit cameras); kept as the design token
   * for the room ambience. */
  room: '#0a1018',
} as const;

/** Table footprint — must stay identical to the legacy board plane. */
export const BOARD3D_TABLE_WIDTH = 70;
export const BOARD3D_TABLE_HEIGHT = 50;
export const BOARD3D_TABLE_CENTER_Z = 12;

/** Slab thickness (world units) — top face stays at y = 0 like the old plane. */
export const BOARD3D_TABLE_THICKNESS = 1.15;

/** Perimeter rail cross-section. Sits fully outside every zone / drop target. */
const RAIL_WIDTH = 1.3;
const RAIL_HEIGHT = 1.05;
/** Rail top sits slightly above the felt like a real tray lip. */
const RAIL_TOP_Y = 0.34;

/**
 * Brass inlay field ring. Inner boundary of the play field; clears the widest
 * zone footprint (mobile deck at x≈±21.4) and the hand rows (z<0.2 / z>27.8).
 */
const FIELD_RING_HALF_X = 22.2;
const FIELD_RING_MIN_Z = 0.4;
const FIELD_RING_MAX_Z = 27.6;
const INLAY_WIDTH = 0.09;
const INLAY_HEIGHT = 0.06;

/** Painted center line (battle line) — amber, broken by the center emblem. */
const CENTER_LINE_THICKNESS = 0.07;
const CENTER_LINE_INNER_GAP = 4.4;
const CENTER_LINE_OUTER_X = 33;

const _m = new Matrix4();
const _q = new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, 0));
const _s = new Vector3(1, 1, 1);
const _v = new Vector3();

function flatStrip(lenX: number, lenZ: number, x: number, y: number, z: number): BufferGeometry {
  const g = new PlaneGeometry(lenX, lenZ);
  _v.set(x, y, z);
  _m.compose(_v, _q, _s);
  g.applyMatrix4(_m);
  return g;
}

function boxAt(
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number
): BufferGeometry {
  const g = new BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return g;
}

function mergeAndDispose(parts: BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(parts);
  for (const p of parts) {
    p.dispose();
  }
  if (!merged) {
    throw new Error('board3dSceneSkin: mergeGeometries returned null');
  }
  return merged;
}

/** Walnut perimeter rail around the felt (single merged mesh). */
export function buildTableRailGeometry(): BufferGeometry {
  const halfW = BOARD3D_TABLE_WIDTH / 2;
  const halfH = BOARD3D_TABLE_HEIGHT / 2;
  const centerY = RAIL_TOP_Y - RAIL_HEIGHT / 2;
  const longSide = BOARD3D_TABLE_HEIGHT + 2 * RAIL_WIDTH;
  const shortSide = BOARD3D_TABLE_WIDTH + 2 * RAIL_WIDTH;
  return mergeAndDispose([
    boxAt(RAIL_WIDTH, RAIL_HEIGHT, longSide, -(halfW + RAIL_WIDTH / 2), centerY, BOARD3D_TABLE_CENTER_Z),
    boxAt(RAIL_WIDTH, RAIL_HEIGHT, longSide, halfW + RAIL_WIDTH / 2, centerY, BOARD3D_TABLE_CENTER_Z),
    boxAt(shortSide, RAIL_HEIGHT, RAIL_WIDTH, 0, centerY, BOARD3D_TABLE_CENTER_Z - halfH - RAIL_WIDTH / 2),
    boxAt(shortSide, RAIL_HEIGHT, RAIL_WIDTH, 0, centerY, BOARD3D_TABLE_CENTER_Z + halfH + RAIL_WIDTH / 2),
  ]);
}

/** Brass inlay ring marking the play-field boundary (single merged mesh). */
export function buildFieldInlayGeometry(): BufferGeometry {
  const y = INLAY_HEIGHT / 2 - 0.01;
  const lengthX = FIELD_RING_HALF_X * 2;
  const lengthZ = FIELD_RING_MAX_Z - FIELD_RING_MIN_Z;
  const centerZ = (FIELD_RING_MIN_Z + FIELD_RING_MAX_Z) / 2;
  return mergeAndDispose([
    boxAt(lengthX, INLAY_HEIGHT, INLAY_WIDTH, 0, y, FIELD_RING_MIN_Z),
    boxAt(lengthX, INLAY_HEIGHT, INLAY_WIDTH, 0, y, FIELD_RING_MAX_Z),
    boxAt(INLAY_WIDTH, INLAY_HEIGHT, lengthZ, -FIELD_RING_HALF_X, y, centerZ),
    boxAt(INLAY_WIDTH, INLAY_HEIGHT, lengthZ, FIELD_RING_HALF_X, y, centerZ),
  ]);
}

/**
 * Amber center (battle) line on the felt at `centerZ`, split around the
 * center emblem so it never crosses the ball artwork.
 */
export function buildCenterLineGeometry(centerZ: number, y: number): BufferGeometry {
  const halfLen = CENTER_LINE_OUTER_X - CENTER_LINE_INNER_GAP;
  const midX = CENTER_LINE_OUTER_X - halfLen / 2;
  return mergeAndDispose([
    flatStrip(halfLen, CENTER_LINE_THICKNESS, -midX, y, centerZ),
    flatStrip(halfLen, CENTER_LINE_THICKNESS, midX, y, centerZ),
  ]);
}

/** How often the felt tiles repeat across the table width (height follows aspect). */
const FELT_REPEAT_X = 6;

/**
 * Fine felt weave texture — near-white canvas (multiplied by the material
 * color). Deliberately *not* a regular grid: hard lattice lines read as
 * glare/moiré once tiled and viewed at grazing angles, so the weave is built
 * from soft one-pixel fiber strokes biased along the warp/weft, plus gentle
 * mottling and sparse flecks. Contrast stays in the ~2–4% range so the felt
 * reads as cloth, not pattern.
 */
export function createFeltWeaveTexture(anisotropy: number): CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('board3dSceneSkin: 2d context unavailable');
  }

  ctx.fillStyle = '#fdfdfc';
  ctx.fillRect(0, 0, size, size);

  // Soft large-scale mottling so the felt is not flat — very low contrast.
  for (let i = 0; i < 11; i++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    const r = 120 + Math.random() * 180;
    const light = Math.random() > 0.5;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, light ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.032)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }

  // Wool nap — short faint strokes biased along the two thread directions.
  // Random drift/length per stroke keeps any lattice from emerging.
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';
  for (let i = 0; i < 2400; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const len = 7 + Math.random() * 12;
    const drift = (Math.random() - 0.5) * 2.4;
    const dark = Math.random() > 0.48;
    ctx.strokeStyle = dark
      ? `rgba(12,17,26,${0.012 + Math.random() * 0.02})`
      : `rgba(255,251,243,${0.01 + Math.random() * 0.018})`;
    ctx.beginPath();
    if (Math.random() > 0.5) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + drift, y + len);
    } else {
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y + drift);
    }
    ctx.stroke();
  }

  // Sparse fiber flecks.
  for (let i = 0; i < 1500; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const dark = Math.random() > 0.45;
    ctx.fillStyle = dark
      ? `rgba(10,14,22,${0.02 + Math.random() * 0.02})`
      : `rgba(255,250,240,${0.015 + Math.random() * 0.02})`;
    ctx.fillRect(x, y, 1, 1);
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  // Fewer, larger tiles than before: 1024px per ~11.7 world units keeps the
  // nap sub-pixel at gameplay zoom and hides tiling of the mottling.
  tex.repeat.set(FELT_REPEAT_X, (BOARD3D_TABLE_HEIGHT / BOARD3D_TABLE_WIDTH) * FELT_REPEAT_X);
  tex.anisotropy = anisotropy;
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

/**
 * Soft bump map for the felt — gentle cushion undulation only. Deliberately
 * separate from the color map: no thread lattice here, so grazing speculars
 * stay smooth instead of sparkling into a grid. Stays linear (no sRGB tag).
 */
export function createFeltBumpTexture(anisotropy: number): CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('board3dSceneSkin: 2d context unavailable');
  }

  ctx.fillStyle = '#7f7f7f';
  ctx.fillRect(0, 0, size, size);

  // Broad undulation — where the felt was stretched over the slate.
  for (let i = 0; i < 16; i++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    const r = 60 + Math.random() * 140;
    const light = Math.random() > 0.5;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, light ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }

  // Whisper of fiber relief, aligned with the color nap.
  ctx.lineWidth = 1;
  for (let i = 0; i < 420; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const len = 8 + Math.random() * 14;
    const drift = (Math.random() - 0.5) * 3;
    const v = Math.random() > 0.5 ? 255 : 0;
    ctx.strokeStyle = `rgba(${v},${v},${v},0.028)`;
    ctx.beginPath();
    if (Math.random() > 0.5) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + drift, y + len);
    } else {
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y + drift);
    }
    ctx.stroke();
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(FELT_REPEAT_X, (BOARD3D_TABLE_HEIGHT / BOARD3D_TABLE_WIDTH) * FELT_REPEAT_X);
  tex.anisotropy = anisotropy;
  return tex;
}

/**
 * Center-table emblem: geometric Poké Ball line art in warm gold, drawn on a
 * transparent canvas. Replaces the raster PNG so the table needs no image
 * asset and stays crisp at any DPR.
 */
export function createCenterEmblemTexture(anisotropy: number): CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('board3dSceneSkin: 2d context unavailable');
  }
  const c = size / 2;

  const gold = (alpha: number) => `rgba(213,183,130,${alpha})`;

  // Soft dark halo grounds the medallion into the felt so the gold reads as
  // an inlay rather than a glowing sticker.
  const halo = ctx.createRadialGradient(c, c, 80, c, c, 248);
  halo.addColorStop(0, 'rgba(5,9,16,0.18)');
  halo.addColorStop(0.55, 'rgba(5,9,16,0.09)');
  halo.addColorStop(1, 'rgba(5,9,16,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size, size);

  // Ornamental double ring — restrained line weight.
  ctx.strokeStyle = gold(0.55);
  ctx.lineWidth = 2.25;
  ctx.beginPath();
  ctx.arc(c, c, 225, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = gold(0.2);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(c, c, 213, 0, Math.PI * 2);
  ctx.stroke();

  // Cardinal diamond ticks on the outer ring.
  ctx.fillStyle = gold(0.4);
  for (let i = 0; i < 4; i++) {
    const a = (Math.PI / 2) * i;
    const x = c + Math.cos(a) * 225;
    const y = c + Math.sin(a) * 225;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 0);
    ctx.lineTo(0, 7);
    ctx.lineTo(-5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Ball halves — whisper-faint warm top / cool bottom tint.
  const r = 150;
  ctx.fillStyle = 'rgba(213,183,130,0.055)';
  ctx.beginPath();
  ctx.arc(c, c, r, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(127,168,216,0.05)';
  ctx.beginPath();
  ctx.arc(c, c, r, 0, Math.PI);
  ctx.closePath();
  ctx.fill();

  // Ball outline + band.
  ctx.strokeStyle = gold(0.8);
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.arc(c, c, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(c - r, c);
  ctx.lineTo(c + r, c);
  ctx.stroke();

  // Center button.
  ctx.fillStyle = 'rgba(14,19,30,0.55)';
  ctx.strokeStyle = gold(0.8);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(c, c, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = gold(0.72);
  ctx.beginPath();
  ctx.arc(c, c, 12, 0, Math.PI * 2);
  ctx.fill();

  const tex = new CanvasTexture(canvas);
  tex.anisotropy = anisotropy;
  tex.colorSpace = SRGBColorSpace;
  return tex;
}
