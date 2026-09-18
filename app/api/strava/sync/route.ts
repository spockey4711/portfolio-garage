import { timingSafeEqual } from "node:crypto";
import { dataDir, stravaApp, stravaSyncSecret } from "@/lib/strava/env";
import { syncRecent } from "@/lib/strava/sync";

// The polling fallback (docs/adr/0002): a cron on the host POSTs here on
// loopback with the shared secret, the app pulls what the webhook may have
// missed. Runs synchronously so the cron sees a failure as a non-2xx.

function authorized(request: Request, secret: string): boolean {
  const header = request.headers.get("authorization") ?? "";
  const given = Buffer.from(header.replace(/^Bearer\s+/i, ""));
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(request: Request) {
  if (!authorized(request, stravaSyncSecret())) {
    return new Response(null, { status: 401 });
  }
  try {
    const report = await syncRecent({ dataDir: dataDir(), app: stravaApp() });
    return Response.json(report);
  } catch (error) {
    console.error("Strava sync failed", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "sync failed" },
      { status: 502 },
    );
  }
}
