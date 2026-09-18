"use client";

import { useGLTF, useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { focusViews, screenViews } from "@/lib/garage/hotspots";
import {
  LIGHTMAP_URL,
  applyLightmap,
  prepareLightmap,
} from "@/lib/garage/lightmap";
import { Hotspot } from "./Hotspot";
import { HoverOutline } from "./HoverOutline";
import { Screen } from "./Screen";

export const GARAGE_MODEL_URL = "/models/garage.glb";

// Materials and geometry come with the GLB (Blender palette, docs/KONZEPT.md
// §2), the light comes baked in the atlas next to it (KONZEPT §5, see
// lib/garage/lightmap.ts). Nothing here is lit at runtime.
export function Scene() {
  const { scene } = useGLTF(GARAGE_MODEL_URL);
  const maxAnisotropy = useThree((state) =>
    state.gl.capabilities.getMaxAnisotropy(),
  );
  const texture = useTexture(LIGHTMAP_URL);

  // Both run during render, before drei uploads the texture in an effect.
  // useGLTF caches the scene across mounts; the swap is idempotent, so a second
  // mount sees the atlas already in place and leaves it.
  const lightmap = useMemo(
    () => prepareLightmap(texture, maxAnisotropy),
    [texture, maxAnisotropy],
  );
  useMemo(() => applyLightmap(scene, lightmap), [scene, lightmap]);

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
useTexture.preload(LIGHTMAP_URL);
