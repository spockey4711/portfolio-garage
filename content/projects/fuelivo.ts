import type { Project } from "./types";

// The featured project, first in the list. Facts come from the repository's
// own history and the case study in Portfolio2-public (docs/adr/0001).
export const fuelivo: Project = {
  slug: "fuelivo",
  name: "fuelivo",
  tagline:
    "Verpflegungsplan für Ausdauersport aus wenigen Eingaben, deterministisch und mit Begründung.",
  status: "live",
  kind: "web-ios",
  year: 2026,
  problem:
    "Wie viel Kohlenhydrate, Flüssigkeit und Natrium eine Einheit braucht, hängt von Dauer, Intensität, Sportart, Hitze und Magen ab. Zu wenig heißt Einbruch, zu viel oder das Falsche heißt Magenprobleme. Faustregeln wie 60 g pro Stunde ignorieren das, Ernährungs-Apps rechnen Tagesbilanzen statt Sessions, und KI-Coaches liefern Zahlen, die man nicht nachvollziehen kann.",
  approach: {
    intro:
      "fuelivo bildet publizierte Sporternährungs-Heuristiken als Regel-Engine ab. Aus den Session-Parametern werden Ziele pro Stunde, hochgerechnet auf die Dauer, aufgeteilt auf vor, während und nach der Einheit und übersetzt in Produkte: Getränk, Gel, Riegel, Banane. Jeder Rechenschritt schreibt seinen Grund mit, Grenzfälle erzeugen Warnungen. Keine Blackbox, kein KI-Coach.",
    points: [
      "Additives Matrix-Modell: ein Basiswert aus der Dauer plus Modifikatoren für Intensität, Sportart und Hitze, gedeckelt durch eine Toleranz-Matrix aus Magenempfindlichkeit und Magentraining.",
      "Backend, Web-App und native iOS-App teilen dieselbe Logik. Die App spricht eine versionierte Mobile-API, ein Contract-Check in der CI erkennt Drift schon im Pull Request.",
      "Pro-Zugang über Stripe im Web und StoreKit auf iOS, aufgelöst von einem Entitlement-Service: eine Quelle der Wahrheit für Feature-Flags, keine Route prüft den Zahlungsstatus selbst.",
      "Die Umstellung vom multiplikativen auf das additive Modell lief mit beiden Modi im Code und einem Shadow-Compare, damit sich keine Empfehlung unbemerkt verschiebt.",
      "Schwimmen hat eine eigene Pool-Flaschen-Logik mit Sip-Timing an der Wand, weil Gel und Riegel im Becken keinen Sinn ergeben.",
    ],
  },
  result:
    "Live auf fuelivo.de mit öffentlichem Rechner ohne Login, Drei-Phasen-Empfehlung, Race-Plan mit Aid-Station-Taktung, Athleten-Dashboard, Coach-Portal und nativer iOS-App, auf Deutsch und Englisch. Rund 16.000 Zeilen Python im Backend und 17.000 Zeilen Swift in der App, 13 Tabellen, 5 CI-Workflows, 269 Commits zwischen März und Juni 2026.",
  stack: [
    "Python",
    "FastAPI",
    "PostgreSQL",
    "React",
    "Tailwind CSS",
    "SwiftUI",
    "Stripe",
    "StoreKit",
    "Docker",
    "GitHub Actions",
  ],
  learnings: [
    "Zum ersten Mal Backend, Web-Frontend und native App in einem Projekt. Die Schichtung Route, Service, Repository hat sich beim zweiten Client ausgezahlt: die Logik blieb, nur die Transportschicht kam dazu.",
    "Eine versionierte API mit OpenAPI-Spec und Contract-Check in der CI ist der Punkt, an dem Backend und App aufhören, auseinanderzudriften.",
    "Das erste Projekt, das über ein Python-Skript mit README hinausgewachsen ist: eigene Domain, DNS, CI/CD, Deployment.",
    "Beim nächsten Mal ein Deployment-Pfad statt Docker und Vercel parallel, und gemeinsame Typen zwischen Backend und iOS früher.",
  ],
  links: [{ kind: "live", href: "https://fuelivo.de" }],
  demo: "fuelplan",
};
