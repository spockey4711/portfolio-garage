# ADR-0001: Die Garage ist ein eigenständiges Projekt, Portfolio2 nur Materialquelle

- Status: Akzeptiert
- Datum: 2026-09-18
- Weicht ab von: `docs/KONZEPT.md` §9 ("Inhalte und Positionierung übernehmen, ein Repo")

## Kontext

Portfolio2-public (`~/ProgrammierProjekte/aktiv/Portfolio2-public`, GitHub
`spockey4711/Portfolio-public`, älteres privates Original in `pausiert/Portfolio2`) läuft als
v0.4.0 live auf `yannikwuenker.de`: Next.js 16, Pressroom-Design (Big Shoulders + IBM Plex,
oklch-Tokens), One-Pager mit Tiefe unter `/projekte`, `/blog`, `/jetzt`, `/uses`, vollständiges
`/en`, 60+ Unit-Tests, Playwright, Live-Widgets (GitHub, Spotify, WakaTime, Wetter),
Terminal, Command Palette, eigenes Docker-Deploy.

Es hat sich außerdem in ADR-0011 ein Substanz-Gate gegeben: kein neues Playground-Feature,
bevor zwei Projekte mit echter Problem-Ansatz-Ergebnis-Story getragen sind. Die Garage ist
das größte Playground-Feature, das dieses Portfolio je hatte.

Die About-Texte dort nennen Hockey, Laufen und Gym, nirgends Radfahren. Die Garage ist eine
Rad-Werkstatt mit Radcomputer als Kernstück.

## Entscheidung

1. **Eigenständiges Projekt.** Die Garage ist ein neues Repo, das Portfolio2 auf
   `yannikwuenker.de` ablöst. Kein Code wird migriert: jede Zeile wird neu geschrieben oder
   bewusst geprüft übernommen. Kein Design wird übernommen: Farben, Typografie, Layout und
   Komponenten entstehen aus der Garage heraus, nicht aus Pressroom.
2. **Inhalte sind Quellmaterial, nicht Wahrheit.** Projektdaten (`content/projects/`),
   Werdegang, Skills, Uses, Rechtstexte, Blogpost und Case Studies aus Portfolio2 werden
   gelesen, geprüft und neu formuliert. Die Stimme aus
   `Portfolio2-public/docs/content/content-and-voice.md` gilt weiter: erste Person, konkret,
   Belege statt Behauptungen, keine Emojis, nur `-`.
3. **Rad wird Teil der Positionierung.** Radfahren kommt in About, Kicker und Radcomputer
   sichtbar vor, sonst wirkt die Metapher aufgesetzt. Hockey, Laufen, Gym bleiben, das Rad
   kommt dazu.
4. **Substanz-Gate außer Kraft.** ADR-0011 von Portfolio2 gilt hier nicht. Die Garage wird
   gebaut, weil sie die Metapher ist, die das Portfolio trägt; die Projekt-Stories werden
   parallel geschrieben (KONZEPT §5: kein Inhalt existiert nur im 3D).

## Konsequenzen

- Portfolio2-public bleibt als Referenz liegen, bis die Garage live ist, und wird dann
  archiviert. Bis dahin ist es die Nachschlagequelle für Texte, Env-Vars und Integrationen
  (Spotify-Refresh-Token-Flow, GitHub-Heatmap, OG-Bilder, JSON-LD).
- Wiederverwendbare Logik wie die deterministische Fuelivo-Nachbildung
  (`lib/fuelivo/proof.ts`) wird bei Bedarf neu geschrieben, mit den Tests als Spezifikation.
- Offene Bugs und Backlog von Portfolio2 werden nicht übernommen.
