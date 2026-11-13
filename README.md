# portfolio-garage

Portfolio von Yannik Wünker als Fahrrad-Werkstatt-Garage: eine Low-Poly-3D-Szene, in der man
in den Radcomputer, den Laptop und die Pinnwand zoomt. Der Radcomputer zeigt echte
Trainingsdaten, der Laptop die Projekte, die Pinnwand den Blog.

Konzept, Szene, Hotspots und Aufwand: [docs/KONZEPT.md](docs/KONZEPT.md).

Status: Phase 2 im Code, nicht das Blockout von Tag 0. Fünf Hotspots (`computer`,
`laptop`, `blog`, `about`, `tools`) mit befüllten Screens, Strava-Cache und Fuelivo-Plan
am Radcomputer, Standbild-Fallback unter 768 px, bei Reduced Motion und ohne brauchbares
WebGL. Preview nur von `develop` auf
[garage.yannikwuenker.de](https://garage.yannikwuenker.de). `yannikwuenker.de` ist nicht
verdrahtet. Offene Punkte: [docs/PLAN.md](docs/PLAN.md).

## Entwicklung

```
pnpm install
pnpm dev
```

Quality Gate vor jedem Push: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
Die Browser-Suite (`pnpm test:e2e`) hängt nicht an `pnpm test`. In CI ist sie ein eigener
Job und Pflicht vor Image und Deploy (`.github/workflows/ci.yml`).
GLB und Hotspot-Koordinaten neu aus Blender: `pnpm export:blender` (braucht Blender unter
`/Applications/Blender.app`).

## Deploy

Jeder Push auf `develop` landet nach grüner Quality Gate auf
[garage.yannikwuenker.de](https://garage.yannikwuenker.de). Wie: [docs/BETRIEB.md](docs/BETRIEB.md).

## Lizenz

Code unter [MIT](LICENSE). Texte, Bilder, das Blender-Modell und die gezeigten Daten sind
davon ausgenommen und bleiben vorbehalten, Details am Ende der `LICENSE`.
