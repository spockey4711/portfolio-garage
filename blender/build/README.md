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
