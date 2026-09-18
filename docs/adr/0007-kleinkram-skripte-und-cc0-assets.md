# ADR-0007: Kleinkram aus Skripten, Stoff und Organisches als CC0-Assets

- Status: Akzeptiert
- Datum: 2026-09-18
- Ergänzt: ADR-0004 (alles aus bpy-Skripten), offen gelassen in `docs/ATMOSPHAERE.md` §5

## Kontext

ADR-0004 legt fest, dass jedes Objekt der Szene aus einem Python-Skript in `blender/build/`
kommt. Für Raum, Möbel und Rad hat sich das bewährt: alles ist maßhaltig, jede Korrektur
ist eine Zahl. `docs/ATMOSPHAERE.md` §3 will die Garage jetzt bewohnt machen, mit
Kisten, Öldose, Steckdosenleiste, Kabeln, Trikot, Lappen, Handtuch. Kisten und Dosen sind
Boxen und Zylinder, Kabel sind Bezier-Kurven mit Bevel, das bleibt Skriptarbeit. Ein
Trikot am Haken oder ein Lappen auf der Werkbank ist dagegen Cloth-Simulation oder
Sculpting; aus Primitiven wird das eine Stunde je Stück und sieht danach nach Primitiven
aus. Poly Haven bietet solchen Werkstatt-Kleinkram als CC0-Modelle an, so wie die
Fototexturen schon von ambientCG kommen (ADR-0006).

## Entscheidung

- Alles mit Maßbezug oder aus Grundformen und Kurven bleibt Skript: Kisten, Dosen,
  Flaschen, Steckdosenleiste, Kabel, Schläuche, Regalinhalt.
- Stoff und organische Deko ohne Maßbezug (Trikot, Lappen, Handtuch, Handschuhe, Pflanze)
  kommen als CC0-Modelle von Poly Haven oder vergleichbaren Quellen. Sie liegen als
  `.blend` oder `.glb` in `blender/assets/<name>/` mit einer `README.md` wie
  `blender/textures/README.md`: Quelle, Lizenz, Änderung an der Datei.
- Auch ein Asset wird vom Skript platziert, nicht von Hand: das Skript hängt es per Name
  an (`bpy.data.libraries.load` oder glTF-Import), setzt Position, Rotation, Maßstab und
  Material und ersetzt beim nächsten Lauf sein altes Objekt, genau wie bei allen anderen
  Objekten. Die Regel aus ADR-0004 bleibt: Wer ein Objekt ändert, ändert das Skript.
- Ein Asset wird auf den Stil der Szene gezogen, nicht umgekehrt: Flächenfarbe aus der
  Palette oder ein `tint`, Polygone auf die Größenordnung der Möbel reduziert, eigene
  Texturen nur, wenn sie wie die Fototexturen kacheln oder klein sind (das GLB wiegt
  2,7 MB, `docs/ATMOSPHAERE.md` §1).

## Konsequenzen

- Handarbeit im Viewport bleibt ausgeschlossen, auch für Deko. Jeder Bake ist aus
  Skripten plus versionierten Asset-Dateien reproduzierbar.
- Ein Asset bringt seine eigenen UVs mit. Der Export legt das `Textur`-Set per
  Box-Projektion neu (`garage_lib.box_project_uvs`); für ein texturiertes Asset muss das
  Skript diese UVs als `Textur` behalten, das ist beim ersten solchen Asset zu lösen.
- Lizenz ist CC0 wie bei den Texturen, keine Namensnennung nötig, dokumentiert in der
  README des Assets. Andere Lizenzen kommen nicht ins Repo.
