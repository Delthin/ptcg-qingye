import { useEffect, useMemo } from 'react';
import {
  BoxGeometry,
  DoubleSide,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
} from 'three';
import { Select } from '@react-three/postprocessing';
import { useThree } from '@react-three/fiber';
import { ZONE_POSITIONS } from './board-3d-zone-positions';
import { BOARD_3D_CENTER_EMBLEM_SIZE, BOARD_3D_CENTER_EMBLEM_Y } from './board3d-constants';
import {
  BOARD3D_SCENE_PALETTE,
  BOARD3D_TABLE_CENTER_Z,
  BOARD3D_TABLE_HEIGHT,
  BOARD3D_TABLE_THICKNESS,
  BOARD3D_TABLE_WIDTH,
  buildCenterLineGeometry,
  buildFieldInlayGeometry,
  buildTableRailGeometry,
  createCenterEmblemTexture,
  createFeltBumpTexture,
  createFeltWeaveTexture,
} from './board3dSceneSkin';

/** Accent lines sit just above the felt but below every card / drop plane (y=0.1). */
const ACCENT_LINE_Y = 0.05;

export type Board3dStaticSceneProps = {
  /** When true, emblem is wrapped in postprocessing {@link Select} for selective bloom. */
  bloomActive?: boolean;
};

export function Board3dStaticScene({ bloomActive = false }: Board3dStaticSceneProps) {
  const maxAnisotropy = useThree((s) => s.gl.capabilities.getMaxAnisotropy());

  const feltTexture = useMemo(() => createFeltWeaveTexture(maxAnisotropy), [maxAnisotropy]);
  const feltBumpTexture = useMemo(() => createFeltBumpTexture(maxAnisotropy), [maxAnisotropy]);
  const emblemTexture = useMemo(() => createCenterEmblemTexture(maxAnisotropy), [maxAnisotropy]);

  const feltMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: BOARD3D_SCENE_PALETTE.felt,
        map: feltTexture,
        bumpMap: feltBumpTexture,
        bumpScale: 0.05,
        roughness: 0.96,
        metalness: 0,
      }),
    [feltTexture, feltBumpTexture]
  );

  const slabSideMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: BOARD3D_SCENE_PALETTE.slabSide,
        roughness: 0.7,
        metalness: 0,
      }),
    []
  );

  const railMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: BOARD3D_SCENE_PALETTE.railWood,
        roughness: 0.55,
        metalness: 0,
      }),
    []
  );

  const inlayMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: BOARD3D_SCENE_PALETTE.brass,
        roughness: 0.38,
        metalness: 0.85,
      }),
    []
  );

  const centerLineMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: BOARD3D_SCENE_PALETTE.lineAmber,
        transparent: true,
        opacity: 0.32,
        side: DoubleSide,
        forceSinglePass: true,
        depthTest: true,
        depthWrite: false,
      }),
    []
  );

  const emblemMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        map: emblemTexture,
        transparent: true,
        forceSinglePass: true,
        depthTest: true,
        depthWrite: false,
        side: DoubleSide,
        /** Skip renderer tone mapping so the gold line art keeps its hue. */
        toneMapped: false,
      }),
    [emblemTexture]
  );

  // Box material order: +x, -x, +y (felt top), -y, +z, -z.
  const slabMaterials = useMemo(
    () => [
      slabSideMaterial,
      slabSideMaterial,
      feltMaterial,
      slabSideMaterial,
      slabSideMaterial,
      slabSideMaterial,
    ],
    [slabSideMaterial, feltMaterial]
  );

  const slabGeometry = useMemo(() => {
    // Top face at y = 0, matching the legacy board plane.
    const g = new BoxGeometry(BOARD3D_TABLE_WIDTH, BOARD3D_TABLE_THICKNESS, BOARD3D_TABLE_HEIGHT);
    g.translate(0, -BOARD3D_TABLE_THICKNESS / 2, BOARD3D_TABLE_CENTER_Z);
    return g;
  }, []);

  const railGeometry = useMemo(() => buildTableRailGeometry(), []);
  const inlayGeometry = useMemo(() => buildFieldInlayGeometry(), []);
  const emblemPlaneGeometry = useMemo(
    () => new PlaneGeometry(BOARD_3D_CENTER_EMBLEM_SIZE, BOARD_3D_CENTER_EMBLEM_SIZE),
    []
  );

  const midX = (ZONE_POSITIONS.bottomPlayer.active.x + ZONE_POSITIONS.topPlayer.active.x) / 2;
  const midZ = (ZONE_POSITIONS.bottomPlayer.active.z + ZONE_POSITIONS.topPlayer.active.z) / 2;

  const centerLineGeometry = useMemo(
    () => buildCenterLineGeometry(midZ, ACCENT_LINE_Y),
    [midZ]
  );

  useEffect(() => {
    return () => {
      slabGeometry.dispose();
      railGeometry.dispose();
      inlayGeometry.dispose();
      centerLineGeometry.dispose();
      emblemPlaneGeometry.dispose();
      feltMaterial.dispose();
      slabSideMaterial.dispose();
      railMaterial.dispose();
      inlayMaterial.dispose();
      centerLineMaterial.dispose();
      emblemMaterial.dispose();
      feltTexture.dispose();
      feltBumpTexture.dispose();
      emblemTexture.dispose();
    };
  }, [
    slabGeometry,
    railGeometry,
    inlayGeometry,
    centerLineGeometry,
    emblemPlaneGeometry,
    feltMaterial,
    slabSideMaterial,
    railMaterial,
    inlayMaterial,
    centerLineMaterial,
    emblemMaterial,
    feltTexture,
    feltBumpTexture,
    emblemTexture,
  ]);

  const emblemMesh = (
    <mesh
      geometry={emblemPlaneGeometry}
      material={emblemMaterial}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[midX, BOARD_3D_CENTER_EMBLEM_Y, midZ]}
      renderOrder={50}
      receiveShadow={false}
    />
  );

  return (
    <>
      {/*
       * No scene fog on purpose: the aspect-fit cameras (especially phone)
       * sit far enough back that depth fog would tint the far card rows and
       * the toneMapped:false emblem toward the room color. Atmosphere is
       * carried by the Board3DCanvas CSS room gradient + vignette instead.
       */}
      <group>
        {/* Table slab — felt top with real thickness. */}
        <mesh geometry={slabGeometry} material={slabMaterials} receiveShadow={false} />

        {/* Walnut perimeter rail. */}
        <mesh geometry={railGeometry} material={railMaterial} receiveShadow={false} />

        {/* Brass inlay marking the play-field boundary. */}
        <mesh geometry={inlayGeometry} material={inlayMaterial} receiveShadow={false} />

        {/* Amber battle line through midfield, broken by the emblem. */}
        <mesh
          geometry={centerLineGeometry}
          material={centerLineMaterial}
          renderOrder={-1}
          userData={{ isBoardGrid: true }}
        />

        {bloomActive ? <Select enabled>{emblemMesh}</Select> : emblemMesh}
      </group>
    </>
  );
}
