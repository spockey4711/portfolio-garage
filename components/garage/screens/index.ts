import type { ComponentType } from "react";
import type { ScreenViewId } from "@/lib/garage/hotspots";
import { BikeComputer } from "./BikeComputer";
import { Laptop } from "./Laptop";

export interface ScreenSpec {
  readonly Component: ComponentType;
  /**
   * Width of the DOM in CSS pixels. Screen.tsx scales it onto the display
   * face, so this only sets how much UI fits across; the height follows
   * from the face's aspect ratio.
   */
  readonly pxWidth: number;
}

// One entry per view whose ui is "screen" in lib/garage/hotspots.ts; the
// type makes a new screen view a compile error until it has a component.
export const screens: Readonly<Record<ScreenViewId, ScreenSpec>> = {
  radcomputer: { Component: BikeComputer, pxWidth: 400 },
  laptop: { Component: Laptop, pxWidth: 960 },
};
