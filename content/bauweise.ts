import { REPOSITORY_URL } from "@/lib/build/info";
import type { Locale } from "@/lib/i18n";
import type { ContentBlock } from "./blocks";
import type { NavLink } from "./site";

// The colophon, /bauweise (docs/KONZEPT.md §10): how this site is built,
// written from what the repo does. Every claim here has a counterpart in
// the code or an ADR under docs/adr/; when a decision changes, this page
// changes with it. Structured like the other pages: sections the page
// renders as <Section>, each a list of blocks (content/blocks.ts).

export interface ColophonSection {
  /** Anchor of the section, no umlaut. */
  readonly id: string;
  /** The label in the left column. */
  readonly title: string;
  readonly blocks: readonly ContentBlock[];
}

export interface ColophonContent {
  readonly title: string;
  /** For <meta name="description">. */
  readonly description: string;
  /** Under the title, what this page is. */
  readonly intro: readonly string[];
  readonly sections: readonly ColophonSection[];
  /** The repository, at the foot of the page. */
  readonly source: {
    readonly lead: string;
    readonly link: NavLink;
  };
}

const de: ColophonContent = {
  title: "Wie diese Seite gebaut ist",
  description:
    "Eine 2D-Seite, darüber eine Werkstatt in 3D: Blender-Skripte, gebackenes Licht, Standbild als erster Paint, Strava und fuelivo auf dem Radcomputer, eigener Server, keine Cookies.",
  intro: [
    "Diese Seite ist selbst ein Projekt, also gilt für sie, was für jedes Projekt hier gilt: Problem, Ansatz, Ergebnis. Das hier ist der Ansatz, Entscheidung für Entscheidung, so wie sie im Repository festgehalten sind.",
  ],
  sections: [
    {
      id: "schichten",
      title: "Zwei Schichten",
      blocks: [
        {
          kind: "p",
          text: "Unten liegt eine normale Website: Next.js mit App Router, TypeScript, Tailwind, alle Texte als strukturierte Inhalte in Dateien, kein CMS und kein Markdown. Projekte, Beiträge, Impressum und diese Seite sind jeweils eine Datei, und ein Test prüft jede sichtbare Zeichenkette auf Gedankenstriche, Emoji und überflüssigen Whitespace.",
        },
        {
          kind: "p",
          text: "Darüber liegt auf der Startseite die Werkstatt, eine Szene mit React Three Fiber und three.js. Sie ist eine Schicht, nicht die Seite: Jeder Inhalt existiert auch ohne Canvas, jeder Hotspot führt auf eine gewöhnliche, schnelle Seite. Wer in der Garage auf den Laptop klickt, sieht dieselbe Projektliste wie unter Projekte.",
        },
        {
          kind: "p",
          text: "Die URL ist die Quelle der Wahrheit für den offenen Hotspot. Ein Klick in der Szene schreibt ?view= in die Adresszeile, der Zurück-Button des Browsers fährt die Kamera zurück, und jeder Link in die Garage lässt sich teilen.",
        },
      ],
    },
    {
      id: "blender",
      title: "Blender",
      blocks: [
        {
          kind: "p",
          text: "Kein Objekt der Szene ist von Hand modelliert. Raum, Möbel, Werkzeuge und das Rad entstehen aus Python-Skripten, die über Blenders bpy-API Boxen, Zylinder und Ringe mit Maßen in Metern setzen. Wer ein Möbelstück ändert, ändert eine Zahl im Skript und lässt es neu laufen; der nächste Lauf ersetzt seine Objekte per Name.",
        },
        {
          kind: "p",
          text: "Das Rad ist mein eigenes, nach der Maßtabelle des Herstellers gebaut, statt eines gekauften Modells, das den Stil vorgegeben hätte. Backstein, Asphalt und Holz sind Fototexturen unter freier Lizenz. Nur Stoff und Organisches ohne Maßbezug, ein Trikot am Haken oder ein Lappen auf der Werkbank, kommen als CC0-Modelle und werden vom Skript platziert wie alles andere.",
        },
        {
          kind: "p",
          text: "Was wo hängt, steht in JSON: die Zettel an der Pinnwand und die Werkzeuge an der Wand liest das Blender-Skript für die Geometrie und die Website für die Bedienoberfläche aus derselben Datei. Ein neuer Blogbeitrag braucht einen neuen Zettel, sonst schlägt ein Test fehl.",
        },
      ],
    },
    {
      id: "licht",
      title: "Licht",
      blocks: [
        {
          kind: "p",
          text: "Im Browser gibt es keine Lichtquelle. Das Tageslicht wird in Blender mit Cycles einmal berechnet und als Lightmap gebacken, eine einzige Textur für die ganze Szene. Jedes Material im Browser ist unbeleuchtet und multipliziert nur seine Farbe mit dieser Karte. Das ist der Grund, warum die Szene auf einem Laptop ohne Grafikkarte flüssig läuft.",
        },
        {
          kind: "p",
          text: "Damit helle Stellen weich auslaufen statt hart abzuschneiden, läuft ein kleiner Nachbearbeitungsschritt, der unter einer gemessenen Schwelle das Bild exakt so lässt, wie Cycles es gerendert hat. Vignette und warmer Farbstich sind kein Shader, sondern eine CSS-Ebene, die über Standbild und Canvas gleichermaßen liegt.",
        },
      ],
    },
    {
      id: "standbild",
      title: "Standbild",
      blocks: [
        {
          kind: "p",
          text: "Der erste Paint ist immer ein Standbild, beim Export mit derselben Kamera, demselben Material und demselben Licht gerendert wie die Szene. Erst danach entscheidet die Seite einmal, ob sie das Canvas darüberlegt: Wer Bewegung reduziert hat, ein schmales Display, kein WebGL2, einen Software-Renderer oder wenig Arbeitsspeicher hat, behält das Standbild.",
        },
        {
          kind: "p",
          text: "Das Standbild ist nicht abgespeckt. Die Hotspots sind Klickflächen in einem SVG über dem Bild, und der offene Hotspot erscheint als Karte mit demselben Inhalt, den die Szene zeigen würde. Die URL ist in beiden Fällen dieselbe.",
        },
      ],
    },
    {
      id: "radcomputer",
      title: "Radcomputer",
      blocks: [
        {
          kind: "p",
          text: "Der Radcomputer am Lenker zeigt echte Daten. Strava meldet jede neue Einheit per Webhook an den Server, der sie über die offizielle API holt und als JSON-Datei ablegt. Die Seite liest beim Aufruf nur diesen Cache und lässt Privates weg; Strava selbst wird pro Besuch nicht angefragt.",
        },
        {
          kind: "p",
          text: "Den Verpflegungsplan zu dieser Einheit rechnet fuelivo.de, mein Leitprojekt, nicht ein Nachbau in der Garage. Beim Sync geht ein Request an den öffentlichen Rechner, mit Dauer, Intensität, Sportart und Temperatur aus der Einheit, und das Ergebnis liegt neben ihr im Cache: ein Aufruf pro Einheit, keiner pro Besucher. Die drei Seiten des Geräts, Fahrt, Plan und Warum, sind ein DOM in den Farben des Originals, das auf die Glasfläche des Modells gelegt wird.",
        },
      ],
    },
    {
      id: "betrieb",
      title: "Betrieb",
      blocks: [
        {
          kind: "p",
          text: "Die Seite läuft als Docker-Container auf meinem eigenen Server, hinter Nginx, nicht bei einem Hosting-Dienst. GitHub Actions baut aus jedem Stand ein Image, legt es in der GitHub Container Registry ab und startet es per SSH auf dem Server. Auf dem Server wird nichts gebaut, und der Strava-Cache ist eine Datei auf einem Volume.",
        },
        {
          kind: "p",
          text: "Vor jedem Deploy steht dieselbe Quality Gate wie auf meinem Rechner: ESLint, Typecheck, Vitest, Build. Ist einer davon rot, kommt nichts auf den Server. Browser-Tests mit Playwright laufen gegen den Dev-Server und prüfen Hotspots, Standbild, Command Palette und die Textversion für die Konsole.",
        },
      ],
    },
    {
      id: "privatsphaere",
      title: "Privatsphäre",
      blocks: [
        {
          kind: "p",
          text: "Keine Cookies, kein lokaler Speicher, keine Webanalyse, kein Fehlertracking und keine Dienste Dritter im Browser. Die Schriften werden beim Bauen eingebunden und vom eigenen Server ausgeliefert. Die einzigen personenbezogenen Daten auf der Seite sind meine eigenen Trainingsdaten.",
        },
      ],
    },
  ],
  source: {
    lead: "Der Code ist öffentlich, inklusive der Entscheidungen als ADRs unter docs/adr.",
    link: {
      label: "spockey4711/portfolio-garage auf GitHub",
      href: REPOSITORY_URL,
    },
  },
};

const content: Readonly<Record<Locale, ColophonContent>> = { de };

export function getColophonContent(locale: Locale): ColophonContent {
  return content[locale];
}
