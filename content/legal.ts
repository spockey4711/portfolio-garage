import type { Locale } from "@/lib/i18n";
import type { NavLink } from "./site";

// The two legal pages, /impressum and /datenschutz, and the person behind
// them. Source material is Portfolio2 (docs/adr/0001), rewritten for what
// this site actually does: self-hosted on the VPS (docs/adr/0002), fonts
// bundled at build time, no cookies, no storage, no analytics, no error
// tracking, and my own training data from Strava (docs/adr/0008). If the
// processing changes, this file changes with it.
//
// Impressum under § 5 DDG and § 18 Abs. 2 MStV: the full postal address is
// required. Datenschutzerklärung under the DSGVO.

/** The responsible person, shared by both pages. */
export const legalEntity = {
  name: "Yannik Wünker",
  street: "Lövenicher Weg 2b",
  postalCode: "50933",
  city: "Köln",
  country: "Deutschland",
  email: "mail@yannikwuenker.de",
} as const;

// The hosting provider processes the server logs on my behalf (Art. 28
// DSGVO). Data, so the text stays right if the provider changes.
const hostingProvider = {
  name: "Contabo GmbH",
  address: "Aschauer Straße 32a, 81549 München, Deutschland",
} as const;

export interface LegalSection {
  /** Rendered as the h2 of the section. */
  readonly heading: string;
  readonly paragraphs?: readonly string[];
  /** Postal lines, rendered as one <address>. */
  readonly address?: readonly string[];
  /** Labelled links after the paragraphs, e.g. the mail address. */
  readonly links?: readonly NavLink[];
  /** Rendered as an unordered list after the paragraphs. */
  readonly items?: readonly string[];
}

export interface LegalPage {
  readonly title: string;
  /** For <meta name="description">. */
  readonly description: string;
  /** Under the title, what this page is in two sentences. */
  readonly intro?: string;
  readonly sections: readonly LegalSection[];
  /** Free text, e.g. "September 2026". */
  readonly updated: string;
}

export interface LegalContent {
  readonly imprint: LegalPage;
  readonly privacy: LegalPage;
  /** Prefix in front of `updated` at the foot of the page. */
  readonly updatedLabel: string;
}

const addressLines: readonly string[] = [
  legalEntity.name,
  legalEntity.street,
  `${legalEntity.postalCode} ${legalEntity.city}`,
  legalEntity.country,
];

const emailLink: NavLink = {
  label: legalEntity.email,
  href: `mailto:${legalEntity.email}`,
};

const imprintDe: LegalPage = {
  title: "Impressum",
  description: "Anbieterkennzeichnung nach § 5 DDG.",
  updated: "September 2026",
  sections: [
    {
      heading: "Angaben gemäß § 5 DDG",
      address: addressLines,
    },
    {
      heading: "Kontakt",
      paragraphs: ["Am schnellsten erreichst du mich per E-Mail:"],
      links: [emailLink],
    },
    {
      heading: "Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV",
      address: addressLines,
    },
    {
      heading: "Verbraucherstreitbeilegung",
      paragraphs: [
        "Ich bin nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
      ],
    },
    {
      heading: "Haftung für Inhalte",
      paragraphs: [
        "Die Inhalte dieser Website habe ich mit Sorgfalt erstellt. Für Richtigkeit, Vollständigkeit und Aktualität übernehme ich trotzdem keine Gewähr. Für eigene Inhalte bin ich nach den allgemeinen Gesetzen verantwortlich; ich bin aber nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.",
      ],
    },
    {
      heading: "Haftung für Links",
      paragraphs: [
        "Diese Website verlinkt auf Seiten Dritter, auf deren Inhalte ich keinen Einfluss habe. Für diese Inhalte ist der jeweilige Anbieter verantwortlich, ich kann dafür keine Gewähr übernehmen. Werden mir Rechtsverletzungen bekannt, entferne ich den Link.",
      ],
    },
    {
      heading: "Urheberrecht",
      paragraphs: [
        "Texte, Bilder, die 3D-Szene und der Code dieser Website unterliegen dem deutschen Urheberrecht. Beiträge Dritter sind als solche gekennzeichnet. Vervielfältigung, Bearbeitung, Verbreitung und jede Verwertung außerhalb der Grenzen des Urheberrechts brauchen meine schriftliche Zustimmung.",
      ],
    },
  ],
};

const privacyDe: LegalPage = {
  title: "Datenschutzerklärung",
  description: "Wie diese Website mit personenbezogenen Daten umgeht (DSGVO).",
  intro:
    "Diese Website ist ein privates Portfolio. Ich verarbeite so wenige personenbezogene Daten wie möglich: das, was technisch nötig ist, um die Seite auszuliefern, und das, was du mir selbst per E-Mail schreibst. Die Trainingsdaten auf der Seite sind meine eigenen.",
  updated: "September 2026",
  sections: [
    {
      heading: "Verantwortlicher",
      paragraphs: [
        "Verantwortlich für die Datenverarbeitung auf dieser Website ist:",
      ],
      address: addressLines,
      links: [emailLink],
    },
    {
      heading: "Hosting und Server-Logfiles",
      paragraphs: [
        `Diese Website läuft auf einem Server der ${hostingProvider.name} (${hostingProvider.address}). Der Hoster verarbeitet die folgenden Logdaten in meinem Auftrag, dazu besteht ein Vertrag über die Auftragsverarbeitung nach Art. 28 DSGVO.`,
        "Bei jedem Aufruf schreibt der Webserver automatisch einen Eintrag in ein Logfile: die IP-Adresse des anfragenden Geräts, Datum und Uhrzeit, die aufgerufene Adresse, die zuvor besuchte Seite (Referrer) sowie Browser und Betriebssystem.",
        "Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Mein berechtigtes Interesse ist der technisch fehlerfreie, sichere und stabile Betrieb der Website. Die Logs werden nicht mit anderen Daten zusammengeführt und gelöscht, sobald sie für diesen Zweck nicht mehr nötig sind.",
      ],
    },
    {
      heading: "Verschlüsselung",
      paragraphs: [
        "Die Verbindung zu dieser Website ist per TLS verschlüsselt, erkennbar am Schloss in der Adresszeile und am Präfix https://. Was du an die Seite überträgst, können Dritte unterwegs nicht mitlesen.",
      ],
    },
    {
      heading: "Schriftarten und 3D-Szene",
      paragraphs: [
        "Die Schriftarten werden beim Bauen der Seite fest eingebunden und von meinem eigenen Server ausgeliefert. Beim Laden entsteht keine Verbindung zu Servern Dritter, etwa zu Google Fonts; deine IP-Adresse wird dabei an niemanden übertragen.",
        "Dasselbe gilt für die Werkstatt auf der Startseite: das 3D-Modell, die Texturen und die Standbilder liegen auf meinem Server. Ob dein Browser die Szene darstellen kann, prüft die Seite einmal lokal in deinem Browser (Bewegungsreduktion, Bildschirmgröße, WebGL, Arbeitsspeicher). Das Ergebnis bleibt im Browser und wird nicht übertragen.",
      ],
    },
    {
      heading: "Cookies und lokale Speicherung",
      paragraphs: [
        "Diese Website setzt keine Cookies und legt nichts im Speicher deines Browsers ab. Es gibt keine Webanalyse, kein Fehlertracking und keine Einbindung von Diensten Dritter im Browser.",
      ],
    },
    {
      heading: "Trainingsdaten aus Strava",
      paragraphs: [
        "Der Radcomputer in der Werkstatt und die Projektseite zu fuelivo zeigen meine eigene letzte Trainingseinheit und den Verpflegungsplan dazu. Diese Daten kommen über die Strava-API auf meinen Server; der Plan wird dort bei fuelivo.de gerechnet und zwischengespeichert. Als privat markierte Einheiten bleiben außen vor.",
        "Dein Browser lädt diese Daten ausschließlich von dieser Website. Er baut keine Verbindung zu Strava oder zu fuelivo.de auf, und es werden keine Daten über dich dorthin übertragen.",
      ],
    },
    {
      heading: "Kontakt per E-Mail",
      paragraphs: [
        "Wenn du mir eine E-Mail schreibst, verarbeite ich deine Angaben (E-Mail-Adresse, Name und den Inhalt deiner Nachricht) nur, um deine Anfrage zu beantworten.",
        "Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, wenn deine Anfrage der Anbahnung oder Erfüllung eines Vertrags dient, sonst Art. 6 Abs. 1 lit. f DSGVO aufgrund meines berechtigten Interesses an der Beantwortung. Ich speichere die Daten, bis deine Anfrage abschließend bearbeitet ist und keine gesetzlichen Aufbewahrungspflichten entgegenstehen; danach lösche ich sie.",
      ],
    },
    {
      heading: "Externe Links",
      paragraphs: [
        "Diese Website verlinkt auf externe Seiten und Profile, zum Beispiel GitHub, LinkedIn, fuelivo.de und aurelian.yannikwuenker.de. Das sind einfache Links: Solange du sie nicht anklickst, werden keine Daten an diese Anbieter übertragen. Folgst du einem Link, gelten die Datenschutzbestimmungen des jeweiligen Anbieters, auf dessen Verarbeitung ich keinen Einfluss habe.",
      ],
    },
    {
      heading: "Deine Rechte",
      paragraphs: [
        "Im Rahmen der gesetzlichen Vorgaben stehen dir jederzeit diese Rechte zu:",
      ],
      items: [
        "Auskunft über die zu deiner Person gespeicherten Daten (Art. 15 DSGVO)",
        "Berichtigung unrichtiger Daten (Art. 16 DSGVO)",
        "Löschung deiner Daten (Art. 17 DSGVO)",
        "Einschränkung der Verarbeitung (Art. 18 DSGVO)",
        "Datenübertragbarkeit (Art. 20 DSGVO)",
        "Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)",
        "Widerruf einer erteilten Einwilligung mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO)",
      ],
    },
    {
      heading: "Beschwerderecht bei der Aufsichtsbehörde",
      paragraphs: [
        "Unabhängig davon kannst du dich nach Art. 77 DSGVO bei einer Datenschutz-Aufsichtsbehörde beschweren, wenn du der Ansicht bist, dass die Verarbeitung deiner Daten gegen die DSGVO verstößt. Für meinen Wohnsitz zuständig ist die Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen (LDI NRW).",
      ],
    },
    {
      heading: "Änderungen",
      paragraphs: [
        "Ich passe diese Datenschutzerklärung an, sobald Änderungen der Website oder der Rechtslage es erfordern. Es gilt die hier veröffentlichte Fassung.",
      ],
    },
  ],
};

const de: LegalContent = {
  imprint: imprintDe,
  privacy: privacyDe,
  updatedLabel: "Stand",
};

const content: Readonly<Record<Locale, LegalContent>> = { de };

export function getLegalContent(locale: Locale): LegalContent {
  return content[locale];
}
