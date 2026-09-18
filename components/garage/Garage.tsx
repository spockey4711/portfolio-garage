"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { REST_FOV, REST_VIEW, views } from "@/lib/garage/hotspots";
import { closeView } from "@/lib/garage/navigate";
import { useGarageStore } from "@/lib/garage/store";
import { CameraRig } from "./CameraRig";
import { Scene } from "./Scene";

// The 3D layer on the start page. Everything it shows also exists in 2D below
// it (docs/KONZEPT.md §5); the canvas is decoration for capable devices and
// the static fallback of week 2 replaces it elsewhere.
export function Garage() {
  const rest = views[REST_VIEW];

  // A click that hits no hotspot leaves a focused one (KONZEPT §4). At rest
  // it does nothing, and during a drive it is ignored so the click that
  // started the drive cannot also end it.
  const onPointerMissed = () => {
    if (useGarageStore.getState().phase === "focused") closeView();
  };

  return (
    <Canvas
      camera={{ position: rest.camera, fov: REST_FOV, near: 0.05, far: 30 }}
      onPointerMissed={onPointerMissed}
      dpr={[1, 2]}
      // HoverOutline.tsx renders through a multisampled composer instead.
      gl={{ antialias: false, powerPreference: "high-performance" }}
      className="h-full w-full"
    >
      <color attach="background" args={["#1a1a1a"]} />
      {/* Placeholder until the bake: daylight through the gate (see Scene.tsx). */}
      <hemisphereLight args={["#dfe6ee", "#3a3632", 1.2]} />
      <directionalLight position={[-2, 6, 8]} intensity={2.5} />
      <Suspense fallback={null}>
        <Scene />
        <CameraRig />
      </Suspense>
    </Canvas>
  );
}
