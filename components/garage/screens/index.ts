import type { ComponentType } from "react";
import type { ScreenViewId } from "@/lib/garage/hotspots";
import { PINBOARD_PX_PER_M, pinboard } from "@/lib/garage/pinboard";
import { BikeComputer, EDGE_LENS, EDGE_SCALE } from "./BikeComputer";
import { Laptop, LaptopCard } from "./Laptop";
import { Pinboard } from "./Pinboard";

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
  /**
   * Tailwind classes Screen.tsx puts on the DOM in the room, for a surface
   * that is no light source: the atlas does not light the DOM, so paper at
   * screen white would glow in the board's shade. The still's card is part
   * of the 2D page and shows the component as it is.
   */
  readonly shade?: string;
  /**
   * Tailwind classes painting the still's box behind a component that is
   * transparent in 3D, where the GLB face shows through it. Omitted for a
   * component that paints its own background.
   */
  readonly backdrop?: string;
  /**
   * What the still's card shows instead of the component scaled down as a
   * whole: a screen whose content is text is unreadable scaled to a phone,
   * so its card shows the same content at page size.
   */
  readonly Card?: ComponentType;
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
  // 720 px across the 30 cm panel: the focus camera shows it at about 600
  // px on a laptop viewport, so the type lands close to its CSS size.
  laptop: {
    Component: Laptop,
    pxWidth: 720,
    aspect: 30 / 19,
    Card: LaptopCard,
  },
  pinnwand: {
    Component: Pinboard,
    pxWidth: pinboard.width * PINBOARD_PX_PER_M,
    aspect: pinboard.width / pinboard.height,
    // dimmed towards the bake, but only as far as the type stays readable
    shade: "[filter:brightness(0.72)_saturate(0.9)]",
    // the cork, same value as the material "Kork" in blender/build/build_room.py
    backdrop: "bg-[#c69a5e]",
  },
};
