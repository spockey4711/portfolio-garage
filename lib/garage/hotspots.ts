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
  | "screen" // React tree on a display surface (<Html transform occlude>)
  | "overlay" // DOM overlay in front of a wall object
  | "hover"; // no screen, hovering parts of the object reveals text

export interface View<Id extends ViewId = ViewId> {
  readonly id: Id;
  readonly camera: Vec3;
  readonly target: Vec3;
  /** Value of the ?view= search param; the rest view has none. */
  readonly slug: string | null;
  readonly ui: ViewUi;
  /** Name of the mesh in the GLB that opens this view; the rest view has none. */
  readonly mesh: string | null;
}

const meta: Record<ViewId, Pick<View, "slug" | "ui" | "mesh">> = {
  ruhe: { slug: null, ui: "labels", mesh: null },
  radcomputer: { slug: "computer", ui: "screen", mesh: "Radcomputer" },
  laptop: { slug: "laptop", ui: "screen", mesh: "Laptop_Display" },
  pinnwand: { slug: "board", ui: "overlay", mesh: "Pinnwand" },
  whiteboard: { slug: "plan", ui: "overlay", mesh: "Whiteboard" },
  werkzeugwand: { slug: "tools", ui: "hover", mesh: "Werkzeugwand" },
};

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

/** Vertical field of view of the rest camera in degrees (24 mm equivalent). */
export const REST_FOV = 45;

/** Looks up a view by its ?view= slug; unknown slugs fall back to the rest view. */
export function viewFromSlug(slug: string | null): View {
  if (slug === null) return views[REST_VIEW];
  return Object.values(views).find((v) => v.slug === slug) ?? views[REST_VIEW];
}
