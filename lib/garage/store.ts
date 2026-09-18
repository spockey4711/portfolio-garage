import { create } from "zustand";
import { REST_VIEW, type ViewId } from "./hotspots";

// The state machine from docs/KONZEPT.md §5. `view` is where the camera is or
// is driving to; in idle and leaving that is always the rest view. The store
// never touches the URL: ViewSync.tsx reads ?view= and calls focus/leave, so
// a deep link, the back button and a click all take the same path.
export type Phase = "idle" | "focusing" | "focused" | "leaving";

export interface GarageState {
  readonly phase: Phase;
  readonly view: ViewId;
  /** Hotspot under the pointer or keyboard focus; drives label and cursor. */
  readonly hovered: ViewId | null;
  /** Drive into a hotspot. The rest view leaves instead. */
  focus: (view: ViewId) => void;
  /** Drive back to the rest position. No-op when already there. */
  leave: () => void;
  /** The camera reached `view`; called by the rig at the end of a drive. */
  arrive: () => void;
  hover: (view: ViewId | null) => void;
}

export const useGarageStore = create<GarageState>((set) => ({
  phase: "idle",
  view: REST_VIEW,
  hovered: null,

  focus: (view) =>
    set((state) => {
      if (view === REST_VIEW) return leaving(state);
      if (state.view === view && state.phase !== "leaving") return state;
      return { phase: "focusing", view, hovered: null };
    }),

  leave: () => set(leaving),

  arrive: () =>
    set((state) => {
      if (state.phase === "focusing") return { phase: "focused" };
      if (state.phase === "leaving") return { phase: "idle" };
      return state;
    }),

  hover: (view) => set({ hovered: view }),
}));

function leaving(state: GarageState): Partial<GarageState> {
  if (state.phase === "idle" || state.phase === "leaving") return state;
  return { phase: "leaving", view: REST_VIEW, hovered: null };
}

/** True while the camera is moving; input into the scene is ignored then. */
export function isDriving(phase: Phase): boolean {
  return phase === "focusing" || phase === "leaving";
}
