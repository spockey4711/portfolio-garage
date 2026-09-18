"use client";

import { EffectComposer, Outline } from "@react-three/postprocessing";
import { useMemo } from "react";
import type { Object3D } from "three";
import { hotspotObject } from "@/lib/garage/glb";
import { isFocusView, views } from "@/lib/garage/hotspots";
import { useGarageStore } from "@/lib/garage/store";

interface HoverOutlineProps {
  /** The loaded GLB; the outline traces the hovered hotspot's object in here. */
  readonly scene: Object3D;
}

// The outline of docs/KONZEPT.md §4: hovering a hotspot (or reaching it with
// Tab) traces its geometry so the scene reads as clickable. This is the only
// postprocessing in the garage, and the composer replaces the default render
// pass, so the canvas leaves antialiasing to the composer's multisampling.
export function HoverOutline({ scene }: HoverOutlineProps) {
  const hovered = useGarageStore((state) => state.hovered);

  const selection = useMemo(() => {
    if (hovered === null || !isFocusView(hovered)) return [];
    return [hotspotObject(views[hovered], scene)];
  }, [hovered, scene]);

  return (
    <EffectComposer multisampling={4} autoClear={false}>
      <Outline
        selection={selection}
        visibleEdgeColor="#ffffff"
        hiddenEdgeColor="#ffffff"
        edgeStrength={3}
        blur
      />
    </EffectComposer>
  );
}
