#!/usr/bin/env bash
# Deploys one environment of the garage on the VPS from a GHCR image.
#
# Run over SSH by .github/workflows/ci.yml from the stack directory
# (/opt/containers/garage for the develop preview), after the workflow has
# copied compose.yaml and this script there. Expects:
#   IMAGE_TAG  the immutable image tag to run (sha-<short>)
#   HOST_PORT  the loopback port Nginx proxies to for this environment
set -euo pipefail
: "${IMAGE_TAG:?IMAGE_TAG is required}"
: "${HOST_PORT:?HOST_PORT is required}"
export IMAGE_TAG HOST_PORT

echo "Deploying ghcr.io/spockey4711/portfolio-garage:${IMAGE_TAG} on 127.0.0.1:${HOST_PORT}"
docker compose pull --quiet
docker compose up -d --remove-orphans

# The deploy is done when the app answers on loopback, not when the container
# exists. 60 s covers a cold Next start on this box with room to spare.
for _ in $(seq 1 30); do
  if curl -fsS --max-time 5 "http://127.0.0.1:${HOST_PORT}/" >/dev/null 2>&1; then
    echo "App answers on 127.0.0.1:${HOST_PORT}."
    # Dangling layers only; earlier tags stay pullable for a rollback.
    docker image prune -f >/dev/null
    exit 0
  fi
  sleep 2
done
echo "No 200 from 127.0.0.1:${HOST_PORT} within 60 s." >&2
docker compose logs --tail=50 web >&2 || true
exit 1
