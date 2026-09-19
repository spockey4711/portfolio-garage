# Betrieb

Wie die Garage auf den Server kommt und dort läuft. Entscheidung und Begründung in
`docs/adr/0002-hosting-eigener-server.md`, hier steht nur das Wie.

## Überblick

```
push auf develop
  -> CI: Quality Gate (.github/workflows/ci.yml)
  -> Image bauen (Dockerfile, Next standalone), Push nach GHCR
       ghcr.io/spockey4711/portfolio-garage:sha-<7 Zeichen>  (unveränderlich)
       ghcr.io/spockey4711/portfolio-garage:develop           (wandert mit)
  -> per SSH auf den VPS: compose.yaml und deploy/deploy-remote.sh nach
     /opt/containers/garage kopieren, dort IMAGE_TAG=sha-... HOST_PORT=3010 ./deploy-remote.sh
  -> Nginx (garage.yannikwuenker.de) proxyt auf 127.0.0.1:3010
```

Nichts wird auf dem Server gebaut. Der Container bindet nur an Loopback, Nginx ist der einzige
öffentliche Eingang.

## Umgebungen

| Umgebung | Branch    | Domain                    | Verzeichnis                                                        | Port |
| -------- | --------- | ------------------------- | ------------------------------------------------------------------ | ---- |
| develop  | `develop` | `garage.yannikwuenker.de` | `/opt/containers/garage`                                           | 3010 |
| prod     | `master`  | `yannikwuenker.de`        | übernimmt den Slot von Portfolio2 beim Go-live (Woche 2, ADR-0002) | 3002 |

Prod ist noch nicht verdrahtet; der Deploy-Job in `ci.yml` läuft nur für `develop`.

## Was auf dem Server einmalig eingerichtet ist

- Ubuntu 24.04, Docker mit Compose-Plugin, Nginx, Certbot. Teilt sich die Maschine mit
  Portfolio2, Küchenzettel, Umami, GlitchTip, Uptime Kuma und anderen.
- `/opt/containers/garage/`: Stack-Verzeichnis. `compose.yaml` und `deploy-remote.sh` legt
  jeder Deploy neu ab, eine optionale `.env` (Mode 600) bleibt liegen. Nichts davon ist ein
  Git-Checkout.
- `/etc/nginx/sites-available/garage.yannikwuenker.de`, verlinkt nach `sites-enabled`. Der
  handgeschriebene Teil liegt in `deploy/nginx/garage.yannikwuenker.de`; die TLS-Blöcke hängt
  Certbot an (`sudo certbot --nginx -d garage.yannikwuenker.de`).
- DNS: `A garage -> 75.119.137.140`, ohne Cloudflare-Proxy, wie `portfolio`.
- Deploy-Key: Ed25519, nur für Actions erzeugt. Öffentlicher Teil in
  `~yannik/.ssh/authorized_keys` (Kommentar `github-actions portfolio-garage deploy`).
- GHCR: der Server ist mit einem `read:packages`-Token eingeloggt, solange das Paket privat
  ist.

## Secrets und Variablen im GitHub-Repo

| Name                 | Art      | Inhalt                                              |
| -------------------- | -------- | --------------------------------------------------- |
| `DEPLOY_SSH_KEY`     | Secret   | privater Deploy-Key                                 |
| `DEPLOY_HOST`        | Variable | `75.119.137.140`                                    |
| `DEPLOY_USER`        | Variable | `yannik`                                            |
| `DEPLOY_KNOWN_HOSTS` | Variable | Ausgabe von `ssh-keyscan -t ed25519 75.119.137.140` |

Das `environment: develop` im Workflow zeigt die Preview-URL in der Actions-Oberfläche.

## Von Hand

Deploy eines bestimmten Stands, zum Beispiel für einen Rollback:

```
ssh contabo
cd /opt/containers/garage
IMAGE_TAG=sha-abc1234 HOST_PORT=3010 ./deploy-remote.sh
```

Logs: `docker compose logs -f web` im Stack-Verzeichnis. Der Health-Check des Containers
fragt `GET /` alle 30 s ab.

Lokal das Image bauen und starten, so wie es auf dem Server läuft:

```
docker build -t portfolio-garage:local .
docker run --rm -p 127.0.0.1:3777:3000 portfolio-garage:local
```

## Strava

Der Radcomputer zeigt die letzte Einheit aus Strava und den Verpflegungsplan, den
fuelivo.de dafür rechnet (`docs/KONZEPT.md` §5, ADR-0002, ADR-0008). Der Code liegt in
`lib/strava/` und `lib/fuelivo/`, die Routen unter `app/api/`. Der Container hält nur zwei
Dateien Zustand, beide im Volume `data` unter `/data`: `strava-token.json` (Access- und
Refresh-Token, rotiert bei jedem Refresh) und `activities.json` (die letzten 400 Tage,
ohne Ortsdaten, dazu der Fuelivo-Plan unter `plans[<id>]`).

```
Garmin -> Strava -> POST /api/strava/webhook  (Event mit id, Antwort sofort, Abruf danach)
                     POST /api/strava/sync     (Host-Cron mit Secret, Fallback, holt die
                                               letzte Woche plus alles Neue nach)
                        -> POST fuelivo.de/calculate  (am Ende jedes Syncs für die neueste
                                               sichtbare Einheit, wenn sie noch keinen
                                               Plan hat; ohne Antwort bleibt sie ohne)
                     GET  /api/activity        (öffentlich: letzte Einheit mit Plan,
                                               laufende Woche, nichts Privates)
```

Der Aufruf nach fuelivo.de braucht keinen Schlüssel und läuft nur aus dem Sync heraus, nie
aus einer Seitenanfrage. Bleibt der Plan aus (Log: "No plan from fuelivo.de"), zeigt der
Computer "Plan folgt nach dem nächsten Sync"; ein `sync` holt ihn nach.

### Einmalig einrichten

1. Strava-App unter <https://www.strava.com/settings/api>, "Authorization Callback Domain"
   ist `localhost` (für den einmaligen OAuth am Rechner). Client-ID und Secret in die
   lokale `.env` (Vorlage `.env.example`), dazu je ein zufälliger String für
   `STRAVA_VERIFY_TOKEN` und `STRAVA_SYNC_SECRET`.
2. Lokal autorisieren: `node scripts/strava.mts auth` öffnet die Freigabe im Browser und
   schreibt `data/strava-token.json`. Dann `node scripts/strava.mts sync` und
   `node scripts/strava.mts summary`, um zu sehen, was die API liefern wird.
3. Auf dem Server dieselbe `.env` ohne die Zeile `DATA_DIR` nach
   `/opt/containers/garage/.env` (Mode 600); `env_file` überschreibt sonst das `/data` aus
   dem Image: `grep -v '^DATA_DIR' .env | ssh contabo 'umask 077 && cat > /opt/containers/garage/.env'`.
   Der laufende Container liest die Datei erst nach dem Neuanlegen, `restart` reicht nicht:
   im Stack-Verzeichnis `IMAGE_TAG=<laufender Tag> HOST_PORT=3010 docker compose up -d`
   (den Tag zeigt `docker ps`; jedes `docker compose`-Kommando dort braucht beide Variablen).
   Dann die beiden Dateien ins Volume, per `scp` nach `/tmp` und
   `docker compose cp /tmp/strava-token.json web:/data/`, ebenso `activities.json`.
   `cp` behält die Host-UID, der Container läuft aber als `garage`, deshalb danach
   `docker compose exec -u root web chown garage:garage /data/strava-token.json /data/activities.json`.
4. Webhook anmelden, sobald die Route online ist:
   `node scripts/strava.mts subscribe https://garage.yannikwuenker.de/api/strava/webhook`.
   Strava ruft dabei `GET` mit `hub.challenge` auf und erwartet den Verify-Token aus der
   Server-`.env`. Eine Subscription pro App; `unsubscribe` löscht sie wieder.
5. Cron auf dem Host als Fallback, alle sechs Stunden reicht:
   `0 */6 * * * curl -fsS -X POST -H "Authorization: Bearer <STRAVA_SYNC_SECRET>" http://127.0.0.1:3010/api/strava/sync > /dev/null`

Ist der Token weg oder widerrufen, antworten Sync und Webhook-Verarbeitung mit einem
Fehler im Log, `/api/activity` liefert weiter den letzten Stand. Schritt 2 und 3 wiederholen.
