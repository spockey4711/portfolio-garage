"use client";

import { Html } from "@react-three/drei";
import { useMemo, type PointerEvent, type SyntheticEvent } from "react";
import type { Object3D } from "three";
import type { ScreenViewId, View } from "@/lib/garage/hotspots";
import { displayMesh, occludersOf } from "@/lib/garage/glb";
import { screenPlaneFor } from "@/lib/garage/screen";
import { useGarageStore } from "@/lib/garage/store";
import { screens } from "./screens";

interface ScreenProps {
  readonly view: View<ScreenViewId>;
  /**
   * The loaded GLB; the screen sits on the display mesh found in here and
   * hides behind the rest of it. The hotspot click boxes are siblings of the
   * GLB, not children, so they never occlude.
   */
  readonly scene: Object3D;
}

/** drei scales <Html transform> so that one CSS pixel is distanceFactor / 400 metres. */
const DREI_PX_PER_DISTANCE_FACTOR = 400;

// A React tree on a display surface (docs/KONZEPT.md §5: DOM, not texture).
// The DOM is real, so it is sharp at any zoom and its controls are ordinary
// controls once the camera is there. Until then it is scenery: no pointer
// events, so a click on it is a click on the hotspot box behind it, and
// inert, so Tab and screen readers skip it (KONZEPT §4).
export function Screen({ view, scene }: ScreenProps) {
  const isOpen = useGarageStore(
    (state) => state.phase === "focused" && state.view === view.id,
  );
  const { Component, pxWidth } = screens[view.id];

  const { plane, occlude } = useMemo(() => {
    const display = displayMesh(view, scene);
    return {
      plane: screenPlaneFor(display, view.camera),
      occlude: occludersOf(display, scene).map((mesh) => ({ current: mesh })),
    };
  }, [scene, view]);

  const pxHeight = Math.round((pxWidth * plane.height) / plane.width);
  const distanceFactor = (DREI_PX_PER_DISTANCE_FACTOR * plane.width) / pxWidth;

  return (
    <Html
      transform
      occlude={occlude}
      position={plane.position}
      quaternion={plane.quaternion}
      distanceFactor={distanceFactor}
      pointerEvents={isOpen ? "auto" : "none"}
    >
      <div
        style={{ width: pxWidth, height: pxHeight }}
        className="overflow-hidden"
        inert={!isOpen}
        {...keepPointerEventsInside}
      >
        <Component />
      </div>
    </Html>
  );
}

// drei portals the DOM into the canvas wrapper, which is also where fiber
// listens for pointer events. Left alone, a click inside the open screen
// would bubble up, hit no hotspot (the open one has no box) and count as
// the click into the void that leaves the view. What happens on a screen
// stays on the screen.
function stop(event: SyntheticEvent | PointerEvent) {
  event.stopPropagation();
}

const keepPointerEventsInside = {
  onPointerDown: stop,
  onPointerUp: stop,
  onPointerMove: stop,
  onClick: stop,
  onDoubleClick: stop,
  onContextMenu: stop,
  onWheel: stop,
} as const;
