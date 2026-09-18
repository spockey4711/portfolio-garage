import { type Activity, activityFromStrava } from "./activity.ts";

// The three Strava API calls the sync needs, on top of a valid access token
// (token.ts). Rate limits are 200 calls per 15 minutes and 2000 per day;
// the sync stays far below that: one call per webhook event, a handful
// per polling run, a few dozen for the initial backfill.

export const API_URL = "https://www.strava.com/api/v3";
/** Strava's maximum page size for the activity list. */
export const PAGE_SIZE = 200;

export class StravaApiError extends Error {
  readonly status: number;
  readonly path: string;
  constructor(status: number, path: string) {
    super(`Strava API ${path} answered ${status}`);
    this.status = status;
    this.path = path;
  }
}

export async function stravaGet(
  path: string,
  params: Record<string, string | number>,
  accessToken: string,
  fetchFn: typeof fetch = fetch,
): Promise<unknown> {
  const query = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)]),
  ).toString();
  const response = await fetchFn(
    `${API_URL}${path}${query ? `?${query}` : ""}`,
    {
      headers: { authorization: `Bearer ${accessToken}` },
    },
  );
  if (!response.ok) throw new StravaApiError(response.status, path);
  return response.json();
}

export async function getActivity(
  id: number,
  accessToken: string,
  fetchFn?: typeof fetch,
): Promise<Activity> {
  return activityFromStrava(
    await stravaGet(`/activities/${id}`, {}, accessToken, fetchFn),
  );
}

/**
 * One page of the athlete's activities that started after `after`, oldest
 * first as Strava orders them; an empty page ends the pagination.
 */
export async function listActivities(
  after: Date,
  page: number,
  accessToken: string,
  fetchFn?: typeof fetch,
): Promise<Activity[]> {
  const body = await stravaGet(
    "/athlete/activities",
    {
      after: Math.floor(after.getTime() / 1000),
      page,
      per_page: PAGE_SIZE,
    },
    accessToken,
    fetchFn,
  );
  if (!Array.isArray(body))
    throw new StravaApiError(200, "/athlete/activities");
  return body.map(activityFromStrava);
}

/** The FTP the athlete has set on Strava, null when unset. */
export async function getAthleteFtp(
  accessToken: string,
  fetchFn?: typeof fetch,
): Promise<number | null> {
  const body = (await stravaGet("/athlete", {}, accessToken, fetchFn)) as {
    ftp?: unknown;
  };
  return typeof body.ftp === "number" && body.ftp > 0 ? body.ftp : null;
}
