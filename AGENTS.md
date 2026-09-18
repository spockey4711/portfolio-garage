<!-- AGENTS.md ist die Quelle der Wahrheit, CLAUDE.md ist ein Symlink hierauf. -->

# Projekt

Portfolio als Fahrrad-Werkstatt-Garage in 3D (R3F), der Radcomputer ist das "OS" und zeigt
echte Trainingsdaten. Konzept mit Szene, Hotspots, Kamera, Stack und Phasen: `docs/KONZEPT.md`,
Maße des Blockouts dort in §2. Zeitplan und Setup-Reihenfolge: `docs/PLAN.md`. Blender-Quelle:
`blender/garage-blockout.blend`.

Stand 2026-09-18: Tag 0 aus `docs/PLAN.md` ist erledigt (Scaffold, Toolchain, CI, 3D-Stack,
Blockout im Browser mit Parallax). Toolchain-Vorlage ist Kuechenzettel, devblueprint kommt
nicht zum Einsatz. Aus Woche 1 steht der Code: Store, Kamerafahrten, Hotspot-Klick,
`?view=`-Sync, Tastatur, Hover-Outline, Screens als `<Html transform occlude>` mit
Platzhalter-UI, Deploy auf `garage.yannikwuenker.de` (`docs/BETRIEB.md`). Woche 1 komplett:
Szene aus bpy-Skripten in `blender/build/` (ADR-0004). Aus Woche 2 steht der Tag-Bake.

Licht: nichts wird zur Laufzeit beleuchtet. Der Skill `blender-export` backt Tageslicht in
`public/models/garage-lightmap-tag.webp` (Licht ohne Farbe), `Scene.tsx` tauscht jedes
GLB-Material gegen `MeshBasicMaterial` mit dieser Lightmap (`lib/garage/lightmap.ts`). Die
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
erzwingt einen Eintrag in `components/garage/screens/index.ts`.

Fallback: Das Standbild ist immer der erste Paint. `GarageStill.tsx` zeigt die vom Export
gerenderte Ruheansicht (`public/models/garage-ruhe-tag-{quer,hoch}.webp`, dieselbe Kamera,
dasselbe Material, derselbe Soft-Clip) mit Klickflächen in einem SVG mit `slice`-Fit, die
Rechtecke kommen aus `lib/garage/still.generated.json`. `useGarageMode.ts` entscheidet einen
Frame nach der Hydration einmal für die Lebensdauer der Seite: `prefers-reduced-motion`,
unter 768 px, kein WebGL2, Software-Renderer oder ≤ 2 GB (`lib/garage/capability.ts`) heißt
Standbild, sonst mountet das Canvas darüber, unsichtbar bis zum zweiten gezeichneten Frame.
Ohne Canvas zeigt `StillView.tsx` den offenen Hotspot als Karte, die URL bleibt dieselbe.

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
- Licht wird in Blender gebacken, im Web gibt es kein Echtzeitlicht. `docs/KONZEPT.md` §5.
- Vorgänger ist Portfolio2-public (`../Portfolio2-public`, live auf yannikwuenker.de). Texte,
  Projektdaten und Integrationen dort sind Quellmaterial zum Neuschreiben, Code und Design
  werden nicht übernommen. `docs/adr/0001`.
- Hosting auf dem eigenen VPS (Docker, Nginx, GHCR), nicht Vercel. Strava-Cache ist eine
  JSON-Datei auf einem Volume. `docs/adr/0002`.
- Nur Deutsch, aber jeder String in `content/` hinter `get<Thing>(locale)`. `docs/adr/0003`.
