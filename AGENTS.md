<!-- AGENTS.md ist die Quelle der Wahrheit, CLAUDE.md ist ein Symlink hierauf. -->

# Projekt

Portfolio als Fahrrad-Werkstatt-Garage in 3D (R3F), der Radcomputer ist das "OS" und zeigt
echte Trainingsdaten. Konzept mit Szene, Hotspots, Kamera, Stack und Phasen: `docs/KONZEPT.md`,
Maße des Blockouts dort in §2. Zeitplan und Setup-Reihenfolge: `docs/PLAN.md`,
Budget und Hebel für Wärme und Detail: `docs/ATMOSPHAERE.md`. Blender-Quelle:
`blender/garage-blockout.blend`.

Stand 2026-09-18: Tag 0 aus `docs/PLAN.md` ist erledigt (Scaffold, Toolchain, CI, 3D-Stack,
Blockout im Browser mit Parallax). Toolchain-Vorlage ist Kuechenzettel, devblueprint kommt
nicht zum Einsatz. Aus Woche 1 steht der Code: Store, Kamerafahrten, Hotspot-Klick,
`?view=`-Sync, Tastatur, Hover-Outline, Screens als `<Html transform occlude>` mit
Platzhalter-UI, Deploy auf `garage.yannikwuenker.de` (`docs/BETRIEB.md`). Woche 1 komplett:
Szene aus bpy-Skripten in `blender/build/` (ADR-0004). Woche 2 bis auf das Go-live komplett.
Aus Phase 2 steht die Strava-Anbindung (Webhook, Sync, `/api/activity`) und der Radcomputer
(`BikeComputer.tsx`: die ganze Glasfront eines Edge 540 als DOM, Garmin-Farben, drei Seiten
Fahrt, Plan, Warum, Pfeiltasten, Daten aus `/api/activity`, Logik in `lib/garage/computer.ts`;
Gehäuse, Tasten und Glas kommen aus `build_bike.py`, Glas und DOM teilen sich das Pixelmaß),
die Pinnwand (`Pinboard.tsx`, alles darauf verlinkt nach `/ueber`) und der Laptop
(`Laptop.tsx`, Projektliste, Standbild-Karte über `ScreenSpec.Card`). Seit ADR-0008 (2026-09-19) gilt eine neue Zuordnung, der Umbau steht in
`docs/PLAN.md`: Radcomputer zeigt Fuelivo, gerechnet von `fuelivo.de/calculate` auf der
letzten Strava-Einheit (erledigt), Laptop die Projektliste, Pinnwand den Blog, Whiteboard
Über mich, Werkzeugwand den Stack.

Licht: nichts wird zur Laufzeit beleuchtet. Der Skill `blender-export` backt Tageslicht in
`public/models/garage-lightmap-tag.webp` (Licht ohne Farbe, UV-Set 2), `Scene.tsx` tauscht
jedes GLB-Material gegen `MeshBasicMaterial` mit dieser Lightmap und der Textur des Materials
(UV-Set 1 in Weltmetern, `lib/garage/lightmap.ts`). Backstein, Asphalt und Holz sind
Fototexturen aus `blender/textures/` (ADR-0006), alles andere Flächenfarbe. Die
Belichtung der Datei und `LIGHTMAP_INTENSITY` gehören zusammen (`EXPOSURE_STOPS` in
`export.py`). Der Composer in `HoverOutline.tsx` umgeht das Tonemapping des Renderers, den
Highlight-Roll-off macht `SoftClipEffect` (`lib/garage/softclip.ts`): unter 0,8 bleibt das
Bild exakt Cycles, gemessen. Lichtrig ändern heißt `export.py` ändern und neu exportieren.

Interaktion: Die URL ist die Quelle der Wahrheit für den offenen Hotspot. Klick und Tastatur
schreiben `?view=` per `history.pushState` (`lib/garage/navigate.ts`), `ViewSync.tsx` liest
sie über `useSearchParams` und ruft den Store; der Store schreibt nie die URL. Jeder Hotspot
hat eine unsichtbare, auf 35 cm aufgepolsterte Klickbox (`Hotspot.tsx`), der gerade
fokussierte Hotspot hat keine, sonst fängt sie den "Klick ins Leere" ab.

Screens: `Screen.tsx` legt das DOM auf die Displayfläche, die `lib/garage/screen.ts` aus dem
Mesh im GLB ableitet (dünnste Achse der Bounding-Box, Seite zur View-Kamera). Fiber hört auf
dem Canvas-Wrapper, in den drei das DOM portalt, deshalb stoppt der offene Screen alle
Pointer-Events, sonst zählt ein Klick im Screen als "Klick ins Leere". Geschlossene Screens
sind `inert` ohne Pointer-Events, der Klick trifft die Klickbox dahinter. `occlude` bekommt
nur den GLB-Root, nie die Klickboxen. Neue Screen-View: `ui: "screen"` in `hotspots.ts`
erzwingt einen Eintrag in `components/garage/screens/index.ts`. Die Pinnwand ist ein Screen
auf der Korkfläche (`Pinnwand_Kork`): das DOM ist transparent, Kork und Rahmen kommen aus
dem GLB, `ScreenSpec.shade` dunkelt es im Raum ab, `backdrop` malt der Standbild-Karte den
Kork. Was wo hängt, steht in `lib/garage/pinboard.json`, das `build_furniture.py` für die
Papier-Attrappen im GLB und `Pinboard.tsx` für das DOM lesen; Layout ändern heißt JSON
ändern, Möbel-Skript laufen lassen, exportieren.

Fallback: Das Standbild ist immer der erste Paint. `GarageStill.tsx` zeigt die vom Export
gerenderte Ruheansicht (`public/models/garage-ruhe-tag-{quer,hoch}.webp`, dieselbe Kamera,
dasselbe Material, derselbe Soft-Clip) mit Klickflächen in einem SVG mit `slice`-Fit, die
Rechtecke kommen aus `lib/garage/still.generated.json`. `useGarageMode.ts` entscheidet einen
Frame nach der Hydration einmal für die Lebensdauer der Seite: `prefers-reduced-motion`,
unter 768 px, kein WebGL2, Software-Renderer oder ≤ 2 GB (`lib/garage/capability.ts`) heißt
Standbild, sonst mountet das Canvas darüber, unsichtbar bis zum zweiten gezeichneten Frame.
Ohne Canvas zeigt `StillView.tsx` den offenen Hotspot als Karte, die URL bleibt dieselbe.

2D-Seiten: `app/page.tsx` ist Hero plus Startseiten-Inhalt, die tiefen Seiten liegen in der
Route-Gruppe `app/(seiten)/` (Header oben, Footer im Root-Layout). Projekte sind je eine
Datei in `content/projects/`, die Liste in `index.ts` bestimmt Reihenfolge und Mitgliedschaft,
der erste Eintrag ist das Leitprojekt; `/projekte/[slug]` baut nur diese Slugs
(`dynamicParams = false`). `content/content.test.ts` prüft jeden sichtbaren String auf
Gedankenstriche, Emoji und Whitespace.

Strava: `lib/strava/` ist die ganze Anbindung, Betrieb und Einrichtung in `docs/BETRIEB.md`.
Zustand sind zwei JSON-Dateien in `DATA_DIR` (Token, Cache), die nur `lib/strava/sync.ts`
schreibt; `/api/activity` rechnet die Summary (`summary.ts`) bei jedem Aufruf aus dem Cache und
lässt Privates weg. Die Module importieren einander mit `.ts`-Endung, weil
`scripts/strava.mts` sie direkt unter Node ausführt: keine Parameter-Properties, kein
`enum`, kein `@/`-Alias in `lib/strava/` und `lib/fuelivo/`. Fuelivo: `lib/fuelivo/request.ts`
bildet eine Aktivität auf `CalculationRequest` ab, `client.ts` ruft `fuelivo.de/calculate`;
der Sync rechnet den Plan nur für die neueste sichtbare Einheit (die der Computer zeigt) und
legt ihn unter `plans[id]` in den Cache, ein Plan mit unverändertem Input wird nicht neu
gerechnet, kein Plan ist nie ein Fehler. `tests/e2e/data/activities.json` ist der Fixture-Cache
der E2E-Tests (Playwright setzt `DATA_DIR`); gegen einen eigenen Dev-Server auf 3000 laufen
die Computer-Tests mit dem, was `/api/activity` liefert.

# Kommandos

- Quality Gate vor jedem Push: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
  Grün oder nicht fertig.
- Einzelner Test: `pnpm test -- <pattern>`
- Dev-Server: `pnpm dev`, läuft eventuell schon, erst `.next/dev/lock` prüfen.
- GLB und Hotspot-Koordinaten aus Blender: Skill `blender-export`.

# Regeln

- Paketmanager ist pnpm.
- Neue Dependencies nur nach Rückfrage.
- Ergebnisse gehören in die Antwort, nicht als SUMMARY.md/REPORT.md ins Repo.
- Nach jeder Änderungsserie die Quality Gate laufen lassen und das Ergebnis zeigen.
- Die 2D-Seite ist die Quelle der Wahrheit, die Garage ist ein Layer auf `/`. Jeder Inhalt
  existiert auch in 2D.
- Entscheidungen, die von `docs/KONZEPT.md` abweichen, als ADR nach `docs/adr/`.

# Nicht-Ableitbares

- Koordinaten: KONZEPT und Web-Code sind Y-up (three.js), Blender ist Z-up. Meter, Ursprung auf
  dem Boden in der Raummitte, z zeigt zum Tor. Kamera- und Zielpunkte kommen aus den
  `Cam_*`/`Ziel_*`-Empties über den Export-Skill in `lib/garage/hotspots.generated.json`, das
  handgeschriebene `hotspots.ts` importiert sie und ergänzt nur URL und UI-Typ.
- Trainingsdaten kommen über Strava (offizielle API, Webhook), nicht über Garmin Connect.
  Begründung in `docs/KONZEPT.md` §5.
- Der Fuelivo-Plan wird nicht nachgebaut, sondern beim Sync von `fuelivo.de/calculate`
  geholt und im Cache abgelegt (ein Request pro Einheit). Abbildung Strava auf
  `CalculationRequest` und was der Free-Tarif liefert: `docs/adr/0008`.
- Licht wird in Blender gebacken, im Web gibt es kein Echtzeitlicht. `docs/KONZEPT.md` §5.
- Vorgänger ist Portfolio2-public (`../Portfolio2-public`, live auf yannikwuenker.de). Texte,
  Projektdaten und Integrationen dort sind Quellmaterial zum Neuschreiben, Code und Design
  werden nicht übernommen. `docs/adr/0001`.
- Hosting auf dem eigenen VPS (Docker, Nginx, GHCR), nicht Vercel. Strava-Cache ist eine
  JSON-Datei auf einem Volume. `docs/adr/0002`.
- Nur Deutsch, aber jeder String in `content/` hinter `get<Thing>(locale)`. `docs/adr/0003`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
