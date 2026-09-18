import type { Locale } from "@/lib/i18n";

// The /ueber page. First person, concrete, cycling as part of the picture
// (docs/adr/0001): the garage is a bike workshop, so the bike belongs here.

export interface CareerEntry {
  readonly role: string;
  readonly org: string;
  /** Free text, e.g. "seit Oktober 2024"; Intl cannot phrase an open range. */
  readonly period: string;
  readonly description: string;
}

export interface SkillGroup {
  readonly title: string;
  readonly items: readonly string[];
}

export interface AboutContent {
  readonly title: string;
  /** For <meta name="description">. */
  readonly description: string;
  readonly intro: readonly string[];
  readonly career: {
    readonly title: string;
    readonly entries: readonly CareerEntry[];
  };
  readonly skills: {
    readonly title: string;
    readonly groups: readonly SkillGroup[];
  };
  readonly principles: {
    readonly title: string;
    readonly items: readonly string[];
  };
  readonly contact: {
    readonly title: string;
    readonly lead: string;
    readonly email: string;
  };
}

const de: AboutContent = {
  title: "Über mich",
  description:
    "Wirtschaftsinformatik-Student in Köln, Werkstudent, baut Software für Ausdauersportler. Werdegang, Stack und wie ich arbeite.",
  intro: [
    "Ich studiere Wirtschaftsinformatik an der Universität zu Köln und baue nebenbei die Dinge, die ich selbst gebraucht hätte. Mein bisher größtes Projekt ist fuelivo: Aus Dauer, Intensität, Sportart und ein paar Angaben zur Verträglichkeit wird ein konkreter Verpflegungsplan, in Gramm und Millilitern statt in Faustregeln. Es war das erste Projekt, das über ein Python-Skript mit README hinausgewachsen ist, mit eigener Domain, CI und einer nativen iOS-App.",
    "Neben dem Studium mache ich viel Sport: Rad, Hockey, Laufen, Gym und was sonst gerade ansteht. Das prägt, wie ich arbeite. Ein Plan, saubere Ausführung, und Dinge zu Ende bringen. Deshalb steht auf der Startseite eine Werkstatt und kein Hero-Bild.",
  ],
  career: {
    title: "Werdegang",
    entries: [
      {
        role: "Werkstudent",
        org: "Institut der deutschen Wirtschaft",
        period: "seit März 2025",
        description:
          "Patentdatenbank-Projekt: Datenanalyse und Prozessoptimierung.",
      },
      {
        role: "B.Sc. Wirtschaftsinformatik",
        org: "Universität zu Köln",
        period: "seit Oktober 2024",
        description:
          "Datenanalyse, Prozessoptimierung, Softwareentwicklung, Produktmanagement und KI-Anwendungen.",
      },
    ],
  },
  skills: {
    title: "Stack",
    groups: [
      {
        title: "Sprachen",
        items: ["Python", "TypeScript", "Swift", "Java", "SQL"],
      },
      {
        title: "Bauen",
        items: [
          "FastAPI",
          "React und Next.js",
          "SwiftUI",
          "PostgreSQL",
          "Docker",
          "GitHub Actions",
        ],
      },
      {
        title: "Arbeiten",
        items: [
          "Prozessanalyse",
          "Datenmodellierung",
          "Requirements",
          "Dokumentation",
          "KI als Entwicklungswerkzeug",
        ],
      },
    ],
  },
  principles: {
    title: "Wie ich arbeite",
    items: [
      "Erst das Problem, dann der Code.",
      "Deterministische Logik, wo sie zählt. Jede Ausgabe hat einen Grund.",
      "Bauen und iterieren statt endlos planen.",
      "Dokumentieren, während ich baue, nicht danach.",
      "KI als Werkzeug, nicht als Autopilot.",
    ],
  },
  contact: {
    title: "Kontakt",
    lead: "Am schnellsten per Mail, ob Werkstudentenstelle, Projekt oder einfach eine Frage.",
    email: "mail@yannikwuenker.de",
  },
};

const content: Readonly<Record<Locale, AboutContent>> = { de };

export function getAboutContent(locale: Locale): AboutContent {
  return content[locale];
}
