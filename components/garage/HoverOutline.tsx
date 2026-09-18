"use client";

import { EffectComposer, Outline } from "@react-three/postprocessing";
import { useThree } from "@react-three/fiber";
import type { EffectComposer as EffectComposerImpl } from "postprocessing";
import { useEffect, useMemo, useRef } from "react";
import type { Object3D } from "three";
import { hotspotObject, meshesOf } from "@/lib/garage/glb";
import { isFocusView, views } from "@/lib/garage/hotspots";
import { SoftClipEffect } from "@/lib/garage/softclip";
import { useGarageStore } from "@/lib/garage/store";

interface HoverOutlineProps {
  /** The loaded GLB; the outline traces the hovered hotspot's object in here. */
  readonly scene: Object3D;
}

// The outline of docs/KONZEPT.md §4: hovering a hotspot (or reaching it with
// Tab) traces its geometry so the scene reads as clickable. This is the only
// postprocessing in the garage, and the composer replaces the default render
// pass, so the canvas leaves antialiasing to the composer's multisampling and
// the highlight roll-off to SoftClipEffect: the renderer's own tone mapping
// never reaches the screen through a composer.
export function HoverOutline({ scene }: HoverOutlineProps) {
  const hovered = useGarageStore((state) => state.hovered);
  const softClip = useMemo(() => new SoftClipEffect(), []);

  // The composer sizes its buffers from the drawing buffer, but only when
  // the CSS size changes. The pixel ratio changes without that when
  // Garage.tsx steps the DPR down, so the buffers follow it here; otherwise
  // the scene keeps rendering at the old resolution and nothing is saved.
  const composer = useRef<EffectComposerImpl>(null);
  const dpr = useThree((state) => state.viewport.dpr);
  const size = useThree((state) => state.size);
  useEffect(() => {
    composer.current?.setSize(size.width, size.height);
  }, [dpr, size]);

  // The outline pass renders by layer, and a layer set on a group does not
  // reach its children, so a grouped hotspot is traced mesh by mesh.
  const selection = useMemo(() => {
    if (hovered === null || !isFocusView(hovered)) return [];
    return meshesOf(hotspotObject(views[hovered], scene));
  }, [hovered, scene]);

  return (
    <EffectComposer ref={composer} multisampling={4} autoClear={false}>
      <Outline
        selection={selection}
        visibleEdgeColor="#ffffff"
        hiddenEdgeColor="#ffffff"
        edgeStrength={3}
        blur
      />
      <primitive object={softClip} />
    </EffectComposer>
  );
}
