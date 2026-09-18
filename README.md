# portfolio-garage

Portfolio von Yannik Wünker als Fahrrad-Werkstatt-Garage: eine Low-Poly-3D-Szene, in der man
in den Radcomputer, den Laptop und die Pinnwand zoomt. Der Radcomputer zeigt echte
Trainingsdaten, der Laptop die Projekte.

Konzept, Szene, Hotspots und Aufwand: [docs/KONZEPT.md](docs/KONZEPT.md).

Status (2026-09-18): Blockout läuft im Browser, Kamera in Ruheposition mit Parallax. Stand
und nächste Schritte in [docs/PLAN.md](docs/PLAN.md).

## Entwicklung

```
pnpm install
pnpm dev
```

Quality Gate vor jedem Push: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
GLB und Hotspot-Koordinaten neu aus Blender: `pnpm export:blender` (braucht Blender unter
`/Applications/Blender.app`).

## Deploy

Jeder Push auf `develop` landet nach grüner Quality Gate auf
[garage.yannikwuenker.de](https://garage.yannikwuenker.de). Wie: [docs/BETRIEB.md](docs/BETRIEB.md).
