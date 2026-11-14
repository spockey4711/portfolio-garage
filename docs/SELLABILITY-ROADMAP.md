# Verkaufbarkeit und MVP: Vorschlag

**Status: Vorschlag, nicht entschieden, nicht umgesetzt.** Kein Paket unten ist freigegeben.
Jedes trägt `awaiting_approval`. Diese Datei ändert kein Produktverhalten und entscheidet
keinen Domain-Konflikt.

Grundlage ist der Code und die Doku in diesem Repo zum Commit
`11f231007b8669de42e83d462b7e5785705f996f`, plus der gelesene Anhang
`github-context.json` (nur Dependabot-PRs). Keine Live-Messung, kein Shop-Test, keine
erfundenen Kunden, Umsätze oder Zahlungsbereitschaften.

## Zuerst die Art des Projekts

Das ist ein persönliches Portfolio, keine eigenständige App mit Kundenkonten.

Belegt: `docs/KONZEPT.md` §1 (eine Metapher, damit man sich die Seite merkt), ADR-0001
(eigenständiges Repo, das Portfolio2 auf `yannikwuenker.de` ablösen soll, Zeitpunkt offen),
`content/legal.ts` ("Diese Website ist ein privates Portfolio", Trainingsdaten sind die
eigenen). Der Nutzen, den die Doku selbst nennt, ist Sichtbarkeit der Arbeit und der
Projekte, nicht ein Abo auf der Garage.

Fuelivo ist ein anderes Produkt. `content/projects/fuelivo.ts` beschreibt fuelivo.de, Web
und iOS, und nennt Stripe und StoreKit als Teil dieser Projektgeschichte. Dieses Repo ruft
`fuelivo.de/calculate` nur beim Sync auf (`docs/BETRIEB.md`, ADR-0008) und zeigt das
Ergebnis. Es verkauft Fuelivo nicht und darf hier keinen zweiten Shop bekommen.

Ein SaaS aus der Garage (Baukasten, Multi-Tenant, Abo) ist keine belegte Anforderung. Er
wird unten nicht als Paket vorgeschlagen.

Offene Einträge im Anhang sind nur die Dependabot-PRs `#37`, `#39`, `#44`, `#49`, `#50`,
`#51`. Kein Produkt-Issue. Die Pakete legen deshalb keine Nummer an und duplizieren diese
PRs nicht. Der Hockey-Mac-Build liegt nicht in diesem Repo. `docs/KONZEPT.md` §1 nennt
Hockey-Videoanalyse nur als Nische. Ein solcher Build bräuchte macOS und wurde hier nicht
ausgeführt und nicht als vorhanden behauptet. Der Blender-Export dieses Repos verlangt
ebenfalls macOS (`/Applications/Blender.app`, `README.md`) und wurde nicht gestartet.

## 1. Anforderung, Flow, Lücke

| Belegte Anforderung | Vorhandener Flow | Echte Lücke | Beleg |
| --- | --- | --- | --- |
| Hotspots anklicken, URL ist die Wahrheit, Escape und Zurück verlassen | `?view=` für `computer`, `laptop`, `blog`, `about`, `tools`, Fahrt im Store, E2E prüft die URL, nicht die Kamerapixel | Keine Lücke im Vertrag der fünf Screens. Der GPU-Kamerapfad bleibt manuell. | `lib/garage/hotspots.ts`, `tests/e2e/hotspots.spec.ts` |
| Unter 768 px, Reduced Motion oder schwachem WebGL ein Standbild mit denselben Views | `useGarageMode` entscheidet einmal, Karten statt Canvas | Der Fallback ist gebaut. "Lighthouse 100" ist ungemessen. | `lib/garage/capability.ts`, `components/garage/GarageHero.tsx`, `docs/KONZEPT.md` §5, `docs/PLAN.md` |
| Radcomputer zeigt Fuelivo auf der letzten eigenen Strava-Einheit, Seite bleibt ohne Keys bedienbar | Öffentliche Route liest nur den Cache. Sync rechnet den Plan. Leerzustand ist "Keine Einheit" / "Plan folgt". | Ob die Preview Token, Webhook und eine sichtbare Einheit hat, steht nicht im Repo. Ein leeres Volume ist kein Build-Fehler. | `app/api/activity/route.ts`, `lib/strava/env.ts`, `compose.yaml`, `docs/BETRIEB.md` |
| Nach 3 s ohne Interaktion einmalig ein Hinweis am Radcomputer | Statuszeile zeigt den allgemeinen Satz sofort, sobald die Szene bereit ist, und blendet ihn nach dem ersten Hotspot aus | Abweichung ohne ADR. Weder Konzept noch Ist-Verhalten ist festgeschrieben. | `docs/KONZEPT.md` §4, `components/garage/GarageStatus.tsx`, `content/garage.ts` |
| 2D-Seite ist die Quelle, Garage nur Layer auf `/` | Projekte, Blog, Über, Bauweise, Impressum, Datenschutz existieren neben den Screens | Keine Lücke für "Inhalt nur in 3D". Zwei Blogposts, keine Entwurfs-Flagge. | `app/(seiten)/`, `content/blog/index.ts`, `AGENTS.md` |
| Zeigbar auf der Apex-Domain, Preview bleibt die Subdomain | Deploy-Job nur `develop` nach `garage.yannikwuenker.de:3010`. Nginx-Vorlage nur für die Subdomain. | Apex ist nicht verdrahtet. ADR-0001 und `docs/PLAN.md` widersprechen sich im Zeitpunkt. **Nicht entschieden.** | ADR-0001, `docs/PLAN.md`, `docs/BETRIEB.md`, `.github/workflows/ci.yml` |
| Tag/Nacht nach Kölner Uhr, zwei Lightmaps | Eine Tag-Karte, kein Blend, kein nächtliches Emissive | Konzept-Soll, im Code nicht da. Nicht Teil dieses Abschlusses. | `lib/garage/lightmap.ts`, `docs/KONZEPT.md` §5 und §7 |
| `curl` liefert die Textkarte, `npx yannikwuenker` dieselbe Karte | `proxy.ts` schreibt Terminal-Clients auf `/ascii` um | Das npm-Paket fehlt. Die Kartenlogik liegt schon in `lib/terminal/card.ts`. | `docs/PLAN.md`, `docs/KONZEPT.md` §10 |

Spotify, Hover-Sound, Katze, Stoff und Staub sind in Konzept und Plan Kann oder Phase 3,
kein MVP-Beleg. Sie werden nicht zu Paketen gemacht.

## 2. Nächste Pakete

Maximal fünf. Keines ist hier umgesetzt.

### Paket 1: Hinweis festziehen

- Problem: Der einzige Onboarding-Satz weicht vom Konzept ab. Besucher bekommen sofort einen
  allgemeinen Hinweis, nicht nach 3 s am Radcomputer.
- Beleg: Tabelle oben.
- Akzeptanz: Entweder ein Test, der genau die Konzeptregel prüft (einmalig, verzögert, an
  den Radcomputer gebunden, in derselben Sitzung nicht wieder), oder ein ADR, das die
  jetzige Statuszeile festschreibt, plus ein Test auf genau diese Regel. Kein zweiter
  Hinweis nach dem ersten Besuch in derselben Sitzung.
- Aufwand: S
- Abhängigkeiten: keine
- Status: `awaiting_approval`

### Paket 2: Sichtbare Einheit auf der Preview belegen

- Problem: Phase 2 verspricht echte Trainingsdaten. Der Code kann das. Ob
  `garage.yannikwuenker.de` sie zeigt, ist unbelegt. Ein Cutover mit leerem Volume zeigt
  einen leeren Radcomputer.
- Beleg: `docs/BETRIEB.md` beschreibt die Einrichtung als Prosa. `GET /api/activity` liest
  eine Datei.
- Akzeptanz: Öffentliches JSON der Preview enthält eine Einheit mit Plan, oder der
  dokumentierte Leerzustand ist mit Datum in `docs/BETRIEB.md` festgehalten. Ein
  Sync-Fehler erscheint im Container-Log und nicht als 500 auf `/`. Seitenanfragen rufen
  `fuelivo.de` nicht auf. Keine Secrets in der Doku.
- Aufwand: S, wenn der Cache schon da ist nur ein Protokoll
- Abhängigkeiten: SSH und die Server-`.env`. Nicht aus diesem Worktree heraus ausführbar.
- Status: `awaiting_approval`

### Paket 3: Fallback-Budget messen

- Problem: "Lighthouse 100" ist ein Ziel, kein Messwert. Der Fallback ist der LCP-Pfad.
- Beleg: `docs/PLAN.md`, `docs/KONZEPT.md` §5, `components/garage/GarageHero.tsx`.
- Akzeptanz: Eine Messung mobil (390 px) und mit Reduced Motion gegen den Still-Pfad. Das
  Budget setzt Yannik, 100 ist nur die bisherige Hypothese. Unter 768 px und bei Reduced
  Motion enthält das Netzwerk keinen `three`-Chunk und kein `garage.glb`. Kein neues
  Footer-Feld (`docs/PLAN.md` nimmt Render-Zeit und Lighthouse dort bewusst heraus).
- Aufwand: M
- Abhängigkeiten: eine Budget-Zahl. Sinnvoll auf dem Stand, der gezeigt werden soll, nicht
  auf einem geratenen Score.
- Status: `awaiting_approval`

### Paket 4: Tag/Nacht nur nach Entscheidung

- Problem: Einziger offener Soll-Effekt aus dem Konzept, den der Plan als Kür nach Phase 2
  führt. Eine Lightmap, Lampe im Bake immer an.
- Beleg: `lib/garage/lightmap.ts`, `docs/KONZEPT.md` §5 und §7, `docs/PLAN.md`.
- Akzeptanz, falls es überhaupt v1 sein soll: Zur dokumentierten Nachtzeit unterscheidet
  sich die Lightmap-URL oder der Blend-Faktor vom Tag. Still und Canvas bleiben für
  denselben Zustand gleich. Reduced Motion blendet nicht. Export nur auf der Maschine mit
  Blender.app. Hier nicht vorgetäuscht.
- Aufwand: L
- Abhängigkeiten: Entscheidung, ob das v1 ist. Ohne die Entscheidung nicht bauen.
- Status: `awaiting_approval`

### Paket 5: `npx yannikwuenker` oder Streichung

- Problem: Konzept und Plan versprechen ein zweites Paket. In diesem Repo gibt es keins.
- Beleg: `docs/KONZEPT.md` §10, `docs/PLAN.md`. Die Karte liegt in `lib/terminal/card.ts`
  und `app/ascii/route.ts`.
- Akzeptanz: `npx yannikwuenker` zeigt Name, Projekte und Blog-Links aus derselben Karte,
  oder die genannten Stellen führen es nicht mehr als offen. Kein zweiter Inhaltspfad.
- Aufwand: S, wenn nur Doku oder ein dünner Wrapper. M, wenn eigenes Paket mit CI.
- Abhängigkeiten: npm-Publish-Recht, falls wirklich veröffentlicht. Kein Blocker für die
  anderen Pakete.
- Status: `awaiting_approval`

Nicht als Paket, weil nicht zu entscheiden: ob `yannikwuenker.de` jetzt die Garage zeigt
oder Portfolio2 bleibt. ADR-0001 und `docs/PLAN.md` widersprechen sich im Timing. Ein
Wechsel wäre Domain, DNS und ein zweites Deploy-Environment. Das ist hier ausdrücklich
nicht freigegeben.

## 3. Hypothesen, keine Befunde

Zielgruppe, Hypothese: Leute, die Yannik für ein Projekt ansprechen könnten, plus Menschen
aus dem eigenen Sportumfeld, die den Radcomputer als Beleg lesen. Nicht belegt durch
Anfragen, Analytics oder Gespräche in diesem Repo. `content/legal.ts` sagt, die Seite hat
keine Analytics.

Kernproblem, Hypothese: Ein austauschbares Entwickler-Portfolio wird nicht erinnert.
`docs/KONZEPT.md` §1 formuliert das als These, nicht als gemessene Lücke bei Auftraggebern.

Möglicher Nutzen, Hypothese: Die Garage macht Projekte, Blog und die eigene letzte Einheit
in einer Metapher auffindbar, die 2D-Seiten bleiben die inhaltliche Quelle. Ob das mehr
Gespräche erzeugt als Portfolio2, ist nicht gemessen.

Monetarisierung, Hypothese und nur das:

- Für dieses Repo plausibel ist Kundengewinnung, also ein Auftrag an Yannik, nicht ein
  Preis auf der Seite. Kein Beleg, dass das schon passiert oder passieren wird.
- Fuelivo hat laut `content/projects/fuelivo.ts` bereits eigene Zahlwege (Stripe,
  StoreKit). Das ist Portfolio-Text aus der Projektgeschichte, hier nicht gegen den Shop
  geprüft und keine Umsatzzahl. Dieses Repo soll daran nichts verdienen.
- Eine lizenzierbare Garagen-Vorlage oder ein Abo hätte keine belegte Nachfrage. Nicht
  bauen, um ein Produkt zu erfinden.

## 4. Kleinster Test mit echten Menschen, ohne Zahlung

Kein Payment, kein neues Tracking, kein Konto.

Yannik zeigt die Preview `https://garage.yannikwuenker.de` (oder, wenn die nicht erreichbar
ist, einen lokalen Stand) drei bis fünf Menschen, die er schon kennt und die zur Hypothese
oben passen. Eine Frage, ohne Führung: Findest du ein Projekt und, falls eine Einheit im
Cache liegt, die letzte Fahrt, ohne dass ich dir die Hotspots erkläre? Notiz je Person:
ja/nein, wo sie hängen geblieben ist, ob der Hinweis geholfen hat. Fertig, wenn die Notizen
existieren. Das ist kein Beweis für Zahlungsbereitschaft und kein Signifikanztest.

Die Seite darf dafür kein Analytics-Skript bekommen. `content/legal.ts` schließt Cookies,
Storage, Analytics und Error-Tracking aus. Eine Umami- oder ähnliche Einbindung wäre eine
neue Verarbeitung und ein anderes Paket.

## 5. Daten, Datenschutz, Betrieb

- Trainingsdaten sind Yanniks eigene, über die Strava-API, private Einheiten bleiben außen
  vor (`content/legal.ts`, ADR-0008). Der Browser ruft Strava und fuelivo.de nicht auf.
- Token und Cache liegen in `DATA_DIR`, auf dem Server im Volume, nicht im Git. Secrets
  dürfen nicht in Doku oder Logs dieses Vorschlags.
- Hosting ist der eigene VPS (ADR-0002, Contabo in `content/legal.ts`). Server-Logs sind
  die Verarbeitung des Hosters. Kein zusätzlicher Auftragsverarbeiter für die Garage selbst.
- Würde man später fremde Trainingsdaten verarbeiten, wäre das ein neuer Zweck, eine neue
  Rechtsgrundlage und ein anderer Text in `content/legal.ts`. Das ist eine Hürde gegen
  einen Multi-User-Rechner, kein Auftrag, einen zu bauen.
- Betriebshürden, belegt und offen: Deploy nur `develop`, Apex nicht verdrahtet, leeres
  Volume ist bedienbar aber inhaltsleer, Webhook-URL in der Doku zeigt auf die Preview,
  Cron auf dem Host ist aus dem Repo nicht belegt. Die offenen Dependabot-PRs, darunter
  die three-Gruppe (`#39`), sind kein Produktpaket. Der Anhang zeigt für diese Gruppe
  fehlgeschlagene Checks (Runs `42192940436` und `43398928262`). Ursache nicht neu
  gelesen. Nicht blind mergen.
- Domain-Konflikt zwischen Garage und Portfolio2: nicht entschieden, siehe oben.
