import { readCache } from "@/lib/strava/cache";
import { dataDir } from "@/lib/strava/env";
import { summarize } from "@/lib/strava/summary";

// The training data the bike computer shows (docs/KONZEPT.md §3), straight
// from the cache file: no Strava call on the request path, nothing private,
// no locations. Reading the file makes the handler dynamic; the short
// max-age lets Nginx and the browser absorb bursts.

export async function GET() {
  const summary = summarize(await readCache(dataDir()));
  return Response.json(summary, {
    headers: { "cache-control": "public, max-age=60" },
  });
}
