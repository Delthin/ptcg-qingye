import { BufferGeometry, PlaneGeometry } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Four flat border strips in one draw, with the same outer bounds as the former four meshes. */
export function createBoard3dOutlineGeometry(width: number, height: number, thickness: number): BufferGeometry {
  const parts = [
    new PlaneGeometry(width + thickness * 2, thickness).translate(0, (height + thickness) / 2, 0),
    new PlaneGeometry(width + thickness * 2, thickness).translate(0, -(height + thickness) / 2, 0),
    new PlaneGeometry(thickness, height).translate(-(width + thickness) / 2, 0, 0),
    new PlaneGeometry(thickness, height).translate((width + thickness) / 2, 0, 0),
  ];
  const merged = mergeGeometries(parts, false);
  parts.forEach(part => part.dispose());
  if (!merged) throw new Error('Cannot merge board outline');
  return merged;
}
