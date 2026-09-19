import generated from "./hotspots.generated.json";

// Camera and target points come from the Cam_*/Ziel_* empties in
// blender/garage-blockout.blend through the blender-export skill. This file
// only adds what Blender cannot know: the URL and the kind of UI a view opens.
// Coordinates are Y-up metres, origin on the floor in the middle of the room.

export type Vec3 = readonly [x: number, y: number, z: number];

export type ViewId = keyof typeof generated;

export const REST_VIEW = "ruhe" satisfies ViewId;

/** Every view the camera can drive into, i.e. all but the rest view. */
export type FocusViewId = Exclude<ViewId, typeof REST_VIEW>;

/** The kind of UI a focused view shows; drives which screen component mounts. */
export type ViewUi =
  | "labels" // rest position: hover labels only
  | "screen" // React tree on a face of the object (<Html transform occlude>): a display, or the board itself
  | "overlay" // DOM overlay in front of a wall object (not built yet)
  | "hover"; // no screen, hovering parts of the object reveals text

export interface View<Id extends ViewId = ViewId> {
  readonly id: Id;
  readonly camera: Vec3;
  readonly target: Vec3;
  /** Value of the ?view= search param; the rest view has none. */
  readonly slug: string | null;
  readonly ui: ViewUi;
  /**
   * Name of the object in the GLB that opens this view: what the click box
   * wraps and the hover outline traces. A group (Laptop) when the hotspot is
   * more than its display; the rest view has none.
   */
  readonly mesh: string | null;
  /** Name of the mesh on whose face a screen view renders; null unless ui is "screen". */
  readonly display: string | null;
}

const meta = {
  ruhe: { slug: null, ui: "labels", mesh: null, display: null },
  radcomputer: {
    slug: "computer",
    ui: "screen",
    mesh: "Radcomputer",
    display: "Radcomputer_Display",
  },
  laptop: {
    slug: "laptop",
    ui: "screen",
    mesh: "Laptop",
    display: "Laptop_Display",
  },
  // The board's DOM lies on the cork inside the frame, over the paper
  // stand-ins the GLB carries (lib/garage/pinboard.ts).
  pinnwand: {
    slug: "board",
    ui: "screen",
    mesh: "Pinnwand",
    display: "Pinnwand_Kork",
  },
  whiteboard: {
    slug: "plan",
    ui: "overlay",
    mesh: "Whiteboard",
    display: null,
  },
  werkzeugwand: {
    slug: "tools",
    ui: "hover",
    mesh: "Werkzeugwand",
    display: null,
  },
} as const satisfies Record<
  ViewId,
  Pick<View, "slug" | "ui" | "mesh" | "display">
>;

/** The views that mount a screen component; the screen registry must cover all of them. */
export type ScreenViewId = {
  [Id in ViewId]: (typeof meta)[Id]["ui"] extends "screen" ? Id : never;
}[ViewId];

function toVec3(v: number[]): Vec3 {
  if (v.length !== 3) {
    throw new Error(
      `hotspots.generated.json: expected 3 coordinates, got ${v.length}`,
    );
  }
  return [v[0], v[1], v[2]];
}

export const views: { readonly [Id in ViewId]: View<Id> } = Object.fromEntries(
  (Object.keys(generated) as ViewId[]).map((id) => [
    id,
    {
      id,
      camera: toVec3(generated[id].camera),
      target: toVec3(generated[id].target),
      ...meta[id],
    },
  ]),
) as { [Id in ViewId]: View<Id> };

export function isFocusView(id: ViewId): id is FocusViewId {
  return id !== REST_VIEW;
}

/** The hotspots in the order Tab walks through them, left to right in the room. */
export const focusViews: ReadonlyArray<View<FocusViewId>> = (
  ["werkzeugwand", "laptop", "whiteboard", "radcomputer", "pinnwand"] as const
).map((id) => views[id]);

export function isScreenView(view: View): view is View<ScreenViewId> {
  return view.ui === "screen";
}

export const screenViews: ReadonlyArray<View<ScreenViewId>> =
  focusViews.filter(isScreenView);

/** Vertical field of view of the rest camera in degrees (23 mm equivalent). */
export const REST_FOV = 55;

/** Looks up a view by its ?view= slug; unknown slugs fall back to the rest view. */
export function viewFromSlug(slug: string | null): View {
  if (slug === null) return views[REST_VIEW];
  return Object.values(views).find((v) => v.slug === slug) ?? views[REST_VIEW];
}
