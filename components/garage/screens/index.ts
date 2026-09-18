import type { ComponentType } from "react";
import type { ScreenViewId } from "@/lib/garage/hotspots";
import { BikeComputer, EDGE_DISPLAY } from "./BikeComputer";
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
  // Laid out at twice the Edge 540's 246 x 322 px, so 2 CSS px are one device px.
  radcomputer: {
    Component: BikeComputer,
    pxWidth: EDGE_DISPLAY.width * 2,
    aspect: EDGE_DISPLAY.width / EDGE_DISPLAY.height,
  },
  laptop: { Component: Laptop, pxWidth: 960, aspect: 16 / 10 },
};
