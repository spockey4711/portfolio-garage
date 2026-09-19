import { describe, expect, it } from "vitest";
import { REST_VIEW, views } from "./hotspots";
import { hrefForView, viewFromSearch } from "./url";

describe("viewFromSearch", () => {
  it("reads the concept URLs", () => {
    expect(viewFromSearch(new URLSearchParams("view=computer")).id).toBe(
      "radcomputer",
    );
    expect(viewFromSearch(new URLSearchParams("view=tools")).id).toBe(
      "werkzeugwand",
    );
  });

  it("falls back to the rest view", () => {
    expect(viewFromSearch(new URLSearchParams()).id).toBe(REST_VIEW);
    expect(viewFromSearch(new URLSearchParams("view=")).id).toBe(REST_VIEW);
    expect(viewFromSearch(new URLSearchParams("view=nope")).id).toBe(REST_VIEW);
  });
});

describe("hrefForView", () => {
  it("writes the concept URLs", () => {
    expect(hrefForView(views.radcomputer)).toBe("/?view=computer");
    expect(hrefForView(views.pinnwand)).toBe("/?view=blog");
    expect(hrefForView(views[REST_VIEW])).toBe("/");
  });

  it("keeps unrelated params and replaces an existing view", () => {
    const search = new URLSearchParams("utm=x&view=laptop");
    expect(hrefForView(views.whiteboard, search)).toBe("/?utm=x&view=about");
    expect(hrefForView(views[REST_VIEW], search)).toBe("/?utm=x");
    expect(search.get("view"), "input is not mutated").toBe("laptop");
  });

  it("round-trips through viewFromSearch", () => {
    for (const view of Object.values(views)) {
      const href = hrefForView(view);
      const search = new URLSearchParams(href.split("?")[1] ?? "");
      expect(viewFromSearch(search).id).toBe(view.id);
    }
  });
});
