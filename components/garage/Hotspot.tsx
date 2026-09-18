"use client";

import { Html, useCursor } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useMemo } from "react";
import { Box3, type Object3D, Vector3 } from "three";
import { getGarageContent } from "@/content/garage";
import type { FocusViewId, View } from "@/lib/garage/hotspots";
import { openView } from "@/lib/garage/navigate";
import { hotspotObject } from "@/lib/garage/screen";
import { isDriving, useGarageStore } from "@/lib/garage/store";
import { defaultLocale } from "@/lib/i18n";

/**
 * Smallest click target in metres per axis. The bike computer is 9 by 2 by
 * 6 cm and stands 4 m from the rest camera, so the mesh alone is a few
 * pixels; the box around it is what the pointer actually hits.
 */
const MIN_HIT_SIZE_M = 0.35;

/** Gap between the top of the object and its label. */
const LABEL_GAP_M = 0.08;

interface HotspotProps {
  readonly view: View<FocusViewId>;
  /** The loaded GLB; the hotspot looks up its mesh by name in here. */
  readonly scene: Object3D;
}

// One clickable spot in the garage: an invisible box around the mesh that
// takes the pointer events, plus the hover label. Clicking writes ?view=,
// which ViewSync.tsx turns into the camera drive; the store never learns
// about the click directly, so a deep link behaves exactly like a click.
export function Hotspot({ view, scene }: HotspotProps) {
  const hovered = useGarageStore((state) => state.hovered === view.id);
  // Seen from inside, the padded box fills much of the frame and would swallow
  // the click into nothing that leaves; the current hotspot has no box at all.
  const isCurrent = useGarageStore((state) => state.view === view.id);
  const hover = useGarageStore((state) => state.hover);
  const label = getGarageContent(defaultLocale).hotspots[view.id].label;

  const { center, size, labelPosition } = useMemo(() => {
    const box = new Box3().setFromObject(hotspotObject(view, scene));
    const center = box.getCenter(new Vector3());
    const size = box.getSize(new Vector3());
    const labelPosition = new Vector3(
      center.x,
      box.max.y + LABEL_GAP_M,
      center.z,
    );
    size.x = Math.max(size.x, MIN_HIT_SIZE_M);
    size.y = Math.max(size.y, MIN_HIT_SIZE_M);
    size.z = Math.max(size.z, MIN_HIT_SIZE_M);
    return { center, size, labelPosition };
  }, [scene, view]);

  useCursor(hovered);

  // While the camera moves the box is inert (KONZEPT §4).
  const isActive = () => !isDriving(useGarageStore.getState().phase);

  const onPointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (isActive()) hover(view.id);
  };

  const onPointerOut = () => {
    if (useGarageStore.getState().hovered === view.id) hover(null);
  };

  const onClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (isActive()) openView(view);
  };

  return (
    <group>
      {!isCurrent && (
        <mesh
          position={center}
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
          onClick={onClick}
        >
          <boxGeometry args={[size.x, size.y, size.z]} />
          {/* Not drawn, still raycast: three skips invisible materials in render. */}
          <meshBasicMaterial visible={false} />
        </mesh>
      )}
      {hovered && (
        <Html position={labelPosition} center pointerEvents="none">
          <span className="rounded-full bg-zinc-900/90 px-3 py-1 text-sm whitespace-nowrap text-white select-none">
            {label}
          </span>
        </Html>
      )}
    </group>
  );
}
