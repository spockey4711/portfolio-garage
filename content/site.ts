import type { Intensity, NoPlanReason } from "@/lib/fuelivo/request";
import type { Locale } from "@/lib/i18n";
import type { CommandGroup } from "@/lib/palette";

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
    /** The colophon, /bauweise, first in the row under the contact links. */
    readonly colophon: NavLink;
    /** Impressum and Datenschutz, after the colophon in that row. */
    readonly legal: readonly NavLink[];
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
    readonly blog: {
      readonly title: string;
      readonly intro: string;
    };
  };
  /** The command palette (docs/KONZEPT.md §10): cmd+K, or the button in the header. */
  readonly palette: {
    /** Accessible name of the dialog and of the button that opens it. */
    readonly label: string;
    readonly placeholder: string;
    /** Shown in place of the list when nothing matches. */
    readonly empty: string;
    /** Headings of the list, one per group. */
    readonly groups: Readonly<Record<CommandGroup, string>>;
    /** The start page in the list; the nav has no link to it. */
    readonly home: string;
    readonly copyMail: {
      readonly label: string;
      /** Replaces the label for a moment once the address is on the clipboard. */
      readonly done: string;
    };
    /** The CV under public/; "laden" because the file is offered for download. */
    readonly cv: NavLink;
  };
  /** The text version of / that curl and friends get (lib/terminal/card.ts). */
  readonly terminal: {
    /** The closing line; the site's address follows on the same line. */
    readonly browser: string;
  };
  /** The chrome of a /blog/<slug> page. */
  readonly post: {
    readonly back: NavLink;
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
    /** The live demo on /projekte/fuelivo (docs/adr/0008): the plan for the last ride. */
    readonly plan: {
      readonly title: string;
      /** Where the numbers come from, one sentence. */
      readonly intro: string;
      readonly loading: string;
      readonly noActivity: string;
      /** Why there is no plan for the ride, by reason. */
      readonly noPlan: Readonly<Record<NoPlanReason | "pending", string>>;
      /** The input line: intensity words as Fuelivo grades them. */
      readonly intensity: Readonly<Record<Intensity, string>>;
      readonly sports: Readonly<Record<string, string>>;
      readonly perHour: string;
      readonly total: string;
      readonly carbs: string;
      readonly fluid: string;
      readonly sodium: string;
      readonly rationale: string;
      readonly warnings: string;
      /** Link to the calculator, after the card. */
      readonly more: NavLink;
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
      { label: "Blog", href: "/#blog" },
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
    colophon: { label: "Wie diese Seite gebaut ist", href: "/bauweise" },
    legal: [
      { label: "Impressum", href: "/impressum" },
      { label: "Datenschutz", href: "/datenschutz" },
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
    blog: {
      title: "Blog",
      intro:
        "Notizen aus der Werkstatt: was ich gebaut habe und warum, wenn es eine Erklärung wert ist.",
    },
  },
  palette: {
    label: "Befehle",
    placeholder: "Seite, Projekt, Beitrag oder Aktion",
    empty: "Nichts gefunden.",
    groups: {
      pages: "Seiten",
      projects: "Projekte",
      blog: "Blog",
      garage: "Werkstatt",
      actions: "Aktionen",
    },
    home: "Startseite",
    copyMail: { label: "Mail kopieren", done: "Kopiert" },
    cv: { label: "CV laden", href: "/cv/yannik-wuenker.pdf" },
  },
  terminal: {
    browser: "Die Werkstatt in 3D gibt es im Browser:",
  },
  post: {
    back: { label: "Alle Beiträge", href: "/#blog" },
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
    plan: {
      title: "Live",
      intro:
        "Der Plan zu meiner letzten Einheit auf Strava, gerechnet von fuelivo.de aus Dauer, Intensität, Sportart und Temperatur. Derselbe Plan steht in der Werkstatt auf dem Radcomputer.",
      loading: "Plan wird geladen",
      noActivity: "Noch keine Einheit im Cache.",
      noPlan: {
        sport: "Für diese Sportart rechnet fuelivo keinen Plan.",
        duration: "Unter 30 Minuten rechnet fuelivo keinen Plan.",
        pending: "Der Plan folgt nach dem nächsten Sync.",
      },
      intensity: { easy: "locker", moderate: "moderat", hard: "hart" },
      sports: {
        Ride: "Rad",
        VirtualRide: "Rolle",
        GravelRide: "Gravel",
        MountainBikeRide: "MTB",
        EBikeRide: "E-Bike",
        Run: "Laufen",
        TrailRun: "Trail",
        VirtualRun: "Laufband",
        Walk: "Gehen",
        Hike: "Wandern",
        Swim: "Schwimmen",
        WeightTraining: "Kraft",
        Workout: "Workout",
        Yoga: "Yoga",
      },
      perHour: "pro Stunde",
      total: "gesamt",
      carbs: "Kohlenhydrate",
      fluid: "Flüssigkeit",
      sodium: "Natrium",
      rationale: "Begründung",
      warnings: "Warnungen",
      more: {
        label: "Selbst rechnen auf fuelivo.de",
        href: "https://fuelivo.de/calculate",
      },
    },
  },
};

const content: Readonly<Record<Locale, SiteContent>> = { de };

export function getSiteContent(locale: Locale): SiteContent {
  return content[locale];
}
