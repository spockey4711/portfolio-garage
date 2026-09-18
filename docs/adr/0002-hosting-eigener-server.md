# ADR-0002: Hosting auf dem eigenen VPS, nicht auf Vercel

- Status: Akzeptiert
- Datum: 2026-09-18
- Weicht ab von: `docs/KONZEPT.md` §5 (Vercel KV, Vercel Cron) und `docs/PLAN.md`
  (Vercel-Projekt, Preview-Deploys)

## Kontext

KONZEPT und PLAN gehen von Vercel aus: Serverless-Routen, Vercel KV für den Strava-Cache,
Vercel Cron als Polling-Fallback, Preview-Deploys pro PR. Portfolio2 läuft dagegen auf einem
Contabo-VPS mit Docker, Nginx als Reverse Proxy, Let's Encrypt, GHCR-Images aus GitHub Actions
und zwei Umgebungen (`develop` auf `portfolio.yannikwuenker.de`, `master` auf der Apex-Domain).
Auf demselben Server laufen Aurelian, Umami und GlitchTip. Geld soll das Portfolio nicht
kosten; beide Optionen sind kostenlos (Vercel Hobby erlaubt nicht-kommerzielle Portfolios,
der VPS ist ohnehin bezahlt).

## Entscheidung

Die Garage wird auf dem eigenen VPS gehostet, nach dem Muster von Portfolio2, aber neu
aufgesetzt (ADR-0001): Multi-Stage-Dockerfile mit `output: "standalone"`, Image nach GHCR,
Deploy per SSH, Nginx-Vhost, zwei Umgebungen. Die Garage übernimmt den Container-Slot und den
Vhost von Portfolio2, die Domain zieht nicht um.

Strava ohne Vendor-Dienst: der Webhook trifft eine Route-Handler-Route, der Aktivitäten-Cache
ist eine JSON-Datei auf einem Docker-Volume, das Polling als Fallback ein Cron auf dem Host.
Das Strava-Refresh-Token liegt auf demselben Volume, weil Strava beim Refresh ein neues
ausgeben kann.

## Begründung

- Ein Betriebsmodell statt zwei: Analytics, Fehlertracking, Aurelian und die Garage unter
  einem Nginx, einem Monitoring, einem Deploy-Pfad.
- Keine Plan-Grenzen (Cron nur einmal täglich auf Vercel Hobby, Funktionslaufzeit,
  Bandbreite) und keine Nutzungsklausel, die sich ändern kann.
- Kein Lock-in für null Gegenwert: Vercel KV wäre Upstash über den Marketplace, auf dem VPS
  ist der Cache eine Datei.

Was Vercel besser könnte und hier nicht zählt: Preview-URL pro PR (die `develop`-Subdomain
reicht für einen Solo-Entwickler) und globales CDN (Zielgruppe ist deutschsprachig, 3 MB GLB
aus Deutschland ist schnell genug; Nginx liefert mit Brotli und langen Cache-Headern).

## Konsequenzen

- `docs/PLAN.md` Setups: "Vercel-Projekt" wird "Server-Deploy", "Vercel KV" wird "Volume".
- Der Bake-Vergleich Tag/Nacht und die Lightmaps liegen als statische Assets in `public/`,
  Nginx cached sie; das ist unabhängig von der Hosting-Wahl, entfällt aber als Argument für
  ein CDN.
- Wenn der VPS jemals wegfällt, ist Vercel der Ausweichpfad: die App hat keine
  serverspezifischen Abhängigkeiten außer dem Volume-Pfad, der über eine Env-Var konfiguriert
  wird.
