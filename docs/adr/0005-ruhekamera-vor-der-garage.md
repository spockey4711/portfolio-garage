# ADR-0005: Die Ruhekamera steht vor der Garage, nicht im Tor

- Status: Akzeptiert
- Datum: 2026-09-18
- Weicht ab von: `docs/KONZEPT.md` §2 ("Dach und Tor", Ruhekamera 2,2 m vor dem Tor) und §3
  (Ruhe bei (0, 1.6, 4.2) mit FOV 45°)

## Kontext

Mit der Kamera 2,2 m vor der Toröffnung und 45° vertikalem FOV zeigte das Ruhebild nur das
Innere: Rückwand, Boden, das hängende Torsegment als Band oben. Weder Pfeiler noch Sturz noch
Vorplatz waren im Bild, das Bild las sich als Zimmer, nicht als Garage. Dazu verdeckte der
Werkstattschrank an der linken Wand von dort aus das linke Ende der Werkbank und der
Schwerlastregal-Pfosten lief vor der Pinnwand durch.

## Entscheidung

- Die Ruhekamera steht bei (0, 1.6, 5.2), also 3,2 m vor der Toröffnung, mit 55° vertikalem
  FOV (23 mm). Das Ziel bleibt (0, 1.1, 0). Im 16:9-Bild sind beide Pfeiler, der Sturz mit
  Außenwand darüber und ein Streifen Vorplatz unten zu sehen, das hängende Torsegment sitzt
  im oberen Drittel.
- Der Vorplatz läuft bündig mit den Bodenplatten bis an die Bodenkante (z = 2,0) und unter
  die Pfeiler, sonst zeigt die Schwelle Himmel.
- Kein Möbel darf von der Ruhekamera aus einen Hotspot verdecken. Der Schrank rückt an der
  linken Wand nach vorn (z = +0,25), das Regal wird 0,60 breit (x 2,35 bis 2,95), die
  Pinnwand rutscht auf x = 1,75. Die Maßtabelle in KONZEPT §2 führt die neuen Werte.
- Der Export behält die weggeschnittenen Rückseiten als Lichtblocker im Bake und leitet den
  Denoiser mit Albedo und Normale, siehe `.claude/skills/blender-export/SKILL.md`. Beides
  fiel erst mit der weiter hinten stehenden Kamera auf (Nahtleuchten in der Raumecke, Korn
  auf einer schwach beleuchteten Wandfläche).

## Konsequenzen

- Die Kamerafahrten zu den Hotspots sind einen Meter länger, die Dauer aus KONZEPT §3 bleibt.
- Das Culling ändert sich nicht: Pfeiler- und Sturzfronten waren schon von der alten
  Ruhekamera aus sichtbar, das GLB hat dieselbe Flächenzahl wie vorher.
- Die Kamera steht auf dem Vorplatz. Wer den Vorplatz oder die Torwand ändert, prüft das
  Ruhebild, nicht nur die Fokusansichten.
