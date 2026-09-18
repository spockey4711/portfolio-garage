# ADR-0004: Das Rad wird selbst modelliert, prozedural per bpy

- Status: Akzeptiert
- Datum: 2026-09-18
- Weicht ab von: `docs/KONZEPT.md` §6 ("Die eine Abkürzung, die sich lohnt: das Rad kaufen")
  und §9 (offene Entscheidung)

## Kontext

KONZEPT §6 empfiehlt, das Rad auf Sketchfab zu kaufen und die Szene stilistisch daran
anzupassen, weil es das schwierigste Objekt ist (6 bis 10 Stunden von Hand). Das gekaufte
Modell hätte aber den Stil vorgegeben, wäre irgendein Rennrad gewesen und hätte eine
Lizenz mitgebracht.

Die Detail-Modellierung läuft nicht von Hand im Blender-Viewport, sondern als Python
(`bpy`/`bmesh`) über die MCP-Verbindung: jedes Objekt wird aus Boxen, Zylindern, Tuben und
Ringen mit Maßen in Metern gebaut. Damit ist ein Low-Poly-Rad ein Nachmittag statt einer
Woche, und es ist das eigene Rad.

## Entscheidung

- Das Rad ist ein Cube Agree C:62 Pro 2026 in "blackline" (schwarz auf schwarz), das Rad des
  Autors. Geometrie nach echten Rahmenmaßen (700c, Radstand 1,00, BB-Drop 0,07, Stack 0,56,
  Reach 0,39, Sitzwinkel 73,5°, Steuerwinkel 73°), Aero-Details nur angedeutet: tiefe Felgen,
  abgesenkte Sitzstreben, Cockpit mit flachem Oberlenker, Scheibenbremsen, Di2 ohne Züge.
- Weil das Rad schwarz ist, kommt die Akzentfarbe der Szene nicht vom Rad. Sie sitzt in
  kleinen Dosen an Flasche, Leuchtenkopf, Montageständer-Klemme und Pinnnadeln
  (Material `Akzent`, ein Wert, überall referenziert).
- Alle Objekte der Szene entstehen aus Python-Skripten in `blender/build/` mit Maßen aus
  KONZEPT §2 (`garage_lib.py` Helfer, `build_room.py`, `build_furniture.py`,
  `build_bike.py`). Ein Skript ersetzt seine Objekte per Name in der offenen `.blend`; die
  `.blend` bleibt Quelle der Wahrheit für Kamera, Empties und alles, was nicht aus einem
  Skript kommt. Wer ein Objekt ändert, ändert das Skript und führt es erneut aus, nicht das
  Mesh von Hand, sonst überschreibt der nächste Lauf die Handarbeit.
- Der Radcomputer ist wie der Laptop eine Gruppe: Empty `Radcomputer` mit Kindern
  `Radcomputer_Gehaeuse`, `Radcomputer_Display` (die Displayfläche, auf die `Screen.tsx`
  das DOM legt) und `Radcomputer_Halter`. `hotspots.ts` zeigt mit `display` auf
  `Radcomputer_Display`.

## Konsequenzen

- Keine Lizenzfrage, kein Stilbruch zwischen Rad und Raum, alle Objekte im selben Look.
- Ein Modellierfehler am Rad ist eine Zahl im Skript, nicht eine Stunde Sculpting.
- Materialien kommen ab jetzt mit dem GLB (Principled BSDF, Flat Shading, keine Texturen).
  `Scene.tsx` überschreibt sie nicht mehr; bis zum ersten Bake stehen Platzhalterlichter in
  `Garage.tsx`.
