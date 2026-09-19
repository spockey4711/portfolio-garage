# Portfolio-Garage: Umsetzungsplan

Stand: 2026-09-18. Grober Zeitplan, bewusst ohne Gates und Abnahmekriterien. Woche 0 beginnt
heute (Donnerstag). Aufwandsschätzungen aus `docs/KONZEPT.md` §6: 30 h Blender, 40 bis 60 h
Code, neben dem Studium ein bis zwei Monate. Alles Weitere sind Startwerte, die sich beim
Bauen verschieben dürfen.

## Setups: was wann eingerichtet wird

Alle Setups werden generiert, nicht von Hand geschrieben, damit die Versionen vom Tag der
Einrichtung stammen und nicht aus dem Gedächtnis eines Agenten.

| Wann    | Setup                                                                         | Womit                                                                                                                                                            |
| ------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Woche 0 | Next.js-App (App Router, TS strict, Tailwind, ohne `src/`, wie Kuechenzettel) | `pnpm create next-app@latest` mit `--app --ts --tailwind --eslint --no-src-dir --use-pnpm`, in ein Temp-Verzeichnis, dann ins Repo kopiert (Repo ist nicht leer) |
| Woche 0 | Engineering-Gerüst: CI, Dependabot                                            | von Hand, Vorlage ist Kuechenzettel (`.github/`)                                                                                                                 |
| Woche 0 | Toolchain: ESLint, Prettier, Vitest, Playwright, husky + lint-staged          | von Hand, `package.json`-Scripts `lint`, `typecheck`, `test`, `build` als Quality Gate                                                                           |
| Woche 0 | 3D-Stack                                                                      | `pnpm add three @react-three/fiber @react-three/drei zustand`, `-D @types/three`                                                                                 |
| Woche 0 | Blender-Exportpfad                                                            | GLB-Export aus `blender/garage-blockout.blend` nach `public/models/`, noch ohne Kompression                                                                      |
| Woche 1 | Server-Deploy auf den VPS, `develop`-Subdomain als Preview (ADR-0002)         | Dockerfile (`standalone`), Image nach GHCR, Deploy-Workflow per SSH, Nginx-Vhost; Muster ist Portfolio2, neu geschrieben                                         |
| Woche 2 | Kompressionspipeline                                                          | `gltf-transform` (Draco + KTX2) als Script, Ziel < 3 MB                                                                                                          |
| Woche 3 | Strava-App, Webhook, Cache auf Volume                                         | Strava-Developer-Portal, Webhook-Route, JSON auf einem Docker-Volume, Host-Cron als Polling-Fallback, Secrets als Actions-Secrets                                |
| Woche 5 | Spotify "läuft gerade" (Kann)                                                 | Spotify Developer App, Refresh-Token                                                                                                                             |

## Zeitplan

### Woche 0: 18. bis 21.09. - Tag 0 und das Mockup

Ziel: Die Blockout-Garage läuft im Browser, Kamera in Ruheposition mit Parallax. Erster Commit.

- Scaffold wie oben (create-next-app, Toolchain, CI, 3D-Stack).
- GLB-Export des Blockouts, `components/garage/Garage.tsx` mit Canvas, `useGLTF`, Kamera
  bei (0, 1.6, 4.2), FOV 45, Parallax 3 Grad. Startseite zeigt die Garage als Hero, darunter
  Platzhalter für den 2D-Inhalt.
- `lib/garage/hotspots.ts`: die sechs Kamera-Positionen aus KONZEPT §3 als Daten.
- Erster Commit, Branch `develop`.

### Woche 1: 22. bis 28.09. - Bewegung und Hotspots

Ziel: Klicken funktioniert. Man fährt in den Radcomputer und den Laptop und kommt zurück.

- `store.ts` (zustand): idle, focusing, focused, leaving.
- `CameraRig.tsx`: Fahrten 1,0 bis 1,2 s, ease-in-out, Escape und Klick ins Leere zurück.
- `Hotspot.tsx`: Hover-Outline (postprocessing), Label, Tab/Enter.
- URL-Sync `?view=`, Zurück-Button verlässt den Hotspot.
- Screens als `<Html transform occlude>` mit Platzhalter-UI (Radcomputer, Laptop).
- ~~Blender parallel: Raum, Tor, Fenster sauber modellieren, Farbpalette festlegen.~~
  Erledigt 18.09. aus bpy-Skripten (ADR-0004), Backstein und Texturen 18.09. (ADR-0006).
- Deploy auf den VPS, erster Preview auf `garage.yannikwuenker.de` (`docs/BETRIEB.md`).

### Woche 2: 29.09. bis 05.10. - Phase 1 abschließen, online gehen

Ziel: Zeigbar. Raum, Rad, Werkbank, gebackenes Tageslicht, zwei Hotspots, Fallback-Bild.

- ~~Blender: Werkbank, Schrank, Regal, Montageständer. Rad kaufen (Sketchfab, low-poly) und die
  Szene stilistisch daran anpassen.~~ Erledigt 18.09., Rad selbst gebaut (ADR-0004).
- ~~Erster Bake (Tag): AO + Diffuse in einen Atlas, `MeshBasicMaterial` mit Lightmap im Web.~~
  Erledigt 18.09.: Diffuse direkt + indirekt ohne Farbe, WebP, im Export-Skill.
- ~~`gltf-transform`-Pipeline, GLB unter 3 MB, `PerformanceMonitor` senkt DPR.~~
  Erledigt 18.09.: `scripts/optimize-glb.mts` im Export-Skill (Meshopt statt Draco, kein
  KTX2, es gibt keine Texturen), GLB 0,2 MB; DPR-Stufen in `Garage.tsx`.
- ~~Statisches Fallback (WebP mit klickbaren Bereichen) für `prefers-reduced-motion`, unter
  768 px und schwache GPU. Canvas lädt erst nach dem ersten Paint.~~ Erledigt 18.09.: der
  Export rendert die Ruheansicht quer und hoch, Klickflächen aus denselben Boxen wie in 3D.
- ~~2D-Seiten als Gerüst: Startseite-Inhalt, `/projekte/[slug]`, `/ueber`.~~ Erledigt 18.09.:
  Startseite unter dem Hero, drei Projektseiten aus `content/projects/`, `/ueber`.
- ~~Portfolio2 ablösen: Inhalte als Quellmaterial neu schreiben, Rad in die Positionierung
  (ADR-0001).~~ Erledigt 18.09. mit dem 2D-Gerüst.
- Go-live auf `yannikwuenker.de`. Vertagt 18.09., kommt nach Phase 2.
- Atmosphäre: Licht warm und tief, Farben, Kleinkram, Fasen. Befund, Budget und Reihenfolge in
  `docs/ATMOSPHAERE.md`.

### Woche 3 und 4: 06. bis 19.10. - Phase 2, echte Daten

Ziel: Der Radcomputer zeigt echte Trainingsdaten, der Laptop echte Projekte.

- ~~Strava-App registrieren, OAuth einmalig, Webhook-Route, Aktivitäten als JSON auf dem Volume.
  Cron-Polling als Fallback.~~ Erledigt 18.09.: `lib/strava/`, Einrichtung in `docs/BETRIEB.md`.
- ~~`api/activity/route.ts` liest den Cache.~~ Erledigt 18.09., Summary aus letzter Einheit und
  laufender Woche.
- `BikeComputer.tsx`: Edge-Layout, Seite 1 Heute, Seite 2 Woche mit Chart, Seite 3 Über.
  Pfeiltasten wie am Gerät.
- `Laptop.tsx`: Projektliste, Fuelivo-Mini live.
- ~~`Pinboard.tsx`: Startnummern, Fotos, Zettel klickbar, führt zu `/ueber`.~~ Erledigt 18.09.:
  DOM auf der Korkfläche, Layout in `lib/garage/pinboard.json`, Attrappen im GLB darunter.
- 2D-Inhalte füllen: Projekte, Über, erste Blogposts.

### Woche 5 und 6: 20.10. bis 02.11. - Phase 3, Kür

Ziel: Tag/Nacht, restliche Hotspots, Atmosphäre.

- Nacht-Bake, zweite Lightmap, Blend nach Kölner Uhrzeit, Werkbankleuchte emissive.
- Whiteboard (Blogliste in Handschrift-Optik), Werkzeugwand (Hover zeigt Tool/Tech).
- Blender: Helm, Schuhe, Flaschen, Kartons, Katze. Schrank-Inhalt planen (Laufschuhe,
  vielleicht etwas Aufklappbares), noch offen ob eigener Hotspot.
- Radio mit Spotify, Hover-Sounds mit Toggle.

### Ab Woche 7: November - Craft und Politur

- cmd+K Command Palette, `curl yannikwuenker.de` als ASCII, Transparenz-Footer, `j`/`k`,
  Seite "Wie diese Seite gebaut ist" (KONZEPT §10).
- Lighthouse 100 auf dem Fallback, Performance-Feinschliff, Mobile-Fallback nachziehen.
- Nach Feedback: Kamera-Positionen und Fahrten nachjustieren.

## Reihenfolge innerhalb einer Woche

Code und Blender laufen parallel: Blender liefert jede Woche ein neues GLB, der Code läuft
immer gegen den letzten Stand. Nichts im Web wartet auf ein fertiges Modell; das Blockout
bleibt der Platzhalter, bis das echte Objekt kommt.
