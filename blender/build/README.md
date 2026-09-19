# Szene aus Skripten

Die Objekte der Garage entstehen aus diesen Skripten (ADR-0004). Jedes Skript baut seine
Objekte in Metern aus `docs/KONZEPT.md` §2 und ersetzt sie per Objektname in der offenen
`garage-blockout.blend`; Hotspot-Empties, Kamera und Collections bleiben unberührt.

Ausführen in Blender (Text-Editor oder MCP `execute_blender_code`), Reihenfolge Raum,
Möbel, Rad:

```python
LIB = "/abs/pfad/zu/blender/build/garage_lib.py"
exec(open("/abs/pfad/zu/blender/build/build_room.py").read())
```

Die Texturen in `blender/textures/` referenziert die `.blend` relativ, sie muss also aus
diesem Repo geöffnet sein, wenn die Skripte laufen. Danach speichern und den Skill
`blender-export` laufen lassen. Ein Objekt ändern heißt:
Skript ändern, erneut ausführen. Handarbeit am Mesh überlebt den nächsten Lauf nicht.

Headless geht es auch, ein Skript pro Lauf, aus dem Repo-Pfad der `.blend`:

```
/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup blender/garage-blockout.blend \
  --python-expr 'LIB="<abs>/blender/build/garage_lib.py"; exec(open("<abs>/blender/build/build_furniture.py").read()); import bpy; bpy.ops.wm.save_mainfile()'
```

Die Pinnwand liest `lib/garage/pinboard.json` (Korkfläche und was wo hängt), dasselbe
Layout, auf das `components/garage/screens/Pinboard.tsx` sein DOM legt. Das Möbel-Skript
baut daraus die Papier-Attrappen mit Pin, damit Standbild und Fernsicht die gefüllte Wand
zeigen. Genauso die Werkzeugwand mit `lib/garage/tools.json`: je Eintrag ein Werkzeug aus
ein paar Primitiven (`SHAPES` im Möbel-Skript), Haken und gemalte Silhouette, dasselbe
Layout, auf das `ToolWall.tsx` Etiketten und Hover-Flächen legt. Eine neue Form braucht
einen Builder in `SHAPES` und den Namen in `TOOL_SHAPES` (`lib/garage/tools.ts`).
