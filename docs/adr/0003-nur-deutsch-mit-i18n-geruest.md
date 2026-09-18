# ADR-0003: Nur Deutsch, aber i18n-fähig gebaut

- Status: Akzeptiert
- Datum: 2026-09-18
- Ergänzt: `docs/KONZEPT.md` (sagt nichts zur Sprache)

## Kontext

Portfolio2 hat ein vollständiges `/en` mit Routen-Mapping (`/projekte` zu `/en/projects`),
Overlay-Übersetzungen für Projekte und Copy und doppelten Playwright-Specs. Die englische
Fassung kostet dauerhaft doppelte Pflege; Portfolio2 hat sie selbst auf die stabile Fläche
beschränkt. Die Garage startet mit neuen Texten und neuen Screens (Radcomputer, Laptop), deren
Wortlaut sich noch bewegt.

## Entscheidung

Die Seite erscheint nur auf Deutsch (`lang="de"`, keine `/en`-Routen, kein Sprachwechsler).
Das Gerüst ist von Anfang an locale-fähig, damit Englisch später eine Ergänzung ist und kein
Umbau:

- Jeder sichtbare String lebt in `content/`, nie als Literal in einer Komponente. Auch die
  Labels in den 3D-Screens (Radcomputer-Datenfelder, Hover-Labels der Hotspots).
- Ein `Locale`-Typ mit `"de"` als einzigem Mitglied und `defaultLocale`; Content-Module
  exportieren `get<Thing>(locale)`, auch wenn es nur eine Locale gibt.
- Zahlen und Daten formatiert `Intl` mit der Locale-Konstante, nie handgebaut.
- Ohne Locale-Segment in den URLs. Das Routen-Mapping kommt erst mit der zweiten Sprache und
  wird dann als eigenes ADR entschieden (Prefix `/en` wie Portfolio2 oder Subdomain).

## Konsequenzen

- Keine Übersetzungsdateien, keine i18n-Library, keine doppelten Tests.
- Wenn Englisch kommt: `Locale` erweitern, `content/*/en.ts` anlegen, Routing-ADR schreiben.
  Komponenten bleiben unverändert.
