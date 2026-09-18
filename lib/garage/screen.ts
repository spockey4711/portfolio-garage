import { Matrix4, type Mesh, Quaternion, Vector3 } from "three";
import type { Vec3 } from "./hotspots";

// Where a screen's DOM sits in the room. The display face is derived from
// the display mesh in the GLB instead of being written down a second time:
// Blender already knows where the panel is, how big it is and how it is
// tilted, and a remodelled laptop lid moves the React tree with it. The
// rule is the same for every device: the face is the thin side of the
// mesh's bounding box that looks at the view's camera, and "up" is
// whichever in-plane edge points closest to the ceiling. The DOM sits
// exactly on the face, so it covers the panel pixel for pixel; the display
// mesh therefore never counts as an occluder of its own screen (glb.ts).

export interface ScreenPlane {
  /** World centre of the display face. */
  readonly position: Vector3;
  /** World rotation; local +z is the face normal, local +y is up. */
  readonly quaternion: Quaternion;
  /** Extent of the face along its local x, in metres. */
  readonly width: number;
  /** Extent of the face along its local y, in metres. */
  readonly height: number;
}

type Axis = 0 | 1 | 2;

const AXES: readonly Axis[] = [0, 1, 2];

function unit(axis: Axis, sign: 1 | -1): Vector3 {
  const v = new Vector3();
  v.setComponent(axis, sign);
  return v;
}

/** The display face of `mesh` as seen from `camera` (world coordinates). */
export function screenPlaneFor(mesh: Mesh, camera: Vec3): ScreenPlane {
  const geometry = mesh.geometry;
  if (geometry.boundingBox === null) geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (box === null || box.isEmpty()) {
    throw new Error(`screenPlaneFor: ${mesh.name} has no geometry`);
  }
  mesh.updateWorldMatrix(true, false);
  const world = mesh.matrixWorld;

  // The box is in mesh space; the optimised GLB carries the quantisation
  // scale on the node (scripts/optimize-glb.mts), so extents are measured
  // in world metres and only the offset to the face stays local.
  const localSize = box.getSize(new Vector3());
  const centre = box.getCenter(new Vector3());
  const scale = new Vector3().setFromMatrixScale(world);
  const sizeOf = (axis: Axis) =>
    localSize.getComponent(axis) * scale.getComponent(axis);
  const thin = AXES.reduce((a, b) => (sizeOf(b) < sizeOf(a) ? b : a));
  const inPlane = AXES.filter((axis) => axis !== thin);

  // The face is the side of the thin axis that faces the camera.
  const toCamera = new Vector3(...camera).sub(
    centre.clone().applyMatrix4(world),
  );
  const normal = unit(thin, 1).transformDirection(world);
  let side: 1 | -1 = 1;
  if (normal.dot(toCamera) < 0) {
    normal.negate();
    side = -1;
  }
  const position = centre
    .clone()
    .addScaledVector(unit(thin, 1), (side * localSize.getComponent(thin)) / 2)
    .applyMatrix4(world);

  // Up is whichever in-plane edge, in either direction, rises the most.
  let up = new Vector3();
  let upAxis: Axis = inPlane[0];
  for (const axis of inPlane) {
    for (const sign of [1, -1] as const) {
      const candidate = unit(axis, sign).transformDirection(world);
      if (candidate.y > up.y) {
        up = candidate;
        upAxis = axis;
      }
    }
  }
  const widthAxis = inPlane.find((axis) => axis !== upAxis) ?? inPlane[0];

  const right = new Vector3().crossVectors(up, normal);
  const quaternion = new Quaternion().setFromRotationMatrix(
    new Matrix4().makeBasis(right, up, normal),
  );

  return {
    position,
    quaternion,
    width: sizeOf(widthAxis),
    height: sizeOf(upAxis),
  };
}
