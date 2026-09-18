<!-- AGENTS.md ist die Quelle der Wahrheit, CLAUDE.md ist ein Symlink hierauf. -->

# Projekt

Portfolio als Fahrrad-Werkstatt-Garage in 3D (R3F), der Radcomputer ist das "OS" und zeigt
echte Trainingsdaten. Konzept mit Szene, Hotspots, Kamera, Stack und Phasen: `docs/KONZEPT.md`,
Maße des Blockouts dort in §2. Zeitplan und Setup-Reihenfolge: `docs/PLAN.md`. Blender-Quelle:
`blender/garage-blockout.blend`.

Stand 2026-09-18: Tag 0 aus `docs/PLAN.md` ist erledigt (Scaffold, Toolchain, CI, 3D-Stack,
Blockout im Browser mit Parallax). Toolchain-Vorlage ist Kuechenzettel, devblueprint kommt
nicht zum Einsatz. Nächster Schritt ist Woche 1 im Plan.

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
