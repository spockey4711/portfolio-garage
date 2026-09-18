"""Headless export of blender/garage-blockout.blend, run by export.sh.

Writes <out>/public/models/garage.glb (collection "Blockout", object names kept) and
<out>/lib/garage/hotspots.generated.json (Cam_*/Ziel_* empties of collection "Hotspots",
converted from Blender Z-up to three.js Y-up). <out> is the first argument after "--".
"""

import json
import os
import sys

import bpy

out_root = sys.argv[sys.argv.index("--") + 1]
glb_path = os.path.join(out_root, "public", "models", "garage.glb")
hotspots_path = os.path.join(out_root, "lib", "garage", "hotspots.generated.json")


def to_yup(v):
    """Blender (x, y, z) -> three.js (x, z, -y), the same axis swap the glTF exporter applies."""
    return [round(v.x, 3) + 0.0, round(v.z, 3) + 0.0, round(-v.y, 3) + 0.0]


hotspots = {}
for obj in bpy.data.collections["Hotspots"].objects:
    prefix, _, view = obj.name.partition("_")
    key = {"Cam": "camera", "Ziel": "target"}.get(prefix)
    if key is None:
        sys.exit(f"ERROR unexpected object in Hotspots: {obj.name} (expected Cam_* or Ziel_*)")
    hotspots.setdefault(view.lower(), {})[key] = to_yup(obj.matrix_world.translation)

incomplete = sorted(v for v, d in hotspots.items() if set(d) != {"camera", "target"})
if incomplete:
    sys.exit(f"ERROR views without a Cam_/Ziel_ pair: {incomplete}")

for obj in bpy.data.objects:
    obj.select_set(False)
for obj in bpy.data.collections["Blockout"].all_objects:
    obj.select_set(True)

os.makedirs(os.path.dirname(glb_path), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=glb_path,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_yup=True,
)

os.makedirs(os.path.dirname(hotspots_path), exist_ok=True)
with open(hotspots_path, "w", encoding="utf-8") as f:
    json.dump(hotspots, f, indent=2)
    f.write("\n")

print(
    f"OK glb={glb_path} ({os.path.getsize(glb_path) // 1024} KB) "
    f"hotspots={hotspots_path} ({len(hotspots)} views)"
)
