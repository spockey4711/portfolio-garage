import { describe, expect, it } from "vitest";
import { focusViews, REST_FOV } from "./hotspots";
import {
  STILL_FOV,
  STILL_PORTRAIT,
  STILL_WIDE,
  stillAreaOrder,
  stillAreas,
} from "./still";

// The stills are what the export rendered; these tests pin the contract
// between that render and the code that lays the click areas over it.

describe("stills", () => {
  it("were rendered with the canvas's field of view, or cover would not line up", () => {
    expect(STILL_FOV).toBe(REST_FOV);
  });

  it("are one landscape and one portrait frame", () => {
    expect(STILL_WIDE.width).toBeGreaterThan(STILL_WIDE.height);
    expect(STILL_PORTRAIT.height).toBeGreaterThan(STILL_PORTRAIT.width);
  });
});

describe("stillAreas", () => {
  it("has a clickable area inside the wide frame for every hotspot", () => {
    for (const view of focusViews) {
      const area = stillAreas[view.id];
      expect(area.width, view.id).toBeGreaterThan(0);
      expect(area.height, view.id).toBeGreaterThan(0);
      expect(area.x, view.id).toBeGreaterThanOrEqual(0);
      expect(area.y, view.id).toBeGreaterThanOrEqual(0);
      expect(area.x + area.width, view.id).toBeLessThanOrEqual(
        STILL_WIDE.width,
      );
      expect(area.y + area.height, view.id).toBeLessThanOrEqual(
        STILL_WIDE.height,
      );
    }
  });

  it("draws the nearer hotspot last, so it wins an overlap like the raycast would", () => {
    const order = stillAreaOrder.map((view) => view.id);
    expect(order).toHaveLength(focusViews.length);
    // The bike computer stands in the room, in front of the whiteboard on the back wall.
    expect(order.indexOf("radcomputer")).toBeGreaterThan(
      order.indexOf("whiteboard"),
    );
  });
});
