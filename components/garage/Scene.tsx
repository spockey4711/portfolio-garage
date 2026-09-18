"use client";

import { useGLTF } from "@react-three/drei";
import { focusViews, screenViews } from "@/lib/garage/hotspots";
import { Hotspot } from "./Hotspot";
import { HoverOutline } from "./HoverOutline";
import { Screen } from "./Screen";

export const GARAGE_MODEL_URL = "/models/garage.glb";

// Materials come with the GLB (Blender palette, docs/KONZEPT.md §2). Lighting
// will be baked into a lightmap (KONZEPT §5); until the first bake exists,
// Garage.tsx adds placeholder lights so the PBR materials read at all.
export function Scene() {
  const { scene } = useGLTF(GARAGE_MODEL_URL);

  return (
    <>
      <primitive object={scene} />
      {focusViews.map((view) => (
        <Hotspot key={view.id} view={view} scene={scene} />
      ))}
      {screenViews.map((view) => (
        <Screen key={view.id} view={view} scene={scene} />
      ))}
      <HoverOutline scene={scene} />
    </>
  );
}

useGLTF.preload(GARAGE_MODEL_URL);
