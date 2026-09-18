# Portfolio-Garage: Konzept

Stand: 2026-09-18. Ergebnis eines Gesprächs über die Frage, was ein Entwickler-Portfolio
einzigartig macht. Dieses Dokument ist der Ausgangspunkt für das Projekt; Entscheidungen, die
davon abweichen, gehören als ADR nach `docs/adr/`.

## 1. Die These

Portfolios, die man sich merkt, haben **eine** Metapher, die die ganze Seite trägt, plus wenige
Craft-Details, die zeigen, dass man es kann. Portfolios mit 15 Gimmicks (Preloader, Custom
Cursor, Parallax, Text-Scramble) sehen alle gleich aus.

Referenzen, die das belegen:

- chanhdai.com: technische Zeichnung als Metapher (Raster, "Fig. 1", Schraffuren, Monospace).
- henryheffernan.com: 3D-Schreibtisch, man zoomt in den Monitor, dort läuft ein funktionaler
  Retro-Desktop. Das 3D ist nur der Rahmen, der Inhalt lebt in einer vertrauten 2D-Oberfläche.
- francescomichelini.com, joonassandell.com: Motion/WebGL als Handschrift, passt nur, wenn es
  der Beruf ist.
- evanyou.me: radikale Reduktion, funktioniert nur mit bekanntem Namen.

Für Yannik: Nische ist Sport (Fuelivo, Hockey-Videoanalyse, GarminDB, MyWhoosh2Garmin,
trainingbuilder). Die Metapher ist eine **Fahrrad-Werkstatt-Garage**, das Henry-Heffernan-Pattern
mit eigener Welt: statt Windows 95 ist der **Radcomputer das "OS"**, und er zeigt echte
Trainingsdaten. Das kann niemand kopieren, weil niemand sonst diese Daten hat.

Was bewusst nicht gemacht wird: ein Retro-Desktop in der Garage (Kopie von Henry), eine frei
begehbare 3D-Welt (Bruno-Simon-Derivat), Animation auf allem.

## 2. Die Szene

Stil: Low-Poly, gebackenes Licht, wenige Farben (Beton, Holz, ein Akzent in Teamfarbe), Flat
Shading. Verzeiht Modellierfehler, wirkt kohärent, 60 fps auf jedem Laptop. Kein Fotorealismus.

Grundriss 6 x 4 m, lichte Höhe 2,80 m (Blockout-Entscheidung, siehe unten). Ursprung auf dem
Boden in der Raummitte, x nach rechts, y nach oben, z zeigt zum Tor (Kamera).

```
 x = -3                 Rückwand (z = -2)                 x = +3
  +--------------------------------------------------------+
  | Werkzeugwand    Whiteboard          Pinnwand   Fenster |
  | [Werkbank == Laptop  Radio Leuchte]         Kartons    |
  |[Schrank]                                    Rollentr.  |
  |                                                        |
  |                Rad auf Montageständer,                 |
  |                Front 30° von der Kamera weg            |
  |                                                        |
  |                                                        |
  +=================== Garagentor, hochgefahren ===========+
                            ^ Kamera (z = +4.2)
```

### Dach und Tor

Das Dach ist geschlossen. "Halb offen" ist das Sektionaltor, nicht das Dach: die Szene lebt
davon, dass Licht nur durch die Toröffnung (und das kleine Fenster) in einen dunklen Kasten
fällt. Ein literal halb offenes Tor (Unterkante bei 1,10 m) geht aber nicht, weil die
Ruhekamera 2,2 m vor dem Tor auf 1,60 m Augenhöhe steht und das Tor dann zwei Drittel des
Bildes verdeckt. Deshalb: Tor zu ca. 80 % hochgefahren, **Unterkante bei 1,85 m**. Das
hängende Segment erscheint als Band am oberen Bildrand (ca. 22 % der Höhe), verdeckt die Decke
komplett und alles an der Rückwand unterhalb von 2,27 m bleibt sichtbar. Falls das Band zu
schwer wirkt: Unterkante 1,95 m ergibt ca. 15 %.

### Maße (Blockout `blender/garage-blockout.blend`, 2026-09-18)

Alle Angaben in Metern, Web-Koordinaten wie oben. Größe als Breite (x) x Höhe (y) x Tiefe (z),
Position ist der Mittelpunkt. In Blender ist Y = -z, Z = y; der glTF-Export mit +Y up bildet
das unverändert zurück.

Hülle:

| Objekt                 | Größe                       | Position                                  | Hinweis                                                                   |
| ---------------------- | --------------------------- | ----------------------------------------- | ------------------------------------------------------------------------- |
| Innenraum              | 6,00 x 2,80 x 4,00          |                                           | Konzept sagte 3,00; echte Garagen 2,3 bis 2,8 m, 3,0 wirkt wie eine Halle |
| Wände, Decke           | 0,24 stark                  | Innenflächen bei x = ±3, z = ±2, y = 2,80 |                                                                           |
| Toröffnung             | 5,00 x 2,25                 | Pfeiler 0,50 an beiden Seiten, Sturz 0,55 | Standard-Doppel-Sektionaltor 5000 x 2250                                  |
| Tor, hängendes Segment | 5,00 x 0,40 x 0,05          | y = 2,05, z = 1,90                        | Unterkante 1,85                                                           |
| Tor, Deckenlauf        | 5,00 x 0,05 x 1,85          | y = 2,55, z = 0,90                        |                                                                           |
| Fenster                | 0,80 x 0,50 in der Rückwand | x = 2,55, Brüstung 1,90, Oberkante 2,40   | zweite Lichtquelle für den Bake                                           |

Rückwand (Fläche z = -2,00):

| Objekt          | Größe                                                        | Position                                    | Hotspot      |
| --------------- | ------------------------------------------------------------ | ------------------------------------------- | ------------ |
| Werkbank        | 2,00 x 0,90 x 0,60                                           | x = -1,90, z = -1,70                        |              |
| Laptop 14"      | Basis 0,32 x 0,02 x 0,22, Display 0,32 x 0,21, 100° geöffnet | x = -1,80, z = -1,50, Displayoberkante 1,12 | Laptop       |
| Radio           | 0,25 x 0,15 x 0,12                                           | (-1,30, 0,975, -1,85) auf der Bank          | Radio        |
| Werkbankleuchte | Klemme (-1,00, 0,90, -1,85), Kopf auf 1,50                   |                                             | Tag/Nacht    |
| Werkzeugwand    | 1,20 x 1,20 x 0,02                                           | x = -2,35, y = 1,60 (1,00 bis 2,20)         | Werkzeugwand |
| Whiteboard      | 1,20 x 0,90 x 0,03                                           | x = 0,40, y = 1,50 (1,05 bis 1,95)          | Whiteboard   |
| Pinnwand (Kork) | 0,90 x 0,60 x 0,03                                           | x = 1,85, y = 1,50 (1,20 bis 1,80)          | Pinnwand     |

Raummitte:

| Objekt         | Größe                                                                          | Position                                                                              |
| -------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Rennrad        | Länge 1,70, Laufräder Ø 0,68 (700c), Radstand 1,00, Lenker 0,42                | Mitte (-0,20, -, 0,30), Reifen 0,20 über dem Boden, Lenkeroberkante 1,05, Sattel 1,15 |
| Ausrichtung    | Front zeigt nach (0,87, 0, -0,50), also 30° von der Kamera weg                 | Begründung unten                                                                      |
| Montageständer | Dreibein r 0,45, Säule Ø 0,04 x 1,10, Klemmarm 0,35                            | Säule bei (-0,55, 0, 0,15), auf der kameraabgewandten Seite                           |
| Radcomputer    | 0,06 x 0,09 x 0,02 (Edge 840), Aero-Halter 0,08 vor dem Lenker, 20° angestellt | (0,30, 1,07, 0,00)                                                                    |

Atmosphäre (von der Ruhekamera sichtbar nur bei z < 1,35 und etwa |x| < 2,4):

| Objekt                       | Größe                            | Position                                        |
| ---------------------------- | -------------------------------- | ----------------------------------------------- |
| Werkstattschrank, linke Wand | 1,00 x 2,00 x 0,50, zwei Türen   | x = -2,75, z = -0,60, direkt neben der Werkbank |
| Rollentrainer                | 0,50 x 0,70 x 0,50               | (2,50, 0, -0,30)                                |
| Zwei Kartons                 | je 0,60 x 0,40 x 0,40, gestapelt | (2,60, 0, -1,20), Katze später obendrauf        |

Das Rad steht mit der Front von der Kamera weg, nicht wie ursprünglich gedacht zur Kamera
hin: ein Radcomputer zeigt zum Fahrer, also nach hinten. Von vor dem Lenker sieht man das
Display fast von der Kante. Aus der Fahrerperspektive über dem Sattel (Kamera unten) ist es
gut lesbar, im Blockout geprüft. Nebeneffekt: Blick von schräg hinten, die Mechanikerperspektive.

Der Schrank ist ein Kandidat für einen späteren Hotspot (Laufschuhe, Kram, vielleicht mal
etwas Aufklappbares wie ein Buch). Noch nicht geplant.

Objekte nach Priorität:

| Prio | Objekt                                                       | Funktion                              |
| ---- | ------------------------------------------------------------ | ------------------------------------- |
| Muss | Raum (Boden, 3 Wände, Tor halb offen, Tageslicht fällt rein) | Bühne                                 |
| Muss | Rad auf Montageständer, Front leicht zur Kamera gedreht      | Blickfang, trägt den Radcomputer      |
| Muss | Radcomputer am Lenker                                        | Hotspot 1, das "OS"                   |
| Muss | Werkbank mit Laptop                                          | Hotspot 2, Projekte                   |
| Muss | Pinnwand mit Startnummern, Fotos, Zettel                     | Hotspot 3, About                      |
| Soll | Whiteboard mit Trainingsplan                                 | Hotspot 4, Blog                       |
| Soll | Werkzeugwand (Schattenbrett)                                 | Hotspot 5, Stack/Uses                 |
| Soll | Werkbankleuchte                                              | Tag/Nacht-Wechsel                     |
| Kann | Radio                                                        | Spotify "läuft gerade"                |
| Kann | Rollentrainer, Helm, Schuhe, Flaschen, Kartons               | Atmosphäre, kein Hotspot              |
| Kann | Katze auf dem Karton                                         | Jede gute Szene braucht ein Lebewesen |

## 3. Hotspots und Kamera

Die Kamera ist nie frei. Eine Ruheposition, pro Hotspot eine Zielposition. Im Idle folgt sie
der Maus um ca. 3 Grad (Parallax). Fahrtdauer 1.0 bis 1.2 s, Easing ease-in-out. Escape oder
Klick ins Leere fährt zurück. Koordinaten sind Startwerte, Feinabstimmung in Blender.

| Hotspot      | Kamera-Position                           | Blick auf                 | UI-Typ                                           | URL               |
| ------------ | ----------------------------------------- | ------------------------- | ------------------------------------------------ | ----------------- |
| Ruhe         | (0, 1.6, 4.2), vertikales FOV 45° (24 mm) | (0, 1.1, 0)               | Hover-Labels                                     | `/`               |
| Radcomputer  | (-0.1, 1.42, 0.25), über dem Sattel       | Display (0.3, 1.07, 0.0)  | DOM in `<Html>`, Edge-UI mit echten Daten        | `/?view=computer` |
| Laptop       | (-1.6, 1.35, 0.6)                         | Display (-1.8, 1.0, -1.5) | DOM in `<Html>`, Projektliste, Fuelivo-Mini live | `/?view=laptop`   |
| Pinnwand     | (1.8, 1.5, 0.3)                           | (1.85, 1.5, -1.9)         | DOM-Overlay, Zettel klickbar                     | `/?view=board`    |
| Whiteboard   | (0.4, 1.5, 0.2)                           | (0.4, 1.5, -1.9)          | DOM-Overlay, Blogliste in Handschrift-Optik      | `/?view=plan`     |
| Werkzeugwand | (-2.3, 1.5, 0.2)                          | (-2.4, 1.6, -1.9)         | Hover auf Werkzeug zeigt Tool/Tech               | `/?view=tools`    |

### Der Radcomputer (wichtigster Screen)

Datenfelder wie auf einem Garmin Edge, Seitenwechsel per Pfeiltasten wie am Gerät:

- Seite 1 "Heute": letzte Einheit, Dauer, km, HF avg, TSS.
- Seite 2 "Woche": Volumen, Chart.
- Seite 3 "Über": ein Feld zeigt "Yannik, Köln, baut Software für Ausdauersportler".

Die UI ist ein normaler React-Baum, keine Textur, damit sie scharf, klickbar und barrierefrei ist.

## 4. Steuerung: Klicken, nicht scrollen

Entscheidung: Hotspots werden angeklickt. Scrollen behält seine native Bedeutung (Seite), der
Mauszeiger bewegt die Kamera nicht, er zeigt nur.

Begründung:

- Eine Garage ist ein Ort, keine Geschichte. Scroll-gesteuerte Kamerafahrten passen zu
  linearem Scrollytelling, in einem Raum fühlen sie sich falsch an (kein Ziel, keine Kontrolle,
  bei manchen Übelkeit). Henry Heffernan und Jesse Zhou machen beide Point-and-Click.
- Klick bedeutet Absicht. Die Kamera weiß, wann sie fertig ist; das passt zu URL (`?view=`),
  Zurück-Button und Tastatur.
- Scroll bleibt frei für die Seite. Die Garage ist der Hero auf `/`, darunter liegt der
  2D-Inhalt. Natives Scrollen wird nie gekapert.
- Pointer-Steuerung (Kamera dreht mit der Maus) ist eine Spielmechanik, kein Web-Pattern:
  unpräzise, nicht auf Touch, verunsichert.

Was der Zeiger trotzdem tut: im Idle ein Parallax von ca. 3 Grad, bei Hover über einem Hotspot
Outline plus Label. Nach 3 Sekunden ohne Interaktion einmalig ein leiser Hinweis am Radcomputer,
damit klar ist, dass die Szene klickbar ist.

| Eingabe           | Idle (Ruheposition)                    | Fokussiert (im Hotspot)                        |
| ----------------- | -------------------------------------- | ---------------------------------------------- |
| Mausbewegung      | Parallax, Hover-Outline                | nichts                                         |
| Klick auf Hotspot | Kamera fährt hin                       | Klick im Screen wird normal verarbeitet        |
| Klick ins Leere   | nichts                                 | zurück zur Ruheposition                        |
| Scroll            | Seite scrollt nach unten zum 2D-Inhalt | scrollt den Screen-Inhalt, Seite bleibt stehen |
| Tab / Enter       | springt durch Hotspots / fokussiert    | Fokus innerhalb des Screens                    |
| Escape            | nichts                                 | zurück                                         |
| Pfeiltasten       | nichts                                 | am Radcomputer: Seitenwechsel wie am Gerät     |

Optionale Deko, kein Steuerungskonzept: Scroll nach oben vom 2D-Inhalt zurück zur Garage fährt
die Kamera sanft von leicht erhöht in die Ruheposition.

## 5. Technischer Aufbau

Grundregel: **Die 2D-Seite ist die Quelle der Wahrheit, die Garage liegt als Layer nur auf `/`.**
Alle tiefen Seiten (`/projekte/fuelivo`, `/blog/...`) sind normale, schnelle 2D-Seiten. Die
Garage verlinkt dorthin. Deep-Links über `?view=` funktionieren, der Zurück-Button verlässt
den Hotspot.

```
app/
  page.tsx                 Startseite: 2D-Inhalt + <Garage /> (dynamic, ssr:false)
  projekte/[slug]/page.tsx 2D
  ueber/page.tsx           2D
  blog/[slug]/page.tsx     2D
  api/activity/route.ts    liest gecachte Trainingsdaten (JSON aus KV/Blob)
  api/cron/sync/route.ts   Vercel Cron oder Strava-Webhook, holt neue Aktivitäten
components/garage/
  Garage.tsx               Canvas, Suspense, Fallback-Logik
  Scene.tsx                GLB laden, Lightmap-Blend Tag/Nacht
  Hotspot.tsx              Mesh + Hover-Outline + Klick -> setView
  CameraRig.tsx            Fahrten, liest view aus URL
  screens/
    BikeComputer.tsx       Edge-UI
    Laptop.tsx             Projekte + Fuelivo-Mini
    Pinboard.tsx
    Whiteboard.tsx
    ToolWall.tsx
lib/garage/
  store.ts                 zustand: idle | focusing | focused | leaving
  hotspots.ts              Positionen, Kamera-Ziele, Routen an einem Ort
public/models/garage.glb   Draco + KTX2, Ziel < 3 MB
```

Stack: Next.js App Router, `@react-three/fiber`, `@react-three/drei` (`useGLTF`, `Html`,
`PerformanceMonitor`, `useProgress`), `@react-three/postprocessing` nur für den Hover-Outline,
`zustand` für die State-Machine, `gltf-transform` zum Komprimieren, Blender 4.x.

### Entscheidungen

- **Licht komplett backen.** In Blender mit Cycles AO + Diffuse in einen Atlas backen, im Web
  `MeshBasicMaterial` mit Lightmap. Kein Echtzeitlicht, deshalb läuft es überall. Tag/Nacht:
  zwei Lightmaps backen und per Uniform blenden, gesteuert von der echten Kölner Uhrzeit. Die
  Werkbankleuchte bekommt ein Emissive, das nachts hochgeht.
- **Screens als DOM, nicht als Textur.** `<Html transform occlude>` legt echtes React auf die
  Display-Fläche. Scharf, selektierbar, Tab-Fokus funktioniert. Textur-Screens sind im Zoom
  immer matschig.
- **Trainingsdaten über Strava, nicht Garmin Connect.** Garmin hat keine offizielle API für
  Privatpersonen (GarminDB nutzt die inoffizielle). Strava hat eine offizielle API mit Webhooks:
  Aktivität landet in Garmin, wird nach Strava gesynct, Webhook trifft die Route, JSON landet in
  Vercel KV. Ruhepuls/HRV später über die GarminDB-Pipeline anflanschen.
- **Fallbacks von Anfang an.** `prefers-reduced-motion`, Viewport unter 768 px oder schwache
  GPU: statt Canvas ein vorgerendertes WebP der Szene mit klickbaren Hotspot-Bereichen. Sieht
  gleich aus, kostet nichts, Lighthouse bleibt bei 100. Das Canvas lädt erst nach dem ersten
  Paint.
- **Budget:** GLB unter 3 MB, Texturen 2k als KTX2, unter 100k Dreiecke, `PerformanceMonitor`
  senkt DPR bei Einbrüchen.

## 6. Blender-Aufwand

Für Grundkenntnisse (Modifier, UVs, Bake bekannt):

| Arbeit                                            | Stunden                         |
| ------------------------------------------------- | ------------------------------- |
| Raum, Tor, Fenster                                | 2                               |
| Werkbank, Regal, Kleinkram                        | 4                               |
| Rad + Montageständer                              | 6 bis 10 (schwierigstes Objekt) |
| Werkzeugwand                                      | 2                               |
| Pinnwand, Whiteboard, Laptop, Radcomputer         | 3                               |
| Atmosphäre (Helm, Flaschen, Kartons, Katze)       | 3                               |
| Materialien, Farbpalette                          | 2                               |
| Lighting, zwei Bakes, Nacharbeit                  | 4                               |
| UVs, Export, Komprimierung, Iteration mit dem Web | 3                               |
| **Summe**                                         | **29 bis 33**                   |

Ohne Blender-Vorkenntnisse 10 bis 20 Stunden Tutorials dazu (Grant Abbitt Low-Poly-Serie),
dann direkt an der eigenen Szene lernen.

**Die eine Abkürzung, die sich lohnt:** das Rad kaufen (Sketchfab, low-poly, 10 bis 30 Euro)
und die Szene stilistisch daran anpassen. Spart die 6 bis 10 schwierigsten Stunden.

Code: Phase 1 und 2 zusammen 40 bis 60 Stunden. Gesamt 80 bis 110 Stunden, ein bis zwei Monate
neben dem Studium.

## 7. Phasen

**Phase 1, zeigbar nach ca. 2 Wochen:** Raum, Rad, Werkbank, gebackenes Tageslicht,
Kamera-Ruheposition mit Parallax, zwei Hotspots (Radcomputer, Laptop) mit Kamerafahrt und
Platzhalter-UI. Statisches Fallback-Bild. Damit online gehen, die 2D-Seite trägt den Inhalt.

**Phase 2:** Radcomputer mit echten Strava-Daten, Laptop mit Projektliste und Fuelivo-Mini,
Pinnwand. URL-Sync und Deep-Links.

**Phase 3:** Nacht-Bake und Tag/Nacht-Blend, Whiteboard, Werkzeugwand, Radio mit Spotify,
Hover-Sounds mit Toggle, Katze.

Nach Phase 1 könnte man aufhören und hätte trotzdem ein besseres Portfolio als die meisten.
Alles danach ist Kür.

## 8. Erster Schritt

Blender-Szene grob blocken (nur Boxen an den richtigen Stellen), als GLB exportieren, in R3F
laden, Kamera-Positionen und Hotspot-Gefühl testen, bevor ein einziges Objekt schön ist. Ein
Nachmittag. Beantwortet die Frage, ob sich die Garage richtig anfühlt.

Stand 2026-09-18: Blender-Hälfte erledigt, `blender/garage-blockout.blend`. Collection
`Blockout` mit allen Objekten aus §2, Collection `Hotspots` mit `Cam_*`/`Ziel_*`-Empties für
alle sechs Ansichten, Kamera in Ruheposition, Workbench-Render mit Objektfarben (F12). Kein
Material, kein Licht, kein Export. Offen: GLB-Export und der R3F-Test.

## 9. Offene Entscheidungen

- Rad kaufen oder selbst modellieren (Empfehlung: kaufen, siehe 6).
- Verhältnis zu Portfolio2 / Portfolio2-public: ersetzt die Garage das Projekt oder wird sie die
  Startseite darin? Portfolio2 hat bereits Positionierung, Scroll-Spine und Boot-Sequenz
  geplant. Vorschlag: Inhalte und Positionierung übernehmen, Boot-Sequenz und Scroll-Spine
  durch die Garage ersetzen, ein Repo.
- Domain: yannikwuenker.de (aus Portfolio2).
- Strava-Webhook vs. Cron-Polling (Empfehlung: Webhook, Polling als Fallback).

## 10. Craft-Features, die unabhängig von der Garage sinnvoll sind

- cmd+K Command Palette (Projekte, Seiten, "Mail kopieren", "CV laden").
- `curl yannikwuenker.de` liefert eine ASCII-Version, `npx yannikwuenker` eine Terminal-Karte.
- Transparenz-Footer: Render-Zeit, Commit, Lighthouse, JS-Größe.
- Keyboard-First: `j`/`k` durch Sections, `?` Shortcut-Overlay.
- Eine Seite "Wie diese Seite gebaut ist".

## 11. Weitere Referenzen

Zum Studieren, jeweils mit dem Grund:

- bruno-simon.com: der Ursprung der begehbaren 3D-Portfolios. Anschauen, um zu verstehen, was
  man nicht kopiert.
- rauno.me: Micro-Interactions auf höchstem Niveau, jede Bewegung hat Bedeutung.
- joshwcomeau.com: Spielfreude und Sound-Design mit Toggle.
- paco.me: cmd+K als Navigation (Autor von cmdk).
- emilkowal.ski: Animationen mit Geschmack, Blog über Motion-Design.
- jhey.dev: CSS-Craft und kleine Spielereien, die trotzdem funktional bleiben.
- leerob.com: das "Now"-Prinzip, Guestbook, alles datengetrieben statt von Hand gepflegt.
- brittanychiang.com: das saubere Standard-Portfolio, an dem man den Unterschied zur Garage
  misst.
- Für den Radcomputer: echte Garmin-Edge-UI (Datenfelder, Seitenwechsel) als Vorlage, nicht
  irgendein Dashboard.
