import generated from "./still.generated.json";
import {
  type FocusViewId,
  focusViews,
  REST_VIEW,
  type Vec3,
  type View,
  views,
} from "./hotspots";

// The static fallback of docs/KONZEPT.md §5: the rest view as the export
// rendered it (skill blender-export), shown before the canvas mounts and
// instead of it where the canvas would cost too much (capability.ts). Both
// stills come from the rest camera with the same vertical field of view the
// canvas uses, so a viewport narrower than a still sees exactly the still's
// centre with object-fit: cover, and the canvas can take over without a cut.

export interface StillImage {
  readonly src: string;
  readonly width: number;
  readonly height: number;
}

/** 12:5, for viewports wider than they are tall. */
export const STILL_WIDE: StillImage = {
  src: "/models/garage-ruhe-tag-quer.webp",
  ...generated.wide,
};

/** 1:2, the same centre with more pixels for a phone held upright. */
export const STILL_PORTRAIT: StillImage = {
  src: "/models/garage-ruhe-tag-hoch.webp",
  ...generated.portrait,
};

/** A hotspot's click area in the wide still, in its pixels, origin top left. */
export interface StillArea {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

function toArea(view: FocusViewId): StillArea {
  const raw = (generated.areas as Record<string, number[] | undefined>)[view];
  if (raw === undefined || raw.length !== 4) {
    throw new Error(`still.generated.json: no area for ${view}`);
  }
  return { x: raw[0], y: raw[1], width: raw[2], height: raw[3] };
}

export const stillAreas: Readonly<Record<FocusViewId, StillArea>> =
  Object.fromEntries(
    focusViews.map((view) => [view.id, toArea(view.id)]),
  ) as Record<FocusViewId, StillArea>;

/** Vertical field of view the stills were rendered with; must equal REST_FOV. */
export const STILL_FOV = generated.fov;

function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/**
 * The hotspots from the farthest to the nearest as seen from the rest camera.
 * Areas may overlap where one object stands in front of another (the bike
 * computer before the whiteboard); drawn in this order, the nearer one is on
 * top and takes the click, as the raycast in 3D would pick it.
 */
export const stillAreaOrder: ReadonlyArray<View<FocusViewId>> = [
  ...focusViews,
].sort(
  (a, b) =>
    distance(views[REST_VIEW].camera, b.target) -
    distance(views[REST_VIEW].camera, a.target),
);
