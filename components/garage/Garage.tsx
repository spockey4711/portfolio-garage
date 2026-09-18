"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { REST_FOV, REST_VIEW, views } from "@/lib/garage/hotspots";
import { CameraRig } from "./CameraRig";
import { Scene } from "./Scene";

// The 3D layer on the start page. Everything it shows also exists in 2D below
// it (docs/KONZEPT.md §5); the canvas is decoration for capable devices and
// the static fallback of week 2 replaces it elsewhere.
export function Garage() {
  const rest = views[REST_VIEW];

  return (
    <Canvas
      camera={{ position: rest.camera, fov: REST_FOV, near: 0.05, far: 30 }}
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      className="h-full w-full"
    >
      <color attach="background" args={["#1a1a1a"]} />
      {/* Blockout only: lighting is baked from week 2 on (see Scene.tsx). */}
      <hemisphereLight args={["#ffffff", "#444444", 2]} />
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
      <CameraRig />
    </Canvas>
  );
}
