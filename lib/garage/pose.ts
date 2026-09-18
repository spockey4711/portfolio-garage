import { Matrix4, type Object3D, Quaternion, Vector3 } from "three";
import { displayMesh } from "./glb";
import { isScreenView, type Vec3, type View } from "./hotspots";
import { screenPlaneFor } from "./screen";

// Where a view's camera ends up. Position and target come from Blender
// (hotspots.ts); what is missing is the roll. A camera that takes world Y as
// up shows a display that is not aligned with the room, like the bike
// computer on the turned bike, a few degrees askew. So a screen view takes
// the display's own up, which screen.ts already derives from the GLB, and
// the display's vertical edge stays vertical on the viewer's screen. Every
// other view looks at a wall or the room and keeps world Y.

const WORLD_UP = new Vector3(0, 1, 0);

/** The world direction a view's camera holds as up. */
export function cameraUp(view: View, scene: Object3D): Vector3 {
  if (!isScreenView(view)) return WORLD_UP.clone();
  const plane = screenPlaneFor(displayMesh(view, scene), view.camera);
  return new Vector3(0, 1, 0).applyQuaternion(plane.quaternion);
}

/** The orientation a camera at `position` has when it looks at `target`. */
export function lookAtQuaternion(
  position: Vec3,
  target: Vec3,
  up: Vector3 = WORLD_UP,
): Quaternion {
  const matrix = new Matrix4().lookAt(
    new Vector3(...position),
    new Vector3(...target),
    up,
  );
  return new Quaternion().setFromRotationMatrix(matrix);
}

/** The orientation a view's camera has once it has arrived. */
export function viewQuaternion(view: View, scene: Object3D): Quaternion {
  return lookAtQuaternion(view.camera, view.target, cameraUp(view, scene));
}
