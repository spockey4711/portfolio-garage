import { API_URL } from "./api.ts";
import { deleteActivity, syncActivity, type SyncContext } from "./sync.ts";
import type { StravaApp } from "./token.ts";

// Strava's push subscription: one per API application. Creating it makes
// Strava GET the callback URL with a challenge, which the webhook route
// answers; afterwards every change to an activity of the athlete arrives as
// a POST with the ids, never the data (docs/KONZEPT.md §5).

export interface WebhookEvent {
  readonly objectType: "activity" | "athlete";
  readonly objectId: number;
  readonly aspect: "create" | "update" | "delete";
  readonly ownerId: number;
}

/** The event out of a webhook POST body, or null when it is not one. */
export function eventFromBody(body: unknown): WebhookEvent | null {
  if (typeof body !== "object" || body === null) return null;
  const raw = body as Record<string, unknown>;
  const objectType = raw.object_type;
  const aspect = raw.aspect_type;
  if (
    (objectType !== "activity" && objectType !== "athlete") ||
    (aspect !== "create" && aspect !== "update" && aspect !== "delete") ||
    typeof raw.object_id !== "number" ||
    typeof raw.owner_id !== "number"
  ) {
    return null;
  }
  return {
    objectType,
    objectId: raw.object_id,
    aspect,
    ownerId: raw.owner_id,
  };
}

/**
 * Applies an event to the cache. Athlete events (deauthorization) are
 * ignored; a lost token shows up on the next API call anyway.
 */
export async function handleEvent(ctx: SyncContext, event: WebhookEvent) {
  if (event.objectType !== "activity") return;
  if (event.aspect === "delete") await deleteActivity(ctx, event.objectId);
  else await syncActivity(ctx, event.objectId);
}

/** The subscription validation: Strava's query, the app's verify token. */
export function challengeResponse(
  query: URLSearchParams,
  verifyToken: string,
): { "hub.challenge": string } | null {
  const challenge = query.get("hub.challenge");
  if (
    query.get("hub.mode") !== "subscribe" ||
    query.get("hub.verify_token") !== verifyToken ||
    !challenge
  ) {
    return null;
  }
  return { "hub.challenge": challenge };
}

export interface Subscription {
  readonly id: number;
  readonly callbackUrl: string;
}

async function subscriptionRequest(
  app: StravaApp,
  method: "GET" | "POST" | "DELETE",
  path: string,
  params: Record<string, string>,
  fetchFn: typeof fetch,
): Promise<unknown> {
  const body = new URLSearchParams({
    client_id: app.clientId,
    client_secret: app.clientSecret,
    ...params,
  });
  const url = `${API_URL}/push_subscriptions${path}`;
  const response =
    method === "POST"
      ? await fetchFn(url, { method, body })
      : await fetchFn(`${url}?${body}`, { method });
  if (!response.ok) {
    throw new Error(
      `Strava ${method} push_subscriptions${path} answered ${response.status}: ${await response.text()}`,
    );
  }
  return response.status === 204 ? null : response.json();
}

export async function listSubscriptions(
  app: StravaApp,
  fetchFn: typeof fetch = fetch,
): Promise<Subscription[]> {
  const body = await subscriptionRequest(app, "GET", "", {}, fetchFn);
  if (!Array.isArray(body)) return [];
  return body.map((entry: { id: number; callback_url: string }) => ({
    id: entry.id,
    callbackUrl: entry.callback_url,
  }));
}

export async function createSubscription(
  app: StravaApp,
  callbackUrl: string,
  verifyToken: string,
  fetchFn: typeof fetch = fetch,
): Promise<number> {
  const body = (await subscriptionRequest(
    app,
    "POST",
    "",
    { callback_url: callbackUrl, verify_token: verifyToken },
    fetchFn,
  )) as { id: number };
  return body.id;
}

export async function deleteSubscription(
  app: StravaApp,
  id: number,
  fetchFn: typeof fetch = fetch,
) {
  await subscriptionRequest(app, "DELETE", `/${id}`, {}, fetchFn);
}
