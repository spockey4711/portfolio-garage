import type { Locale } from "@/lib/i18n";

// One project is one file in this directory; index.ts decides membership and
// order. The model is the story the concept asks for (docs/adr/0001: problem,
// approach, result with evidence), nothing a card or a page would not show.

/** Where the project stands. The label is always shown, never colour alone. */
export type ProjectStatus = "live" | "mvp";

/** What shape the project is: the second fact on every card. */
export type ProjectKind = "web-ios" | "ios" | "cli";

export interface ProjectLink {
  readonly href: string;
  /** Which kind of link: sets the label the page shows. */
  readonly kind: "live" | "repo";
}

export interface Project {
  /** URL segment under /projekte, no umlaut. */
  readonly slug: string;
  readonly name: string;
  /** One line under the name, on the card and the page. */
  readonly tagline: string;
  readonly status: ProjectStatus;
  readonly kind: ProjectKind;
  /** The year the work happened, from the project's own commit history. */
  readonly year: number;
  /** What real problem it solves, one paragraph. */
  readonly problem: string;
  /** How it solves it: a paragraph, then the decisions that carry it. */
  readonly approach: {
    readonly intro: string;
    readonly points: readonly string[];
  };
  /** What exists now, with numbers where there are any. */
  readonly result: string;
  readonly stack: readonly string[];
  /** Honest takeaways, first person. */
  readonly learnings: readonly string[];
  readonly links: readonly ProjectLink[];
  /**
   * A live block on the page after the approach: "fuelplan" is the plan
   * fuelivo.de calculates for the last ride (docs/adr/0008,
   * components/site/FuelPlanCard.tsx). Omitted for a project without one.
   */
  readonly demo?: "fuelplan";
}

export interface ProjectLabels {
  readonly status: Readonly<Record<ProjectStatus, string>>;
  readonly kind: Readonly<Record<ProjectKind, string>>;
  readonly link: Readonly<Record<ProjectLink["kind"], string>>;
}

const labels: Readonly<Record<Locale, ProjectLabels>> = {
  de: {
    status: { live: "Live", mvp: "MVP" },
    kind: { "web-ios": "Web und iOS", ios: "iOS-App", cli: "CLI" },
    link: { live: "Live ansehen", repo: "Code auf GitHub" },
  },
};

export function getProjectLabels(locale: Locale): ProjectLabels {
  return labels[locale];
}
