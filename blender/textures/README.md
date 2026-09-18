# Texturen

Kachelnde Fototexturen für `garage_lib.textured_material` (ADR-0006). Pro Ordner
`color.jpg` (sRGB) und `normal.jpg` (OpenGL-Normal-Map, nur für den Bake). Die Ordnernamen
sind die Materialnamen in `blender/build/build_room.py`, das Kachelmaß steht dort.

| Ordner      | Quelle (ambientCG, CC0)                    | Kachel | Änderung                                 |
| ----------- | ------------------------------------------ | ------ | ---------------------------------------- |
| `backstein` | https://ambientcg.com/a/Bricks059, 2K-JPG  | 1,05 m | Farbe 2k q90, Normal 1k                  |
| `asphalt`   | https://ambientcg.com/a/Asphalt033, 2K-JPG | 2,5 m  | Farbe 1k, Sättigung 0,25, Helligkeit 0,8 |
| `holz`      | https://ambientcg.com/a/Wood092, 2K-JPG    | 0,8 m  | Farbe 2k q90, Normal 1k                  |

CC0 1.0: keine Namensnennung nötig, https://docs.ambientcg.com/license/. Die `.blend`
referenziert die Dateien relativ (`//textures/...`), ins GLB geht nur `color.jpg` als WebP.
