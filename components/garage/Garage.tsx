"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import { REST_FOV, REST_VIEW, views } from "@/lib/garage/hotspots";
import { SKY_COLOR } from "@/lib/garage/lightmap";
import { closeView } from "@/lib/garage/navigate";
import { useGarageStore } from "@/lib/garage/store";
import { CameraRig } from "./CameraRig";
import { Scene } from "./Scene";

/** Pixel ratio the canvas starts at: the device's, capped, 3x phones gain nothing over 2x. */
const MAX_DPR = 2;
/** Below 1 the scene visibly blurs; a device that cannot hold this gets the still instead. */
const MIN_DPR = 1;

/** Maps the monitor's 0..1 factor onto the DPR range, in quarter steps so it does not flicker. */
function dprFor(factor: number): number {
  const ceiling = Math.max(MIN_DPR, Math.min(window.devicePixelRatio, MAX_DPR));
  return Math.round((MIN_DPR + (ceiling - MIN_DPR) * factor) * 4) / 4;
}

// The 3D layer on the start page. Everything it shows also exists in 2D below
// it (docs/KONZEPT.md §5); the canvas is decoration for capable devices and
// the static fallback of week 2 replaces it elsewhere.
export function Garage() {
  const rest = views[REST_VIEW];

  // KONZEPT §5 budget: when the frame rate drops, the canvas draws fewer
  // pixels before anything else gives. The monitor starts at full resolution
  // and steps down; a device that keeps flipping settles at the floor.
  const [dpr, setDpr] = useState(() => dprFor(1));

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
      dpr={dpr}
      // HoverOutline.tsx renders through a multisampled composer instead,
      // which also owns the tone mapping.
      gl={{ antialias: false, powerPreference: "high-performance" }}
      className="h-full w-full"
    >
      <PerformanceMonitor
        factor={1}
        onChange={({ factor }) => setDpr(dprFor(factor))}
        onFallback={() => setDpr(MIN_DPR)}
      />
      {/* No lights: the scene is lit by its baked atlas (Scene.tsx). */}
      <color attach="background" args={[SKY_COLOR]} />
      <Suspense fallback={null}>
        <Scene />
        <CameraRig />
      </Suspense>
    </Canvas>
  );
}
