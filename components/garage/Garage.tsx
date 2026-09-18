"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import { REST_FOV, REST_VIEW, views } from "@/lib/garage/hotspots";
import { SKY_COLOR } from "@/lib/garage/lightmap";
import { closeView } from "@/lib/garage/navigate";
import { useGarageStore } from "@/lib/garage/store";
import { CameraRig } from "./CameraRig";
import { Scene } from "./Scene";

interface GarageProps {
  /** Called once the scene has been drawn, so the hero can show the canvas. */
  readonly onReady: () => void;
}

// The 3D layer on the start page. Everything it shows also exists in 2D below
// it (docs/KONZEPT.md §5); the canvas is decoration for capable devices,
// elsewhere the still (GarageStill.tsx) is the whole picture. It mounts over
// the still and clears to the sky before the GLB is in, so the hero keeps it
// invisible until onReady, or the still would flash to sky and back.
export function Garage({ onReady }: GarageProps) {
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
      // HoverOutline.tsx renders through a multisampled composer instead,
      // which also owns the tone mapping.
      gl={{ antialias: false, powerPreference: "high-performance" }}
      className="h-full w-full"
    >
      {/* No lights: the scene is lit by its baked atlas (Scene.tsx). */}
      <color attach="background" args={[SKY_COLOR]} />
      <Suspense fallback={null}>
        <Scene />
        <CameraRig />
        <SceneDrawn onDrawn={onReady} />
      </Suspense>
    </Canvas>
  );
}

// Mounts with the scene, once its GLB and atlas are in. useFrame runs before
// the frame it belongs to is rendered, so the second call is the first that
// follows a presented frame with the model in it.
function SceneDrawn({ onDrawn }: { readonly onDrawn: () => void }) {
  const frames = useRef(0);
  useFrame(() => {
    frames.current += 1;
    if (frames.current === 2) onDrawn();
  });
  return null;
}
