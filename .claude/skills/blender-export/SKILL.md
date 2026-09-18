---
name: blender-export
description: Use when a fresh GLB, a fresh lightmap or fresh camera/hotspot coordinates are needed from blender/garage-blockout.blend - after any Blender change, after a light change in export.py, before editing lib/garage/hotspots or the scene loader, or when the user says export, GLB, Bake, Lightmap or Blockout.
---

# Blender-Export

Baut `blender/garage-blockout.blend` headless zu drei Dateien:

- `public/models/garage.glb`: Collection `Blockout`, Modifier angewendet, ein UV-Set
  `Lightmap`, Materialien mit Farbe (das Web macht daraus `MeshBasicMaterial`).
- `public/models/garage-lightmap-tag.webp`: Tageslicht mit Cycles in dieses UV-Set gebacken
  (Diffuse direkt + indirekt, ohne Farbe), per Compositor entrauscht. Das Web multipliziert
  es mit der Materialfarbe (`lib/garage/lightmap.ts`).
- `lib/garage/hotspots.generated.json`: `Cam_*`/`Ziel_*`-Empties als Y-up-Koordinaten.

## Ausführen

```
.claude/skills/blender-export/export.sh [out-dir] [--skip-bake]
```

Außerhalb der Bash-Sandbox starten: in der Sandbox crasht Blender bei der Metal-Erkennung
(`blender.crash.txt` mit `metal_is_supported` im Backtrace). `out-dir` ist optional, Default
ist die Repo-Wurzel. Dauer mit Bake etwa 30 s auf der GPU; `--skip-bake` lässt die Lightmap
liegen, die UVs werden trotzdem neu gelegt, die alte Lightmap passt also nur, wenn sich keine
Geometrie geändert hat.

Fertig, wenn die letzte Zeile vor `Blender quit` mit `OK glb=... lightmap=... hotspots=...`
beginnt und die Dateien existieren. Die `OK`-Zeile in der Antwort zeigen. Jede andere Endung
(`ERROR`, Traceback) ist ein Fehlschlag: melden, das Skript nicht umgehen. Ein Crash mit
`MTLBinaryArchive` im Backtrace ist der Metal-Kernel-Cache, einmal wiederholen.

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
- Ein UV-Atlas für alles: `smart_project` über alle Objekte, Texeldichte nach 3D-Fläche,
  Inselabstand skaliert mit der Inselgröße (die vielen winzigen Fahrradteile sind dunkel,
  da fällt Bluten nicht auf). Materialien werden einseitig, Glas bleibt zweiseitig.
- Lichtrig "Tag" steht in `export.py`: Himmel 1,0 durch Tor und Fenster, Sonne 3,0 von vorn
  links, 40° hoch. Das Nachtrig kommt in Phase 3 als zweites Bild.
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
- Keine Draco/KTX2-Kompression, das GLB liegt bei 0,6 MB, die Lightmap bei 0,2 MB WebP.
- Neue Ansicht = neues Paar `Cam_<Name>`/`Ziel_<Name>` in Blender; ein halbes Paar bricht
  den Export ab. Eine neue Kamera ändert auch, welche Flächen gelöscht werden.
