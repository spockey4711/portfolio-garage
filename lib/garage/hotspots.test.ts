import { describe, expect, it } from "vitest";
import { REST_VIEW, viewFromSlug, views } from "./hotspots";

describe("views", () => {
  it("covers the six views from KONZEPT §3", () => {
    expect(Object.keys(views).sort()).toEqual([
      "laptop",
      "pinnwand",
      "radcomputer",
      "ruhe",
      "werkzeugwand",
      "whiteboard",
    ]);
  });

  it("puts the rest camera where the concept says", () => {
    expect(views[REST_VIEW].camera).toEqual([0, 1.6, 5.2]);
    expect(views[REST_VIEW].target).toEqual([0, 1.1, 0]);
  });

  it("keeps every camera inside the room or in front of the gate", () => {
    for (const view of Object.values(views)) {
      const [x, y, z] = view.camera;
      expect(Math.abs(x), view.id).toBeLessThan(3);
      expect(y, view.id).toBeGreaterThan(0);
      expect(y, view.id).toBeLessThan(2.8);
      expect(z, view.id).toBeGreaterThan(-2);
    }
  });

  it("gives every focused view a slug and a mesh, and only the rest view none", () => {
    for (const view of Object.values(views)) {
      if (view.id === REST_VIEW) {
        expect(view.slug).toBeNull();
        expect(view.mesh).toBeNull();
      } else {
        expect(view.slug, view.id).toMatch(/^[a-z]+$/);
        expect(view.mesh, view.id).toBeTruthy();
      }
    }
  });

  it("gives exactly the screen views a display mesh", () => {
    for (const view of Object.values(views)) {
      if (view.ui === "screen") {
        expect(view.display, view.id).toBeTruthy();
      } else {
        expect(view.display, view.id).toBeNull();
      }
    }
  });

  it("has unique slugs", () => {
    const slugs = Object.values(views)
      .map((v) => v.slug)
      .filter((s) => s !== null);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("viewFromSlug", () => {
  it("resolves the concept URLs", () => {
    expect(viewFromSlug("computer").id).toBe("radcomputer");
    expect(viewFromSlug("laptop").id).toBe("laptop");
    expect(viewFromSlug("blog").id).toBe("pinnwand");
    expect(viewFromSlug("plan").id).toBe("whiteboard");
    expect(viewFromSlug("tools").id).toBe("werkzeugwand");
  });

  it("falls back to the rest view for no or unknown slugs", () => {
    expect(viewFromSlug(null).id).toBe(REST_VIEW);
    expect(viewFromSlug("kitchen").id).toBe(REST_VIEW);
  });
});
