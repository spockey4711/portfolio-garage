import { Mesh, type Object3D } from "three";
import type { FocusViewId, ScreenViewId, View } from "./hotspots";

// The export keeps Blender's object names (skill blender-export), and they
// are the only link between a view and its geometry: never an index.

function objectNamed(name: string | null, scene: Object3D, what: string) {
  const object = name === null ? undefined : scene.getObjectByName(name);
  if (!object) {
    throw new Error(`${what}: ${name} not in the GLB`);
  }
  return object;
}

/**
 * The GLB object a hotspot is anchored to, by the name the export kept. It
 * may be a group whose children are the geometry, like the laptop's base and
 * lid, so callers that need meshes traverse it.
 */
export function hotspotObject(
  view: View<FocusViewId>,
  scene: Object3D,
): Object3D {
  return objectNamed(view.mesh, scene, `Hotspot ${view.id}`);
}

/** Every mesh under `object`, `object` itself included when it is one. */
export function meshesOf(object: Object3D): Mesh[] {
  const meshes: Mesh[] = [];
  object.traverse((child) => {
    if (child instanceof Mesh) meshes.push(child);
  });
  return meshes;
}

/** The display mesh a screen view renders on. */
export function displayMesh(view: View<ScreenViewId>, scene: Object3D): Mesh {
  const object = objectNamed(view.display, scene, `Screen ${view.id}`);
  if (!(object instanceof Mesh)) {
    throw new Error(`Screen ${view.id}: ${view.display} is not a mesh`);
  }
  return object;
}
