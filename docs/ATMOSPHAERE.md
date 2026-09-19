# Atmosphäre: Wärme, Detail, Budget

Stand 2026-09-18. Befund nach dem ersten Bake mit Fototexturen (ADR-0006): der Raum wirkt
kalt, die Objekte blockartig, der Detailgrad reicht nicht. Dieses Dokument hält fest, wo
das Budget wirklich liegt und in welcher Reihenfolge welche Hebel wirken.

## 1. Wo das Budget wirklich liegt

Gemessen am Export vom 18.09.:

| Datei                      | Größe       | Inhalt                                                    |
| -------------------------- | ----------- | --------------------------------------------------------- |
| `garage.glb`               | 2,74 MB     | 52 Meshes, 10.035 Dreiecke, Geometrie mit Meshopt ~0,3 MB |
| davon Texturen             | 2,45 MB     | Backstein 1,2, Holz 0,73, Steinplatten 0,37, Asphalt 0,14 |
| `garage-lightmap-tag.webp` | 0,3 MB      | 2048², q90                                                |
| `garage-ruhe-tag-*.webp`   | 2 x 0,45 MB | Standbilder                                               |

Geometrie ist praktisch kostenlos: 10 % des Dreiecksbudgets aus KONZEPT §5 verbraucht,
Datei trotzdem fast voll, weil vier Fototexturen 90 % davon sind. Der Detailgrad macht die
Datei nicht groß.

Die 3 MB aus KONZEPT §5 sind eine Richtgröße, keine Grenze. Das GLB lädt nach dem ersten
Paint hinter dem Standbild, ist also nicht LCP-relevant; unter 768 px und auf schwachen
Geräten wird es nie geladen. Es wird nur für Desktop mit ordentlicher Leitung optimiert.

**Neue Richtwerte:** GLB bis 5 bis 6 MB, Lightmap bis 1,5 MB (4096²), Geometrie bis 100k
Dreiecke ohne Nachdenken, bis 200k problemlos (kein Echtzeitlicht, `MeshBasicMaterial`).

Die tatsächlichen Deckel sind andere:

1. **Drawcalls, nicht Dreiecke.** Jedes Mesh ist ein Drawcall. Unter 150 bleiben. Kleinkram
   pro Material joinen (Werkzeugwand ist ein Mesh); Hotspot-Objekte bleiben eigene Meshes
   wegen Outline und Klickbox.
2. **Lightmap-Texel pro Objekt.** Alle Objekte teilen sich eine Karte. Mehr Objekte heißt
   weniger Pixel pro Objekt, die Kontaktschatten werden matschig. Ab da sieht mehr Detail
   schlechter aus, nicht besser. Gegenmittel: `LIGHTMAP_SIZE = 4096` (0,3 → ~1,2 MB) und
   beim UV-Packen große Flächen und Hotspots priorisieren, Kleinkram klein.
3. **Texturen.** Luft schaffen: Holz von 2k auf 1k (die Werkbank ist nie so nah wie die
   Wand), `TEXTURE_QUALITY` 90 → 80 spart etwa ein Drittel. Zusammen ~0,8 MB.

## 2. Warum es kalt wirkt

Cozyness ist zu 70 % Licht und Farbe, zu 30 % Geometrie. Hebel in Wirkreihenfolge:

### Licht (`export.py`, ein Bake, keine Modellierung)

Erledigt 2026-09-18 (PR #14). Die Diagnose vorher war falsch: das Rig `Bake_Tag` (Sonne
2,2 weiß bei 50°, Himmel 1,3) war kühl, aber nicht die Ursache. Kalt war das Bild, weil das
`Review_Licht` der `.blend` (Sonne 6,0 weiß plus 150-W-Fläche) mitgebacken wurde und jeden
Bake dominiert hat. Seither löscht `export.py` diese Lichter vor dem Bake, das Rig steht
dort als Konstanten (`SUN_*`, `SKY_*`, `LAMP_*`): Sonne 4000 K mit 3,0, 25° hoch, 35°
Azimut, Himmel 0,4 kaum blau, Werkbankleuchte 10 W bei 2700 K.

Was daran wirkt, in Reihenfolge:

- Sonne warm und tief: ein langer Sonnenstreifen durchs Tor über den Boden bis zur
  Werkbank. Lange Schatten machen mehr Wärme als jede Farbe.
- Himmel schwach und wenig blau, damit die Schatten nicht kalt sind. Der Backstein macht
  den Rest, weil das Bounce-Licht rötlich wird.
- Werkbankleuchte auch tagsüber an, als Lichtpool auf der Platte. KONZEPT sagt "Emissive
  nachts"; eine brennende Lampe bei Tag ist das Signal "hier arbeitet jemand".

### Farbe der Flächen

Erledigt 2026-09-18. Backstein war warm, der Rest nicht: Steinplatten und Asphalt grau, das
Tor weiß. Regel: kein reines Grau, kein reines Weiß. Die Fototexturen bekommen in
`build_room.py` einen `tint` (Mix-Multiply vor dem BSDF, im GLB `baseColorFactor`, im Web
`color` des `MeshBasicMaterial`, in den Standbildern dieselbe Kette): Steinplatten
`#fae9cb` (Sandstein statt Grau), Asphalt `#ffe9d2` (leicht bräunlich), Werkbankplatte
`#ad9e94` (geölte Eiche statt heller Kiefer). Tor `#e9dfcb` (Creme), Decke und Beton einen
Hauch warm. Die Bilder in `blender/textures/` bleiben, wie sie sind. `Lack_Gruen` bleibt.
Nach dem Bake damit war das Kälteste im Standbild der Himmel hinter der Fassade, ein graues
Blau (Bake-Welt, `SKY_COLOR` mal `SKY_STRENGTH` in `export.py`), kein Material. Seit dem
Bake vom 2026-09-18 ist er Dunst, warmes Grau (0,78/0,74/0,66 bei 0,4), die Schatten
ändern sich dabei nicht sichtbar, weil der Himmel bei 0,4 kaum Fülllicht ist. Der Export
schreibt den Himmel als sRGB nach `still.generated.json`, `SKY_COLOR` in `lightmap.ts`
liest ihn von dort: Canvas-Hintergrund und Standbild sind pixelgleich (gemessen).

### Nachbearbeitung

Erledigt 2026-09-19, aber nicht im Composer: Standbild und Canvas müssen dasselbe Bild
bleiben (das Standbild ist der erste Paint, das Canvas blendet darüber ein), und ein
Composer-Pass hätte einen zweiten Render der Standbilder in `export.py` gebraucht.
Stattdessen liegt `Vignette.tsx` als eine CSS-Ebene mit `mix-blend-mode: multiply` über
beiden: radialer Verlauf, Weiß bis 40 % der Diagonale, in den Ecken `#d8c4ae` (etwa ein
Fünftel dunkler und warm). Gemessen: Mitte unverändert, Ecken in Standbild und Canvas
gleich, kein Render, kein Bake. Stärker soll es nicht werden, der Raum lebt im Schatten.

### Bewohnt statt aufgeräumt

Wenige große Objekte, alle exakt platziert. Es fehlen die 30 kleinen: Kaffeebecher, Lappen,
Öldose, Kette am Haken, Kalender, Steckdosenleiste mit Kabel, Ersatzreifen an der Wand,
Helm, Trikot am Haken, Radio, Sägespäne. Jedes 50 bis 500 Dreiecke, 30 davon sind 10k.
Stoff hilft besonders (Trikot, Handtuch, Kissen), weil weiche Formen den Raum weich machen.

## 3. Warum es blockig wirkt

Nicht zu wenig Polygone, sondern perfekt gerade Kanten und Achsparallelität.

- **Bevel auf alles**, 0,5 bis 2 cm. `garage_lib.box` hat den Parameter. Der Bake fängt
  die Fase als helle Kante ein; im `MeshBasicMaterial` ist das das Einzige, was "kein
  Würfel" sagt.
- **Nichts steht gerade.** Kartons 3° verdreht und schief gestapelt, Werkzeug nicht in Reih
  und Glied, Rad leicht schräg.
- **Kurven statt Quader.** Kabel mit Durchhang, Luftschlauch, Kette, Schaltzüge als
  Bezier-Kurven mit Bevel-Depth. Eine durchhängende Kurve bricht den Kisten-Look mehr als
  10k Dreiecke an der Werkbank.
- **Backstein plastisch.** Die Normalmap geht schon in den Bake. Wenn das nicht reicht:
  echtes Displacement nur zum Backen (Adaptive Subdiv), im GLB bleibt die Wand flach. Mit
  tiefer Sonne bekommen die Fugen echte Schatten.
- **Das Rad ist das Herzstück** und darf allein 20 bis 30k Dreiecke haben: Rohrübergänge,
  Speichen, Sattelrundung, Reifenprofilkante.
- **Staub im Sonnenstrahl.** Volumetrik lässt sich nicht backen, der Klassiker geht billig:
  eine Fläche vom Tor in den Raum mit Alpha-Verlauf, additiv, im Winkel der Sonne.

## 4. Reihenfolge

1. Erledigt: Licht, Sonne warm und tief, Himmel runter, Leuchte an, `Review_Licht` aus
   dem Bake, neu gebacken (PR #14, Werte in `export.py`). Größter Sprung; Streiflicht mit
   Fasen und Schatten erledigt die Hälfte des Blockigen.
2. Erledigt: Farben der Flächenmaterialien und der Himmel, siehe §2.
3. Kleinkram und Kurven.
4. Das Rad.

## 5. Offene Entscheidung

Entschieden 2026-09-18 in ADR-0007: Skripte für Maßhaltiges und Kurven, CC0-Assets für
Stoff und Organisches, vom Skript platziert.

ADR-0004 sagt, alles kommt aus bpy-Skripten. Für Kisten und Regale ist das richtig, für
Trikot, Lappen, Schlauch und organische Formen wird es zäh. Zwei Wege, beide als Nachtrag
zu ADR-0004, kein Bruch:

- CC0-Assets für Deko ohne Maßbezug (Poly Haven hat Werkstatt-Kleinkram), Lizenz in
  `blender/textures/README.md`-Manier dokumentiert.
- Handarbeit in einer eigenen Collection, die kein Skript anfasst.
