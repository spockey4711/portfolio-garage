import { describe, expect, it } from "vitest";
import { getPosts } from "@/content/blog";
import { getGarageContent } from "@/content/garage";
import { itemStyle, PINBOARD_PX_PER_M, pinboard } from "./pinboard";

// The layout is shared with blender/build/build_furniture.py, which builds a
// stand-in per item and cannot check what the web draws over it. So the
// geometry is checked here: everything hangs on the cork, nothing hangs
// over anything else, and the DOM puts each item where the stand-in is.

/** Half the diagonal: the farthest a corner gets from the centre under any rotation. */
function reach(item: { width: number; height: number }) {
  return Math.hypot(item.width, item.height) / 2;
}

describe("pinboard layout", () => {
  it("has the three kinds of item the concept lists, more than one of each", () => {
    const kinds = pinboard.items.map((item) => item.kind);
    for (const kind of ["startnummer", "foto", "zettel"] as const) {
      expect(kinds.filter((k) => k === kind).length).toBeGreaterThan(1);
    }
  });

  it("keeps every item on the cork, rotated or not", () => {
    for (const item of pinboard.items) {
      const r = reach(item);
      expect(Math.abs(item.x) + r, item.id).toBeLessThan(pinboard.width / 2);
      expect(Math.abs(item.y) + r, item.id).toBeLessThan(pinboard.height / 2);
    }
  });

  it("lets no item hang over another", () => {
    for (const a of pinboard.items) {
      for (const b of pinboard.items) {
        if (a.id >= b.id) continue;
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        expect(distance, `${a.id} and ${b.id}`).toBeGreaterThan(
          Math.max(a.width, a.height) / 2 + Math.max(b.width, b.height) / 2,
        );
      }
    }
  });

  it("keeps the pin on the item", () => {
    for (const item of pinboard.items) {
      expect(item.height, item.id).toBeGreaterThan(2 * pinboard.pinInset);
    }
  });

  it("has content of the same kind for every item", () => {
    const content = getGarageContent("de").screens.pinnwand.items;
    for (const item of pinboard.items) {
      expect(content[item.id].kind, item.id).toBe(item.kind);
    }
  });

  // docs/adr/0008: every post is a note on the board, so a new post needs a
  // note in the layout (and the furniture script run), and a note never
  // points at a post that is gone.
  it("has exactly one note per blog post", () => {
    const notes = pinboard.items.filter((item) => item.kind === "zettel");
    const named = notes.map((note) => note.post).sort();
    const slugs = getPosts("de")
      .map((post) => post.slug)
      .sort();
    expect(named).toEqual(slugs);
  });
});

describe("itemStyle", () => {
  it("puts the centre of the cork at the centre of the DOM, in millimetres", () => {
    const style = itemStyle({
      id: "zettel-1",
      kind: "zettel",
      post: "licht-aus-dem-ofen",
      x: 0,
      y: 0,
      width: 0.1,
      height: 0.2,
      rotation: -3,
    });
    expect(style.width).toBe(0.1 * PINBOARD_PX_PER_M);
    expect(style.height).toBe(0.2 * PINBOARD_PX_PER_M);
    expect(style.left + style.width / 2).toBeCloseTo(
      (pinboard.width / 2) * PINBOARD_PX_PER_M,
    );
    expect(style.top + style.height / 2).toBeCloseTo(
      (pinboard.height / 2) * PINBOARD_PX_PER_M,
    );
    expect(style.transform).toBe("rotate(-3deg)");
  });

  it("moves an item right and up with positive x and y", () => {
    const origin = itemStyle({
      id: "foto-1",
      kind: "foto",
      x: 0,
      y: 0,
      width: 0.1,
      height: 0.1,
      rotation: 0,
    });
    const moved = itemStyle({
      id: "foto-1",
      kind: "foto",
      x: 0.05,
      y: 0.02,
      width: 0.1,
      height: 0.1,
      rotation: 0,
    });
    expect(moved.left - origin.left).toBeCloseTo(0.05 * PINBOARD_PX_PER_M);
    expect(moved.top - origin.top).toBeCloseTo(-0.02 * PINBOARD_PX_PER_M);
  });
});
