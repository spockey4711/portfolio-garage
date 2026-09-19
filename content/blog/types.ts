import type { Locale } from "@/lib/i18n";

// One post is one file in this directory; index.ts decides membership and
// order. Like the projects, a post is structured content, not Markdown: a
// list of blocks the page renders, so every string sits behind
// getPosts(locale) (docs/adr/0003) and content.test.ts can check it.

/** A block of the body, in reading order. */
export type PostBlock =
  | { readonly kind: "p"; readonly text: string }
  | { readonly kind: "h2"; readonly text: string }
  | { readonly kind: "ul"; readonly items: readonly string[] }
  | { readonly kind: "quote"; readonly text: string };

export interface Post {
  /** URL segment under /blog, no umlaut. */
  readonly slug: string;
  readonly title: string;
  /** Day of publication as ISO date (YYYY-MM-DD); the page formats it. */
  readonly date: string;
  /** Two or three sentences: the list, the note on the board, <meta name="description">. */
  readonly summary: string;
  readonly body: readonly PostBlock[];
}

export interface PostLabels {
  /** Machine-readable date to formatted date, per locale. */
  readonly date: (iso: string) => string;
}

const labels: Readonly<Record<Locale, PostLabels>> = {
  de: {
    date: (iso) =>
      new Intl.DateTimeFormat("de-DE", {
        dateStyle: "long",
        timeZone: "UTC",
      }).format(new Date(`${iso}T00:00:00Z`)),
  },
};

export function getPostLabels(locale: Locale): PostLabels {
  return labels[locale];
}
