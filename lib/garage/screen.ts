import { Matrix4, type Mesh, type Object3D, Quaternion, Vector3 } from "three";
import type { FocusViewId, Vec3, View } from "./hotspots";

// Where a screen's DOM sits in the room. The display face is derived from
// the display mesh in the GLB instead of being written down a second time:
// Blender already knows where the panel is, how big it is and how it is
// tilted, and a remodelled laptop lid moves the React tree with it. The
// rule is the same for every device: the face is the thin side of the
// mesh's bounding box that looks at the view's camera, and "up" is
// whichever in-plane edge points closest to the ceiling.

/**
 * How far in front of the face the DOM floats, in metres. Enough that the
 * occlusion ray reaches the DOM before it reaches the panel, too little to
 * show as a gap from the side.
 */
export const SCREEN_LIFT_M = 0.001;

export interface ScreenPlane {
  /** World centre of the display face, lifted by SCREEN_LIFT_M. */
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

  const size = box.getSize(new Vector3());
  const centre = box.getCenter(new Vector3());
  const sizeOf = (axis: Axis) => size.getComponent(axis);
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
    .addScaledVector(unit(thin, 1), (side * sizeOf(thin)) / 2)
    .applyMatrix4(world)
    .addScaledVector(normal, SCREEN_LIFT_M);

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

/** The GLB object a hotspot is anchored to, by the name the export kept. */
export function hotspotObject(
  view: View<FocusViewId>,
  scene: Object3D,
): Object3D {
  const object =
    view.mesh === null ? undefined : scene.getObjectByName(view.mesh);
  if (!object) {
    throw new Error(`Hotspot ${view.id}: mesh ${view.mesh} not in the GLB`);
  }
  return object;
}
