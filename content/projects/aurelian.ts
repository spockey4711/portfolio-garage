import type { Project } from "./types";

export const aurelian: Project = {
  slug: "aurelian",
  name: "Aurelian",
  tagline:
    "Stoische Tagesreflexion in unter zwei Minuten, bezogen auf den echten Tag.",
  status: "mvp",
  kind: "ios",
  year: 2026,
  problem:
    "Stoizismus-Apps liefern Zitate ohne Bezug zum Alltag, Journal-Apps verlangen zu viel Input und fühlen sich nach Arbeit an, und KI-Reflexionstools erfinden Zitate. Bei philosophischen Quellen ist das sofort das Ende der Glaubwürdigkeit.",
  approach: {
    intro:
      "Morgens ein bis drei wichtige Dinge, optional was einen beschäftigt, dazu das Energie-Level. Daraus macht Aurelian eine stoische Perspektive und eine konkrete Tagesregel, abends folgen drei kurze Fragen. Die Ausgabe ist fest strukturiert: Zitat, Quelle, Perspektive, Kontrollfrage, Tagesregel, Abendfrage. Kurz und konkret statt Motivationsrede.",
    points: [
      "Zitate bleiben in einer geprüften lokalen Datenbank mit Provenienz. Eine deterministische Auswahl übergibt der KI nur zulässige Kandidaten, die KI wählt genau eine ID und erfindet nie.",
      "Local-first und modular: ein Swift Package in fünf Targets hält Domänen- und Anwendungslogik frei von SwiftUI und SwiftData, testbar ohne Simulator.",
      "Die Generierung läuft auf einem stateless Node-Endpoint mit serverseitigem Key, Rate-Limit und einem Output pro Nutzer und Tag. Ohne Endpoint generiert die App lokal weiter.",
    ],
  },
  result:
    "MVP mit Onboarding, Morning Check-in, Abend-Reflexion, Journal, lokalen Remindern und Offline-Fallback, dazu eine statische Public-Site. Rund 4.500 Zeilen Swift, 80 geprüfte Zitate, 26 Test-Dateien in fünf Test-Targets. Favoriten, Wochenrückblick und Paywall sind geplant.",
  stack: [
    "Swift 6",
    "SwiftUI",
    "SwiftData",
    "Swift Package Manager",
    "Node.js",
  ],
  learnings: [
    "Zitat-Halluzinationen sind kein Prompt-Problem, sondern ein Architektur-Problem: Die KI bekommt Kandidaten, keine Freiheit.",
    "Eine port-basierte Architektur hält Produktregeln unabhängig vom UI-Framework. Die Domänenschicht hängt von nichts ab und lässt sich in Sekunden prüfen.",
    "Text-Input-Latenz auf iOS ist real. Eine eigene Untersuchung und Pufferung der Eingaben hat den Heute-Screen flüssig gehalten.",
  ],
  links: [{ kind: "live", href: "https://aurelian.yannikwuenker.de/" }],
};
