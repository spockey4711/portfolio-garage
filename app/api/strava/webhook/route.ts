import { after } from "next/server";
import { dataDir, stravaApp, stravaVerifyToken } from "@/lib/strava/env";
import {
  challengeResponse,
  eventFromBody,
  handleEvent,
} from "@/lib/strava/webhook";

// Strava's webhook callback (docs/KONZEPT.md §5). GET is the one-time
// subscription validation, POST an event. Strava expects the 200 within two
// seconds and retries otherwise, so the API call and the cache write run
// after the response has gone out.

export async function GET(request: Request) {
  const body = challengeResponse(
    new URL(request.url).searchParams,
    stravaVerifyToken(),
  );
  return body ? Response.json(body) : new Response(null, { status: 403 });
}

export async function POST(request: Request) {
  const event = eventFromBody(await request.json().catch(() => null));
  if (!event) return new Response(null, { status: 400 });

  after(async () => {
    try {
      await handleEvent({ dataDir: dataDir(), app: stravaApp() }, event);
    } catch (error) {
      console.error(
        `Strava webhook ${event.aspect} ${event.objectId} failed`,
        error,
      );
    }
  });
  return new Response(null, { status: 200 });
}
