"use client";

import { Html } from "@react-three/drei";
import {
  useMemo,
  type PointerEvent,
  type RefObject,
  type SyntheticEvent,
} from "react";
import { Mesh, type Object3D } from "three";
import type { ScreenViewId, View } from "@/lib/garage/hotspots";
import { hotspotObject, screenPlaneFor } from "@/lib/garage/screen";
import { useGarageStore } from "@/lib/garage/store";
import { screens } from "./screens";

interface ScreenProps {
  readonly view: View<ScreenViewId>;
  /** The loaded GLB; the screen sits on the display mesh found in here. */
  readonly scene: Object3D;
  /** What may hide the screen: the room's geometry, never the click boxes. */
  readonly occlude: ReadonlyArray<RefObject<Object3D>>;
}

/** drei scales <Html transform> so that one CSS pixel is distanceFactor / 400 metres. */
const DREI_PX_PER_DISTANCE_FACTOR = 400;

// A React tree on a display surface (docs/KONZEPT.md §5: DOM, not texture).
// The DOM is real, so it is sharp at any zoom and its controls are ordinary
// controls once the camera is there. Until then it is scenery: no pointer
// events, so a click on it is a click on the hotspot box behind it, and
// inert, so Tab and screen readers skip it (KONZEPT §4).
export function Screen({ view, scene, occlude }: ScreenProps) {
  const isOpen = useGarageStore(
    (state) => state.phase === "focused" && state.view === view.id,
  );
  const { Component, pxWidth } = screens[view.id];

  const plane = useMemo(() => {
    const object = hotspotObject(view, scene);
    if (!(object instanceof Mesh)) {
      throw new Error(`Screen ${view.id}: ${view.mesh} is not a mesh`);
    }
    return screenPlaneFor(object, view.camera);
  }, [scene, view]);

  const pxHeight = Math.round((pxWidth * plane.height) / plane.width);
  const distanceFactor = (DREI_PX_PER_DISTANCE_FACTOR * plane.width) / pxWidth;

  return (
    <Html
      transform
      occlude={occlude as RefObject<Object3D>[]}
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
