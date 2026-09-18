import type { Object3D } from "three";
import type { FocusViewId, View } from "./hotspots";

// The export keeps Blender's object names (skill blender-export), and they
// are the only link between a view and its geometry: never an index.

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
