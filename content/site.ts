import type { Locale } from "@/lib/i18n";

// The strings around the content: header, footer, the start page below the
// garage and the chrome of a project page. The garage's own strings live in
// content/garage.ts, the about page in content/about.ts, the projects in
// content/projects/.

export interface NavLink {
  readonly label: string;
  readonly href: string;
}

export interface SiteContent {
  readonly name: string;
  /** One sentence for <meta name="description"> and the start page. */
  readonly description: string;
  readonly nav: {
    /** Accessible name of the site navigation. */
    readonly label: string;
    readonly links: readonly NavLink[];
  };
  readonly footer: {
    readonly label: string;
    readonly links: readonly NavLink[];
  };
  readonly home: {
    /** Under the name: what, where, current role, current build. */
    readonly positioning: string;
    readonly intro: string;
    readonly projects: {
      readonly title: string;
      readonly intro: string;
    };
    readonly about: {
      readonly title: string;
      readonly teaser: string;
      readonly more: NavLink;
    };
  };
  readonly project: {
    readonly back: NavLink;
    readonly sections: {
      readonly problem: string;
      readonly approach: string;
      readonly result: string;
      readonly stack: string;
      readonly learnings: string;
    };
  };
}

const de: SiteContent = {
  name: "Yannik Wünker",
  description:
    "Wirtschaftsinformatik in Köln, baut Software für Ausdauersportler. Portfolio als Fahrrad-Werkstatt.",
  nav: {
    label: "Seitennavigation",
    links: [
      { label: "Projekte", href: "/#projekte" },
      { label: "Über mich", href: "/ueber" },
    ],
  },
  footer: {
    label: "Kontakt",
    links: [
      { label: "mail@yannikwuenker.de", href: "mailto:mail@yannikwuenker.de" },
      { label: "GitHub", href: "https://github.com/spockey4711" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/yannik-wuenker" },
    ],
  },
  home: {
    positioning: "Baut Software für Ausdauersportler. Köln.",
    intro:
      "Ich studiere Wirtschaftsinformatik an der Universität zu Köln, arbeite als Werkstudent beim Institut der deutschen Wirtschaft und baue nebenbei die Dinge, die ich selbst gebraucht hätte. Das größte davon ist fuelivo, ein Verpflegungsrechner für Ausdauersport im Web und auf iOS.",
    projects: {
      title: "Projekte",
      intro: "Jedes mit Problem, Ansatz und dem, was daraus geworden ist.",
    },
    about: {
      title: "Über mich",
      teaser:
        "Neben dem Studium mache ich viel Sport: Rad, Hockey, Laufen, Gym. Deshalb steht oben eine Werkstatt und kein Hero-Bild.",
      more: { label: "Mehr über mich", href: "/ueber" },
    },
  },
  project: {
    back: { label: "Alle Projekte", href: "/#projekte" },
    sections: {
      problem: "Problem",
      approach: "Ansatz",
      result: "Ergebnis",
      stack: "Stack",
      learnings: "Gelernt",
    },
  },
};

const content: Readonly<Record<Locale, SiteContent>> = { de };

export function getSiteContent(locale: Locale): SiteContent {
  return content[locale];
}
