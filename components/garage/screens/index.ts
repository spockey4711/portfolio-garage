import type { ComponentType } from "react";
import type { ScreenViewId } from "@/lib/garage/hotspots";
import { BikeComputer, EDGE_LENS, EDGE_SCALE } from "./BikeComputer";
import { Laptop } from "./Laptop";

export interface ScreenSpec {
  readonly Component: ComponentType;
  /**
   * Width of the DOM in CSS pixels. Screen.tsx scales it onto the display
   * face, so this only sets how much UI fits across; the height follows
   * from the face's aspect ratio.
   */
  readonly pxWidth: number;
  /**
   * Width over height of the box the still's stand-in (StillView.tsx) shows
   * the component in. In 3D the display face in the GLB decides instead.
   */
  readonly aspect: number;
}

// One entry per view whose ui is "screen" in lib/garage/hotspots.ts; the
// type makes a new screen view a compile error until it has a component.
export const screens: Readonly<Record<ScreenViewId, ScreenSpec>> = {
  // The whole glass front of the Edge 540, laid out at twice its pixels.
  radcomputer: {
    Component: BikeComputer,
    pxWidth: EDGE_LENS.width * EDGE_SCALE,
    aspect: EDGE_LENS.width / EDGE_LENS.height,
  },
  laptop: { Component: Laptop, pxWidth: 960, aspect: 16 / 10 },
};
