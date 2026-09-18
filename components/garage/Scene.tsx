"use client";

import { useGLTF } from "@react-three/drei";
import { useLayoutEffect } from "react";
import { Mesh, MeshLambertMaterial } from "three";
import { focusViews } from "@/lib/garage/hotspots";
import { Hotspot } from "./Hotspot";

export const GARAGE_MODEL_URL = "/models/garage.glb";

// The blockout GLB carries no materials, and the lighting will be baked into
// a lightmap (docs/KONZEPT.md §5), so the web scene has no lights of its own.
// Until the first bake exists, the meshes get flat placeholder materials and
// Garage.tsx adds a hemisphere light so the boxes read as a room at all.
// Both go away with the bake in week 2; nothing else depends on them.
const blockoutColors: ReadonlyArray<readonly [prefix: string, color: string]> =
  [
    ["Boden", "#5b5b5b"],
    ["Decke", "#8a8a8a"],
    ["Wand", "#9a9a9a"],
    ["Pfeiler", "#9a9a9a"],
    ["Sturz", "#9a9a9a"],
    ["Tor", "#b8b8b8"],
    ["Fenster", "#cfe4ee"],
    ["Werkbank", "#a67c52"],
    ["Rad_", "#d94b3d"],
    ["Radcomputer", "#1c1c1c"],
    ["Laptop", "#2b2b2b"],
    ["Staender", "#3a3a3a"],
    ["Whiteboard", "#f2f2f2"],
    ["Pinnwand", "#b98e5a"],
    ["Werkzeugwand", "#6b4a2b"],
    ["Karton", "#c9a36b"],
    ["Schrank", "#4a5563"],
  ];

function colorFor(name: string): string {
  return (
    blockoutColors.find(([prefix]) => name.startsWith(prefix))?.[1] ?? "#8a8a8a"
  );
}

export function Scene() {
  const { scene } = useGLTF(GARAGE_MODEL_URL);

  useLayoutEffect(() => {
    scene.traverse((object) => {
      if (object instanceof Mesh) {
        object.material = new MeshLambertMaterial({
          color: colorFor(object.name),
          flatShading: true,
        });
      }
    });
  }, [scene]);

  return (
    <>
      <primitive object={scene} />
      {focusViews.map((view) => (
        <Hotspot key={view.id} view={view} scene={scene} />
      ))}
    </>
  );
}

useGLTF.preload(GARAGE_MODEL_URL);
