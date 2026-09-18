import { describe, expect, it } from "vitest";
import { getAboutContent } from "./about";
import { getGarageContent } from "./garage";
import { getProjects } from "./projects";
import { getSiteContent } from "./site";

// The rules every visible string follows (docs/adr/0001, the voice of
// Portfolio2 carries over): only the plain hyphen, no emoji, no stray
// whitespace. Checked here once instead of in every review.

function strings(value: unknown, path = "content"): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => strings(item, `${path}[${i}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) =>
      strings(item, `${path}.${key}`),
    );
  }
  return [];
}

const all = [
  ...strings(getSiteContent("de"), "site"),
  ...strings(getAboutContent("de"), "about"),
  ...strings(getGarageContent("de"), "garage"),
  ...strings(getProjects("de"), "projects"),
];

describe("every content string", () => {
  it("uses the plain hyphen only", () => {
    for (const [path, text] of all) {
      expect(text, path).not.toMatch(/[–—]/);
    }
  });

  it("has no emoji", () => {
    for (const [path, text] of all) {
      expect(text, path).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });

  it("is trimmed and not empty", () => {
    for (const [path, text] of all) {
      expect(text, path).toBe(text.trim());
      expect(text, path).not.toBe("");
    }
  });
});

describe("projects", () => {
  const projects = getProjects("de");

  it("have unique, URL-safe slugs", () => {
    const slugs = projects.map((project) => project.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("tell the whole story", () => {
    for (const project of projects) {
      expect(project.approach.points.length, project.slug).toBeGreaterThan(0);
      expect(project.learnings.length, project.slug).toBeGreaterThan(0);
      expect(project.stack.length, project.slug).toBeGreaterThan(0);
    }
  });

  it("link out over https only", () => {
    for (const project of projects) {
      for (const link of project.links) {
        expect(link.href, project.slug).toMatch(/^https:\/\//);
      }
    }
  });
});
