import type { Locale } from "@/lib/i18n";
import { aurelian } from "./aurelian";
import { devblueprint } from "./devblueprint";
import { fuelivo } from "./fuelivo";
import type { Project } from "./types";

export type {
  Project,
  ProjectKind,
  ProjectLabels,
  ProjectStatus,
} from "./types";
export { getProjectLabels } from "./types";

// Membership and order in one place: the first entry is the featured
// project, the rest follow by maturity and interest. Slugs and order are the
// same in every locale, so the route's static params read this list directly.
const projects: readonly Project[] = [fuelivo, aurelian, devblueprint];

const byLocale: Readonly<Record<Locale, readonly Project[]>> = { de: projects };

export function getProjects(locale: Locale): readonly Project[] {
  return byLocale[locale];
}

/** The project behind a /projekte/<slug> URL, or undefined for an unknown slug. */
export function getProject(slug: string, locale: Locale): Project | undefined {
  return byLocale[locale].find((project) => project.slug === slug);
}
