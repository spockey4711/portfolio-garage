// Keyboard-first (docs/KONZEPT.md §10): j and k walk the sections of any
// page, ? lists every shortcut. This module is the decision logic, pure and
// tested without a DOM; components/site/Shortcuts.tsx is the listener and
// the overlay. The other global keys keep their own listeners (cmd+K in
// CommandPalette.tsx, Escape in ViewSync.tsx, the arrows in BikeComputer.tsx);
// this is the one place for keys that mean something on every page.

/** What a key press asks for; null when it is not one of ours. */
export type Shortcut = "next" | "prev" | "help";

/** The marker on every element j and k stop at; the heading inside takes the focus. */
export const SECTION_ATTRIBUTE = "data-section";

/** The parts of a keydown the decision reads. */
export interface KeyLike {
  readonly key: string;
  readonly metaKey: boolean;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
}

/** j, k or ? without a modifier that would make it a browser key; ? is Shift plus / and keeps its own name. */
export function shortcutFor(event: KeyLike): Shortcut | null {
  if (event.metaKey || event.ctrlKey || event.altKey) return null;
  switch (event.key) {
    case "j":
      return "next";
    case "k":
      return "prev";
    case "?":
      return "help";
    default:
      return null;
  }
}

/** The parts of an event target that say whether typing goes into it. */
export interface TargetLike {
  readonly tagName: string;
  readonly isContentEditable: boolean;
}

/** A field that takes the letters itself: a shortcut must not eat a j typed into it. */
export function isEditable(target: TargetLike | null): boolean {
  if (!target) return false;
  if (target.isContentEditable) return true;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/**
 * A section whose top sits within this many pixels of the viewport top is
 * the current one: j goes past it, k does not come back to it.
 */
const AT_TOP_PX = 8;

/** The in-flight position above the first section: k went to the top of the page. */
export const HEAD = -1;

/**
 * Which section j (`next`) or k (`prev`) lands on, from the tops of all
 * sections relative to the viewport, in document order. The scroll position
 * is the truth, not a remembered index, so the wheel and the keys agree.
 * The exception is a scroll still in flight: `inFlight` is the section the
 * last key sent the page to (HEAD for the top of the page), and the next key
 * steps from there, or two quick presses would pick the same section twice.
 * null: nothing further in that direction.
 */
export function sectionAfter(
  tops: readonly number[],
  direction: "next" | "prev",
  inFlight: number | null = null,
): number | null {
  if (inFlight !== null) {
    const index = direction === "next" ? inFlight + 1 : inFlight - 1;
    return index >= 0 && index < tops.length ? index : null;
  }
  if (direction === "next") {
    const index = tops.findIndex((top) => top > AT_TOP_PX);
    return index === -1 ? null : index;
  }
  let found: number | null = null;
  tops.forEach((top, index) => {
    if (top < -AT_TOP_PX) found = index;
  });
  return found;
}
