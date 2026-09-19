import { describe, expect, it } from "vitest";
import {
  commitFromSha,
  entryFilesOf,
  firstLoadBytes,
  formatKilobytes,
  REPOSITORY_URL,
  routePattern,
  sizeForPath,
} from "./info";

describe("commitFromSha", () => {
  const sha = "8d9498d0f1e2a3b4c5d6e7f8a9b0c1d2e3f4a5b6";

  it("shortens a full SHA and links it to the repository", () => {
    expect(commitFromSha(sha)).toEqual({
      sha,
      short: "8d9498d",
      url: `${REPOSITORY_URL}/commit/${sha}`,
    });
  });

  it("refuses anything that is not a full SHA, so nothing invented reaches the footer", () => {
    expect(commitFromSha(undefined)).toBeUndefined();
    expect(commitFromSha("")).toBeUndefined();
    expect(commitFromSha("8d9498d")).toBeUndefined();
    expect(commitFromSha("unknown")).toBeUndefined();
  });
});

describe("routePattern", () => {
  it("drops route groups and the page suffix", () => {
    expect(routePattern("/page")).toBe("/");
    expect(routePattern("/(seiten)/bauweise/page")).toBe("/bauweise");
    expect(routePattern("/(seiten)/blog/[slug]/page")).toBe("/blog/[slug]");
    expect(routePattern("/_not-found/page")).toBe("/_not-found");
  });
});

describe("entryFilesOf", () => {
  // The shape Turbopack writes to .next/server/app/**/page_client-reference-manifest.js.
  const key = "/(seiten)/blog/[slug]/page";
  const source = [
    "globalThis.__RSC_MANIFEST = globalThis.__RSC_MANIFEST || {};",
    `globalThis.__RSC_MANIFEST["${key}"] = ${JSON.stringify({
      moduleLoading: { prefix: "" },
      clientModules: {},
      entryCSSFiles: { "[project]/app/layout": [] },
      entryJSFiles: {
        "[project]/app/layout": ["static/chunks/layout.js"],
        [`[project]/app${key}`]: [
          "static/chunks/layout.js",
          "static/chunks/blog.js",
        ],
      },
    })};`,
    "",
  ].join("\n");

  it("reads the page's own entry from the manifest source", () => {
    expect(entryFilesOf(source, key)).toEqual([
      "static/chunks/layout.js",
      "static/chunks/blog.js",
    ]);
  });

  it("is undefined for a source it does not recognise", () => {
    expect(entryFilesOf("", key)).toBeUndefined();
    expect(entryFilesOf("globalThis.x = {broken", key)).toBeUndefined();
    expect(entryFilesOf(source, "/page")).toBeUndefined();
    expect(
      entryFilesOf(
        `globalThis.__RSC_MANIFEST["${key}"] = {"clientModules":{}};`,
        key,
      ),
    ).toBeUndefined();
  });
});

describe("firstLoadBytes", () => {
  const sizes: Record<string, number> = {
    "static/chunks/main.js": 100,
    "static/chunks/layout.js": 20,
    "static/chunks/page.js": 3,
    "static/chunks/app.css": 1000,
  };
  const sizeOf = (file: string) => sizes[file];

  it("counts every JavaScript file once, no stylesheets", () => {
    expect(
      firstLoadBytes(
        ["static/chunks/main.js", "static/chunks/layout.js"],
        [
          "static/chunks/layout.js",
          "static/chunks/page.js",
          "static/chunks/app.css",
        ],
        sizeOf,
      ),
    ).toBe(123);
  });
});

describe("sizeForPath", () => {
  const sizes = {
    "/": 900,
    "/blog/[slug]": 500,
    "/blog/archiv": 400,
    "/ueber": 450,
  };

  it("matches the pathname exactly or by one dynamic segment", () => {
    expect(sizeForPath(sizes, "/")).toBe(900);
    expect(sizeForPath(sizes, "/ueber")).toBe(450);
    expect(sizeForPath(sizes, "/blog/warum-eine-werkstatt")).toBe(500);
  });

  it("prefers the static route over the dynamic one", () => {
    expect(sizeForPath(sizes, "/blog/archiv")).toBe(400);
  });

  it("has no number for an unknown path or without a build", () => {
    expect(sizeForPath(sizes, "/blog")).toBeUndefined();
    expect(sizeForPath(sizes, "/blog/a/b")).toBeUndefined();
    expect(sizeForPath(undefined, "/")).toBeUndefined();
  });
});

describe("formatKilobytes", () => {
  it("rounds to whole decimal kilobytes in the locale", () => {
    expect(formatKilobytes(939161, "de")).toBe("939 kB");
    expect(formatKilobytes(1234567, "de")).toBe("1.235 kB");
    expect(formatKilobytes(499, "de")).toBe("0 kB");
  });
});
