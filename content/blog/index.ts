import type { Locale } from "@/lib/i18n";
import { lichtAusDemOfen } from "./licht-aus-dem-ofen";
import type { Post } from "./types";
import { warumEineWerkstatt } from "./warum-eine-werkstatt";

export type { Post, PostBlock, PostLabels } from "./types";
export { getPostLabels } from "./types";

// Membership and order in one place, newest first. Slugs and order are the
// same in every locale, so the route's static params read this list directly,
// and lib/garage/pinboard.json names these slugs for the notes on the board.
const posts: readonly Post[] = [lichtAusDemOfen, warumEineWerkstatt];

const byLocale: Readonly<Record<Locale, readonly Post[]>> = { de: posts };

export function getPosts(locale: Locale): readonly Post[] {
  return byLocale[locale];
}

/** The post behind a /blog/<slug> URL, or undefined for an unknown slug. */
export function getPost(slug: string, locale: Locale): Post | undefined {
  return byLocale[locale].find((post) => post.slug === slug);
}
