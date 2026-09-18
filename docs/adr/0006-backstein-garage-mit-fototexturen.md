# ADR-0006: Backsteingarage mit Fototexturen statt Flat Shading

- Status: Akzeptiert
- Datum: 2026-09-18
- Weicht ab von: `docs/KONZEPT.md` §2 ("Stil: Low-Poly, wenige Farben, Flat Shading") und
  §5 ("Texturen 2k als KTX2")

## Kontext

Die Garage aus Flächenfarben (Putz, Betonplatten, weißes Tor) wirkte wie ein moderner
Neubau. Gewünscht ist eine freistehende Garage aus rotem Backstein mit weißem Tor und
Asphaltboden, innen eine Werkstatt mit Holzplatte, dunkelgrünen Schränken und Backstein
hinter dem Werkzeug. Backstein ist mit Flächenfarben nicht darstellbar, die Szene hatte
bis dahin keine einzige Textur, und die ganze Pipeline (Build-Skripte, Export, Optimierung,
Web-Material) war darauf gebaut.

## Entscheidung

- Wände innen und außen, Boden, Vorplatz und die Werkbankplatte bekommen kachelnde
  Fototexturen: `Bricks059`, `Tiles038` (glatte Steinplatten innen), `Asphalt033` (Vorplatz)
  und `Wood092` von ambientCG (CC0), als Farbe 2k (Asphalt 1k, entsättigt) und Normal Map 1k
  in `blender/textures/`. Eine Betonschwelle trennt Platten und Asphalt an der Torlinie.
  Alles andere bleibt Flächenfarbe, die Geometrie bleibt Low-Poly. Schränke und
  Schubladenfront werden `Lack_Gruen`, die Sockelleiste und die Bodenfugen entfallen, das
  Tor bekommt acht Kassetten auf dem Außensegment, neben dem Tor hängen zwei Außenleuchten.
- Das Rad rückt 0,6 m nach vorn auf z = 0,9, von der Ruhekamera aus stand alles zu tief im
  Raum. Die Radcomputer-Empties und der Montageständer folgen ihm aus `build_bike.py`.
- UVs in Weltmetern: `garage_lib.box_project_uvs` projiziert jede Fläche über ihre
  dominante Normale, das Material skaliert mit dem physischen Kachelmaß, das ambientCG
  angibt (Backstein 1,05 m, Steinplatten 1,8 m, Asphalt 2,5 m, Holz 0,8 m). Ein Ziegel ist damit überall gleich
  groß und läuft über Objektkanten durch. Das GLB hat zwei UV-Sets, `Textur` (TEXCOORD_0)
  und `Lightmap` (TEXCOORD_1), auf jedem Objekt in dieser Reihenfolge.
- Die Lightmap bleibt Licht ohne Farbe. Das Web rechnet Textur mal Lightmap
  (`MeshBasicMaterial` mit `map` und `lightMap`), der Bake sieht zusätzlich die Normal Map,
  so landen die Fugenschatten in der Lightmap, ohne dass das Web Normalen braucht.
- Texturen reisen als WebP im GLB (`EXT_texture_webp`, Blender-Exporter, Qualität 90), nicht
  als KTX2. KTX2 spart nur Grafikspeicher (etwa 20 MB gegen 85 MB bei drei 2k-Texturen mit
  Mipmaps), kostet aber den `ktx`-Encoder auf dem Rechner, den Basis-Transcoder in
  `public/` und mit ETC1S sichtbar Qualität. Schwache Geräte bekommen ohnehin das Standbild
  (`lib/garage/capability.ts`). GLB 2,7 MB, davon 2,5 MB Texturen, unter dem Budget von 3 MB.
- Lichtrig: Sonne 2,2 statt 3,0, Himmel 1,3 statt 1,0. Backstein schluckt mehr als Putz, und
  die sonnige Fassade lief bei 3,0 über den Soft-Clip in Rosa.
- Der Export packt den Lightmap-Atlas nach `smart_project` mit `uv.pack_islands` neu und
  misst überlappende Inseln; die erste Schwelle brachte ein schwarzes Rechteck in den Boden,
  weil ihre langen dünnen Seiten auf der Bodeninsel lagen.

## Folgen

- `blender/textures/` liegt mit 6 MB im Repo. Die Quelle ist die `.blend` plus die
  Skripte, deshalb gehören die Texturen dazu; ambientCG könnte morgen weg sein.
- Stilaussage in KONZEPT §2 gilt nur noch für die Geometrie: Low-Poly, gebackenes Licht,
  wenige Materialien, aber Fototexturen auf den großen Flächen.
- Eine neue Textur heißt: Ordner in `blender/textures/<name>/` mit `color.jpg` und
  `normal.jpg`, `textured_material` in der Palette, Export. Nichts im Web ändert sich.
