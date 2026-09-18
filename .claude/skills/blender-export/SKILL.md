---
name: blender-export
description: Use when a fresh GLB, a fresh lightmap, fresh stills for the static fallback or fresh camera/hotspot coordinates are needed from blender/garage-blockout.blend - after any Blender change, after a light change in export.py, before editing lib/garage/hotspots, lib/garage/still or the scene loader, or when the user says export, GLB, Bake, Lightmap, Standbild or Blockout.
---

# Blender-Export

Baut `blender/garage-blockout.blend` headless zu drei Dateien:

- `public/models/garage.glb`: Collection `Blockout`, Modifier angewendet, zwei UV-Sets:
  `Textur` (TEXCOORD_0, Weltmeter für die kachelnden Fototexturen, die als WebP im GLB
  liegen, Kachelmaß als `KHR_texture_transform`) und `Lightmap` (TEXCOORD_1). Materialien
  mit Farbe oder Textur (das Web macht daraus `MeshBasicMaterial`). Nach Blender läuft
  `scripts/optimize-glb.mts` darüber (Normals weg, Quantisierung, Meshopt), siehe unten.
- `public/models/garage-lightmap-tag.webp`: Tageslicht mit Cycles in das Lightmap-UV-Set
  gebacken (Diffuse direkt + indirekt, ohne Farbe), per Compositor entrauscht. Das Web
  multipliziert es mit Materialfarbe oder Textur (`lib/garage/lightmap.ts`).
- `lib/garage/hotspots.generated.json`: `Cam_*`/`Ziel_*`-Empties als Y-up-Koordinaten.
- `public/models/garage-ruhe-tag-quer.webp` und `-hoch.webp`: die Ruheansicht als Standbild
  für das statische Fallback, 2400x1000 und 1200x2400, so gerendert wie das Web sie zeichnet.
- `lib/garage/still.generated.json`: Größe beider Standbilder und je Hotspot sein Rechteck
  im Querformat (Pixel, Ursprung oben links).

## Ausführen

```
.claude/skills/blender-export/export.sh [out-dir] [--skip-bake]
```

Außerhalb der Bash-Sandbox starten: in der Sandbox crasht Blender bei der Metal-Erkennung
(`blender.crash.txt` mit `metal_is_supported` im Backtrace). `out-dir` ist optional, Default
ist die Repo-Wurzel. Dauer mit Bake etwa 30 s auf der GPU; `--skip-bake` lässt Lightmap und
Standbilder liegen (beides braucht Cycles), die UVs werden trotzdem neu gelegt, die alte
Lightmap passt also nur, wenn sich keine Geometrie geändert hat.

Fertig, wenn die letzte Zeile vor `Blender quit` mit `OK glb=... lightmap=... stills=...
hotspots=...` beginnt, danach `OK optimized glb=... (2626 KB -> 2006 KB)` folgt und die Dateien
existieren. Beide `OK`-Zeilen in der Antwort zeigen. Jede andere Endung (`ERROR`, Traceback)
ist ein Fehlschlag: melden, das Skript nicht umgehen. Ein Crash mit `MTLBinaryArchive` im
Backtrace ist der Metal-Kernel-Cache, einmal wiederholen.

## Was das Skript festlegt

- `--factory-startup`: ein User-Addon (trailprint3d) wirft beim Laden Exceptions.
- Die `.blend` wird nie gespeichert. Alles unten passiert in der Session.
- Nur Collection `Blockout` landet im GLB, Objektnamen bleiben erhalten (`Radcomputer`,
  `Laptop_Display`, ...). Hotspot-Meshes im Web darüber finden, nie über Indizes.
- Flächen, die keine Kamera (`Cam_*`) je von vorn sieht (Wandrückseiten, Deckenoberseite,
  Tischunterseiten), werden gelöscht; 0,5 m Sicherheitsabstand für Parallaxe. Kamerafahrten
  lerpen linear, die Endpunkte reichen. Transparente Objekte behalten alles. Die gelöschten
  Flächen bleiben als `<Name>.Cull`-Objekte außerhalb der Collection im Bake, sonst sind
  die Wände offene Schalen und die Raumecken bekommen eine helle Naht aus Texeln, die in
  den Himmel schauen.
- Zwei UV-Sets in fester Reihenfolge auf jedem Objekt. `Textur` kommt aus
  `garage_lib.box_project_uvs` (Weltmeter, Box-Projektion) und bleibt stehen, Objekte ohne
  Textur bekommen ein leeres. `Lightmap` ist ein UV-Atlas für alles: `smart_project` über
  alle Objekte, Texeldichte nach 3D-Fläche, Inselabstand skaliert mit der Inselgröße (die
  vielen winzigen Fahrradteile sind dunkel, da fällt Bluten nicht auf). Materialien werden
  einseitig, Glas bleibt zweiseitig.
- Texturen (`blender/textures/`, ADR-0006): Farbe und Normal Map hängen am Principled BSDF
  über `UV Map -> Mapping -> Image Texture`, genau die Kette, die der glTF-Exporter als
  `KHR_texture_transform` schreibt. Die Normal Map wirkt nur im Bake (Fugenschatten landen
  in der Lightmap); vor dem GLB-Export kappt das Skript den Normal-Link, ins GLB geht nur
  die Farbe als WebP (`export_image_format="WEBP"`, Qualität `TEXTURE_QUALITY`).
- Lichtrig "Tag" steht in `export.py`: Himmel 1,3 durch Tor und Fenster, Sonne 2,2 von vorn
  links, 40° hoch (3,0 brannte die Backsteinfassade rosa aus). Das Nachtrig kommt in
  Phase 3 als zweites Bild.
- Bake über ein zusammengefügtes Proxy (ein Cycles-Durchlauf statt fünfzig); die Originale
  sind derweil aus dem Render, sonst verschatten deckungsgleiche Flächen den Bake.
- Der Denoiser bekommt Albedo und Normale aus zwei Zusatz-Bakes mit einem Sample. Ohne
  Führung beurteilt Open Image Denoise eine Insel nach ihren Atlas-Nachbarn: eine schwach
  beleuchtete Wandfläche neben einer Sonnenfläche behielt ihr Korn, und jede Änderung am
  Layout verschob das Problem woandershin.
- Belichtung -1,5 Blenden in der Datei (`EXPOSURE_STOPS`), damit Sonnenflächen über 1,0
  nicht clippen; `LIGHTMAP_EXPOSURE_STOPS` in `lib/garage/lightmap.ts` hebt sie im Shader
  wieder an. Beide Werte gehören zusammen.
- Achsen: Blender (x, y, z) wird zu three.js (x, z, -y), identisch zum glTF-Export. Die
  Werte in `docs/KONZEPT.md` §3 sind bereits Y-up.
- `scripts/optimize-glb.mts` (gltf-transform) schreibt das GLB nach Blender in place um:
  Normals raus (das Web beleuchtet nichts), `dedup`, `prune` mit `keepAttributes` (sonst
  fliegt das Lightmap-UV, weil kein Material es benutzt), `weld`, Quantisierung (Position
  14 Bit, Lightmap-UV 16 Bit; das Textur-UV bleibt Float, es liegt in Metern weit außerhalb
  von 0..1), `reorder`, Meshopt. Die Texturen bleiben, wie Blender sie schrieb. 2,6 MB
  werden 2,0 MB, davon 1,8 MB die drei WebP-Texturen; die Lightmap bleibt bei 0,25 MB
  WebP. Kein `join`, kein `flatten`: Objektnamen und Node-Baum sind der Vertrag mit
  `lib/garage/glb.ts`. Die Quantisierung legt einen Maßstab auf die Mesh-Nodes,
  `screenPlaneFor` misst deshalb in Weltmetern. Den Meshopt-Decoder bringt dreis `useGLTF`
  mit. Test: `scripts/optimize-glb.test.ts`.
- Neue Ansicht = neues Paar `Cam_<Name>`/`Ziel_<Name>` in Blender; ein halbes Paar bricht
  den Export ab. Eine neue Kamera ändert auch, welche Flächen gelöscht werden. Außer für
  `Ruhe` muss ein Objekt `<Name>` in `Blockout` existieren: es ist die Klickfläche im
  Standbild, wie in `hotspots.ts` das `mesh` der View.
- Standbilder nach dem GLB-Export, weil sie die Materialien umverdrahten: Emission aus
  Farbe oder Textur mal Lightmap mal `2^1,5`, Glas per Mix mit Transparent, Himmel der
  Bake-Welt,
  Kamera auf `Cam_Ruhe` mit Blick auf `Ziel_Ruhe`, vertikales FOV `REST_FOV_DEG` = 55 wie
  `REST_FOV` im Web, Soft-Clip mit Knie 0,8 im Compositor wie `SoftClipEffect`. Die
  Rechtecke sind die Welt-Boxen der Hotspot-Objekte, auf `MIN_HIT_SIZE_M` = 0,35 m
  aufgepolstert wie in `Hotspot.tsx`, Ecke für Ecke projiziert. Diese vier Konstanten
  stehen doppelt (Python und TypeScript) und gehören zusammen; `still.test.ts` prüft das FOV.
