import { getPosts } from "@/content/blog";
import { getProjects } from "@/content/projects";
import { getSiteContent } from "@/content/site";
import type { Locale } from "@/lib/i18n";

// The text version of the start page (docs/KONZEPT.md §10): what a terminal
// gets for "curl yannikwuenker.de". Same content as the 2D page, in the same
// order (name and positioning, intro, projects, blog, contact), with absolute
// links so every line can be copied. Plain ASCII layout, 72 columns, no
// colour codes: it has to read well in any terminal and in a pager.

/** Lines never exceed this, so the card fits an 80-column terminal with room. */
export const WIDTH = 72;

const INDENT = "  ";

const bike = ["    __o", "  _`\\<,_", " (_)/ (_)"];

/** Word-wraps a paragraph; a word longer than the width gets its own line. */
export function wrap(text: string, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (!word) continue;
    if (line && line.length + 1 + word.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

interface Row {
  readonly key: string;
  /** Wrapped into the value column; nothing when omitted. */
  readonly text?: string;
  /** Printed as its own line under the text, never wrapped. */
  readonly href?: string;
}

/**
 * A two-column block: keys left, values aligned right of the widest key. A
 * row without text and href is the key alone, for a value that is its own
 * label (the mail address); it does not widen the column.
 */
function columns(rows: readonly Row[]): string[] {
  const keyed = rows.filter((row) => row.text || row.href);
  const keyWidth = Math.max(...keyed.map((row) => row.key.length)) + 2;
  const valueWidth = WIDTH - INDENT.length - keyWidth;
  return rows.flatMap((row) => {
    const values = [
      ...(row.text ? wrap(row.text, valueWidth) : []),
      ...(row.href ? [row.href] : []),
    ];
    if (values.length === 0) return [INDENT + row.key];
    // A URL is never wrapped; one too long for the column starts at the
    // indent instead, and if it is the first value the key gets its own line.
    const fits = (value: string) => value.length <= valueWidth;
    const gutter = " ".repeat(keyWidth);
    const lines = values.map((value, i) => {
      const left = i === 0 && fits(value) ? row.key.padEnd(keyWidth) : gutter;
      return INDENT + (fits(value) ? left : "") + value;
    });
    return fits(values[0]) ? lines : [INDENT + row.key, ...lines];
  });
}

function section(title: string, lines: readonly string[]): string[] {
  return ["", title, ...lines];
}

export interface TerminalCardInput {
  /** Scheme and host of the running site, e.g. "https://yannikwuenker.de". */
  readonly origin: string;
  readonly locale: Locale;
}

export function renderTerminalCard({
  origin,
  locale,
}: TerminalCardInput): string {
  const site = getSiteContent(locale);
  const artWidth = Math.max(...bike.map((line) => line.length));
  const heading = [site.name, site.home.positioning];
  const header = bike.map((art, i) =>
    (art.padEnd(artWidth + 5) + (heading[i] ?? "")).trimEnd(),
  );

  const projects = columns(
    getProjects(locale).map((project) => ({
      key: project.name,
      text: project.tagline,
      href: `${origin}/projekte/${project.slug}`,
    })),
  );

  // The ISO date, not the page's long form: it is what a terminal expects,
  // and the spelled-out month would eat a third of the line.
  const posts = columns(
    getPosts(locale).map((post) => ({
      key: post.date,
      text: post.title,
      href: `${origin}/blog/${post.slug}`,
    })),
  );

  const contact = columns(
    [...site.footer.links, site.footer.colophon, ...site.footer.legal].map(
      (link) => {
        if (link.href.startsWith("mailto:")) return { key: link.label };
        const href = link.href.startsWith("/") ? origin + link.href : link.href;
        return { key: link.label, href };
      },
    ),
  );

  const lines = [
    ...header,
    "",
    ...wrap(site.home.intro, WIDTH),
    ...section(site.home.projects.title, projects),
    ...section(site.home.blog.title, posts),
    ...section(site.footer.label, contact),
    "",
    ...wrap(`${site.terminal.browser} ${origin}`, WIDTH),
  ];
  return lines.join("\n") + "\n";
}
