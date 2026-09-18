---
name: blender-export
description: Use when a fresh GLB or fresh camera/hotspot coordinates are needed from blender/garage-blockout.blend - after any Blender change, before editing lib/garage/hotspots or the scene loader, or when the user says export, GLB or Blockout.
---

# Blender-Export

Exportiert `blender/garage-blockout.blend` headless nach `public/models/garage.glb` und die
`Cam_*`/`Ziel_*`-Empties als Y-up-Koordinaten nach `lib/garage/hotspots.generated.json`.

## Ausführen

```
.claude/skills/blender-export/export.sh [out-dir]
```

Außerhalb der Bash-Sandbox starten: in der Sandbox crasht Blender bei der Metal-Erkennung
(`blender.crash.txt` mit `metal_is_supported` im Backtrace). `out-dir` ist optional, Default
ist die Repo-Wurzel.

Fertig, wenn die letzte Zeile vor `Blender quit` mit `OK glb=... hotspots=...` beginnt und
beide Dateien existieren. Die `OK`-Zeile in der Antwort zeigen. Jede andere Endung (`ERROR`,
Traceback) ist ein Fehlschlag: melden, das Skript nicht umgehen.

## Was das Skript festlegt

- `--factory-startup`: ein User-Addon (trailprint3d) wirft beim Laden Exceptions.
- Nur Collection `Blockout` landet im GLB, Objektnamen bleiben erhalten (`Radcomputer`,
  `Laptop_Display`, ...). Hotspot-Meshes im Web darüber finden, nie über Indizes.
- Achsen: Blender (x, y, z) wird zu three.js (x, z, -y), identisch zum glTF-Export. Die
  Werte in `docs/KONZEPT.md` §3 sind bereits Y-up.
- Keine Kompression: Draco/KTX2 kommt ab Woche 2 per `gltf-transform` (`docs/PLAN.md`).
- Neue Ansicht = neues Paar `Cam_<Name>`/`Ziel_<Name>` in Blender; ein halbes Paar bricht
  den Export ab.
