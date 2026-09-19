import { describe, expect, it } from "vitest";
import { getPosts } from "@/content/blog";
import { getProjects } from "@/content/projects";
import { getSiteContent } from "@/content/site";
import { focusViews } from "./garage/hotspots";
import {
  buildCommands,
  type Command,
  commandGroups,
  filterCommands,
  isPaletteShortcut,
} from "./palette";

describe("buildCommands", () => {
  const commands = buildCommands("de");

  it("lists every page, project, post and hotspot once, then the two actions", () => {
    const site = getSiteContent("de");
    const hrefs = commands.flatMap((c) => (c.kind === "copy" ? [] : [c.href]));

    for (const link of [...site.nav.links, ...site.footer.legal]) {
      expect(hrefs).toContain(link.href);
    }
    for (const project of getProjects("de")) {
      expect(hrefs).toContain(`/projekte/${project.slug}`);
    }
    for (const post of getPosts("de")) {
      expect(hrefs).toContain(`/blog/${post.slug}`);
    }
    for (const view of focusViews) {
      expect(hrefs).toContain(`/?view=${view.slug}`);
    }
    expect(commands.filter((c) => c.kind === "copy")).toHaveLength(1);
    expect(commands.filter((c) => c.kind === "download")).toHaveLength(1);
  });

  it("has unique ids", () => {
    const ids = commands.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps the groups in list order", () => {
    const order = commands.map((c) => commandGroups.indexOf(c.group));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("copies the bare address, not the mailto: link", () => {
    const copy = commands.find((c) => c.kind === "copy");
    expect(copy?.kind === "copy" && copy.value).toMatch(/^[^:]+@[^:]+$/);
  });
});

describe("filterCommands", () => {
  const commands: readonly Command[] = [
    {
      id: "a",
      group: "pages",
      kind: "link",
      label: "Über mich",
      href: "/ueber",
    },
    {
      id: "b",
      group: "projects",
      kind: "link",
      label: "fuelivo",
      hint: "Verpflegung für lange Einheiten",
      href: "/projekte/fuelivo",
    },
    {
      id: "c",
      group: "projects",
      kind: "link",
      label: "Aurelian",
      hint: "Ein Fuel-Tracker",
      href: "/projekte/aurelian",
    },
    {
      id: "d",
      group: "actions",
      kind: "copy",
      label: "Mail kopieren",
      value: "a@b.de",
    },
  ];
  const ids = (query: string) =>
    filterCommands(query, commands).map((c) => c.id);

  it("returns everything in list order for an empty query", () => {
    expect(ids("")).toEqual(["a", "b", "c", "d"]);
    expect(ids("   ")).toEqual(["a", "b", "c", "d"]);
  });

  it("ignores case and diacritics", () => {
    expect(ids("uber")).toEqual(["a"]);
    expect(ids("ÜBER")).toEqual(["a"]);
  });

  it("ranks a label prefix over a label hit over a hint hit", () => {
    // "fuel": fuelivo starts with it, Aurelian only says it in the hint.
    expect(ids("fuel")).toEqual(["b", "c"]);
    // "lian": Aurelian contains it, nothing else does.
    expect(ids("lian")).toEqual(["c"]);
  });

  it("needs every word, in any field", () => {
    expect(ids("fuel lange")).toEqual(["b"]);
    expect(ids("fuel nirgends")).toEqual([]);
  });
});

describe("isPaletteShortcut", () => {
  const key = (overrides: Partial<Parameters<typeof isPaletteShortcut>[0]>) =>
    isPaletteShortcut({
      key: "k",
      metaKey: false,
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      ...overrides,
    });

  it("is cmd+K or ctrl+K, either case", () => {
    expect(key({ metaKey: true })).toBe(true);
    expect(key({ ctrlKey: true })).toBe(true);
    expect(key({ metaKey: true, key: "K" })).toBe(true);
  });

  it("is not a bare K, nor with alt or shift", () => {
    expect(key({})).toBe(false);
    expect(key({ metaKey: true, altKey: true })).toBe(false);
    expect(key({ ctrlKey: true, shiftKey: true })).toBe(false);
    expect(key({ metaKey: true, key: "j" })).toBe(false);
  });
});
