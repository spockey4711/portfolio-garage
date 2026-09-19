import { getPostLabels, getPosts } from "@/content/blog";
import { getGarageContent } from "@/content/garage";
import { getProjects } from "@/content/projects";
import { getSiteContent } from "@/content/site";
import type { Locale } from "@/lib/i18n";
import { focusViews } from "./garage/hotspots";
import { hrefForView } from "./garage/url";

// The command palette (docs/KONZEPT.md §10): every page, project, post and
// hotspot of the site plus the two actions, reachable with cmd+K from
// anywhere. This module is the list and the filter, both pure, so they are
// tested without a DOM; components/site/CommandPalette.tsx is the dialog.

/** The headings of the list, in the order the palette shows them. */
export type CommandGroup = "pages" | "projects" | "blog" | "garage" | "actions";

export const commandGroups: readonly CommandGroup[] = [
  "pages",
  "projects",
  "blog",
  "garage",
  "actions",
];

interface CommandBase {
  /** Unique across the list: the React key, and what the copied state remembers. */
  readonly id: string;
  readonly group: CommandGroup;
  readonly label: string;
  /** A second line the filter also searches: a tagline, a date, a value. */
  readonly hint?: string;
}

export type Command = CommandBase &
  (
    | { readonly kind: "link"; readonly href: string }
    | { readonly kind: "download"; readonly href: string }
    | { readonly kind: "copy"; readonly value: string }
  );

/** Everything the palette can do, in list order. Plain data: built on the server, run on the client. */
export function buildCommands(locale: Locale): readonly Command[] {
  const site = getSiteContent(locale);
  const garage = getGarageContent(locale);

  const pages: Command[] = [
    {
      id: "page-home",
      group: "pages",
      kind: "link",
      label: site.palette.home,
      href: "/",
    },
    ...site.nav.links.map<Command>((link) => ({
      id: `page-${link.href}`,
      group: "pages",
      kind: "link",
      label: link.label,
      href: link.href,
    })),
    ...[site.footer.colophon, ...site.footer.legal].map<Command>((link) => ({
      id: `page-${link.href}`,
      group: "pages",
      kind: "link",
      label: link.label,
      href: link.href,
    })),
  ];

  const projects = getProjects(locale).map<Command>((project) => ({
    id: `project-${project.slug}`,
    group: "projects",
    kind: "link",
    label: project.name,
    hint: project.tagline,
    href: `/projekte/${project.slug}`,
  }));

  const blog = getPosts(locale).map<Command>((post) => ({
    id: `post-${post.slug}`,
    group: "blog",
    kind: "link",
    label: post.title,
    hint: getPostLabels(locale).date(post.date),
    href: `/blog/${post.slug}`,
  }));

  const hotspots = focusViews.map<Command>((view) => ({
    id: `view-${view.id}`,
    group: "garage",
    kind: "link",
    label: garage.hotspots[view.id].label,
    href: hrefForView(view),
  }));

  const mail = site.footer.links.find((link) =>
    link.href.startsWith("mailto:"),
  );
  const actions: Command[] = [
    ...(mail
      ? [
          {
            id: "copy-mail",
            group: "actions" as const,
            kind: "copy" as const,
            label: site.palette.copyMail.label,
            hint: mail.label,
            value: mail.href.slice("mailto:".length),
          },
        ]
      : []),
    {
      id: "download-cv",
      group: "actions",
      kind: "download",
      label: site.palette.cv.label,
      href: site.palette.cv.href,
    },
  ];

  return [...pages, ...projects, ...blog, ...hotspots, ...actions];
}

/** Lower case without diacritics, so "uber" finds "Über mich". */
function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * The commands that match `query`, best first: every word of the query has
 * to occur in the label or the hint; a label that starts with the query
 * outranks one that merely contains it, which outranks a hit in the hint.
 * Equal ranks keep list order, so the groups stay together while nothing is
 * typed and drift apart only as the query gets specific.
 */
export function filterCommands(
  query: string,
  commands: readonly Command[],
): readonly Command[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return commands;

  const ranked = commands.flatMap((command, index) => {
    const label = fold(command.label);
    const text = command.hint ? `${label} ${fold(command.hint)}` : label;
    if (!words.every((word) => text.includes(word))) return [];
    const rank = label.startsWith(words[0])
      ? 0
      : label.includes(words[0])
        ? 1
        : 2;
    return [{ command, rank, index }];
  });

  return ranked
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((entry) => entry.command);
}

/** The keys that open the palette from anywhere: cmd+K on a Mac, ctrl+K elsewhere. */
export function isPaletteShortcut(event: {
  readonly key: string;
  readonly metaKey: boolean;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
  readonly shiftKey: boolean;
}): boolean {
  return (
    event.key.toLowerCase() === "k" &&
    (event.metaKey || event.ctrlKey) &&
    !event.altKey &&
    !event.shiftKey
  );
}
