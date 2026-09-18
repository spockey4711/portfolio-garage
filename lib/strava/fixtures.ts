import type { Activity } from "./activity.ts";
import type { TokenSet } from "./token.ts";

// Test data in Strava's shape and in ours. The raw object carries the fields
// of a summary activity as the API sends them (docs.strava.com, SummaryActivity),
// with a few that are only there when the ride had power or heart rate.

export const ATHLETE_ID = 4711;

/** A morning ride with power meter and heart rate, as Strava lists it. */
export const rawRide = {
  id: 1234567890,
  resource_state: 2,
  athlete: { id: ATHLETE_ID, resource_state: 1 },
  name: "Bergisches Land",
  distance: 84213.5,
  moving_time: 10980,
  elapsed_time: 11520,
  total_elevation_gain: 912,
  type: "Ride",
  sport_type: "Ride",
  start_date: "2026-09-15T05:42:10Z",
  start_date_local: "2026-09-15T07:42:10Z",
  timezone: "(GMT+01:00) Europe/Berlin",
  utc_offset: 7200,
  start_latlng: [50.9, 6.9],
  end_latlng: [50.9, 6.9],
  trainer: false,
  commute: false,
  private: false,
  average_speed: 7.669,
  max_speed: 18.2,
  average_watts: 198.4,
  weighted_average_watts: 221,
  kilojoules: 2178.4,
  device_watts: true,
  has_heartrate: true,
  average_heartrate: 142.7,
  max_heartrate: 176,
  suffer_score: 118,
};

export const ride: Activity = {
  id: 1234567890,
  athleteId: ATHLETE_ID,
  name: "Bergisches Land",
  sport: "Ride",
  startedAt: "2026-09-15T05:42:10Z",
  startedAtLocal: "2026-09-15T07:42:10",
  timezone: "Europe/Berlin",
  movingTime: 10980,
  elapsedTime: 11520,
  distance: 84213.5,
  elevationGain: 912,
  averageHeartRate: 142.7,
  maxHeartRate: 176,
  averageWatts: 198.4,
  normalizedWatts: 221,
  powerFromMeter: true,
  kilojoules: 2178.4,
  relativeEffort: 118,
  trainer: false,
  commute: false,
  isPrivate: false,
};

/** Another activity of ours with the fields that differ from `ride`. */
export function activity(overrides: Partial<Activity>): Activity {
  return { ...ride, ...overrides };
}

export const tokens: TokenSet = {
  athleteId: ATHLETE_ID,
  accessToken: "access-1",
  refreshToken: "refresh-1",
  expiresAt: 1_800_000_000,
};

/** A fetch stub that answers by URL prefix and records what was called. */
export function fakeFetch(
  routes: Record<
    string,
    (url: URL, init?: RequestInit) => Response | Promise<Response>
  >,
) {
  const calls: URL[] = [];
  const fetchFn = (async (
    input: string | URL | Request,
    init?: RequestInit,
  ) => {
    const url = new URL(input instanceof Request ? input.url : input);
    calls.push(url);
    const route = Object.entries(routes).find(([prefix]) =>
      `${url.origin}${url.pathname}`.startsWith(prefix),
    );
    if (!route) return new Response("no route", { status: 404 });
    return route[1](url, init);
  }) as typeof fetch;
  return { fetchFn, calls };
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
