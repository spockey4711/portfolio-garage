import { describe, expect, it } from "vitest";
import { getPosts } from "@/content/blog";
import { getProjects } from "@/content/projects";
import { getSiteContent } from "@/content/site";
import { renderTerminalCard, WIDTH, wrap } from "./card";

const origin = "https://garage.yannikwuenker.de";
const card = renderTerminalCard({ origin, locale: "de" });
const lines = card.split("\n");

describe("wrap", () => {
  it("breaks at spaces and never exceeds the width", () => {
    const text = "eins zwei drei vier fünf sechs sieben acht neun zehn";
    const wrapped = wrap(text, 18);
    expect(wrapped).toEqual([
      "eins zwei drei",
      "vier fünf sechs",
      "sieben acht neun",
      "zehn",
    ]);
  });

  it("gives an overlong word its own line", () => {
    expect(wrap("a bbbbbbbbbb c", 4)).toEqual(["a", "bbbbbbbbbb", "c"]);
  });

  it("collapses whitespace and drops empty input", () => {
    expect(wrap("  a   b  ", 10)).toEqual(["a b"]);
    expect(wrap("", 10)).toEqual([]);
  });
});

describe("renderTerminalCard", () => {
  const site = getSiteContent("de");

  it("fits the width and ends with one newline", () => {
    for (const line of lines) {
      expect(line.length, line).toBeLessThanOrEqual(WIDTH);
      expect(line, line).toBe(line.trimEnd());
    }
    expect(card.endsWith("\n")).toBe(true);
    expect(card.endsWith("\n\n")).toBe(false);
  });

  it("is plain text: no tabs, no escape codes", () => {
    expect(card).not.toMatch(/[\t\u001b]/);
  });

  it("starts with the name and the positioning", () => {
    expect(lines[0]).toContain(site.name);
    expect(lines[1]).toContain(site.home.positioning);
  });

  it("links every project and every post with an absolute URL", () => {
    // Taglines and titles wrap, so compare with the line breaks folded.
    const folded = card.replace(/\s+/g, " ");
    for (const project of getProjects("de")) {
      expect(card).toContain(`${origin}/projekte/${project.slug}`);
      expect(folded).toContain(`${project.name} ${project.tagline}`);
    }
    for (const post of getPosts("de")) {
      expect(card).toContain(`${origin}/blog/${post.slug}`);
      expect(folded).toContain(`${post.date} ${post.title}`);
    }
  });

  it("moves a URL that does not fit the column to the indent", () => {
    const long = "https://" + "a".repeat(70) + ".de";
    const wide = renderTerminalCard({ origin: long, locale: "de" });
    const slug = getProjects("de")[0].slug;
    const line = wide.split("\n").find((l) => l.includes(`/projekte/${slug}`));
    expect(line).toBe(`  ${long}/projekte/${slug}`);
  });

  it("lists the contact links and the legal pages", () => {
    expect(card).toContain("mail@yannikwuenker.de");
    expect(card).not.toContain("mailto:");
    expect(card).toContain("https://github.com/spockey4711");
    expect(card).toContain(`${origin}/impressum`);
    expect(card).toContain(`${origin}/datenschutz`);
  });

  it("points to the browser version at the end", () => {
    expect(lines.at(-2)).toBe(`${site.terminal.browser} ${origin}`);
  });

  it("aligns the values of a block two columns right of the widest key", () => {
    const projects = getProjects("de");
    const keyWidth = Math.max(...projects.map((p) => p.name.length)) + 2;
    const start = lines.indexOf(site.home.projects.title) + 1;
    const end = lines.indexOf(site.home.blog.title) - 1;
    const block = lines.slice(start, end);
    expect(block.length).toBeGreaterThan(projects.length);
    for (const line of block) {
      const key = line.slice(2, 2 + keyWidth);
      const value = line.slice(2 + keyWidth);
      expect(value, line).toMatch(/^\S/);
      if (key.trim()) {
        expect(
          projects.map((p) => p.name),
          line,
        ).toContain(key.trimEnd());
      }
    }
  });
});
