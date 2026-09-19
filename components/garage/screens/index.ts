import type { ComponentType } from "react";
import type { ScreenViewId } from "@/lib/garage/hotspots";
import { PINBOARD_PX_PER_M, pinboard } from "@/lib/garage/pinboard";
import { TOOLWALL_PX_PER_M, toolWall } from "@/lib/garage/tools";
import { BikeComputer, EDGE_LENS, EDGE_SCALE } from "./BikeComputer";
import { Laptop, LaptopCard } from "./Laptop";
import { Pinboard, PinboardCard } from "./Pinboard";
import { ToolWall, ToolWallCard } from "./ToolWall";
import {
  WHITEBOARD_FACE_M,
  WHITEBOARD_PX_PER_M,
  Whiteboard,
  WhiteboardCard,
} from "./Whiteboard";

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
  whiteboard: {
    Component: Whiteboard,
    pxWidth: WHITEBOARD_FACE_M.width * WHITEBOARD_PX_PER_M,
    aspect: WHITEBOARD_FACE_M.width / WHITEBOARD_FACE_M.height,
    // the marker script scaled to a phone is a scrawl: the card shows the list
    Card: WhiteboardCard,
  },
  pinnwand: {
    Component: Pinboard,
    pxWidth: pinboard.width * PINBOARD_PX_PER_M,
    aspect: pinboard.width / pinboard.height,
    // dimmed towards the bake, but only as far as the type stays readable
    shade: "[filter:brightness(0.72)_saturate(0.9)]",
    // the notes scaled to a phone are unreadable: the card lists the posts
    Card: PinboardCard,
  },
  werkzeugwand: {
    Component: ToolWall,
    pxWidth: toolWall.width * TOOLWALL_PX_PER_M,
    aspect: toolWall.width / toolWall.height,
    // tape on a wall in the shade, like the paper on the cork
    shade: "[filter:brightness(0.72)_saturate(0.9)]",
    // the tags scaled to a phone are unreadable: the card lists the tools
    Card: ToolWallCard,
  },
};
