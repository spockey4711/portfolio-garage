import { calculatePlan } from "../fuelivo/client.ts";
import { maxHeartRateOf, requestFor, sameRequest } from "../fuelivo/request.ts";
import type { Activity } from "./activity.ts";
import {
  getActivity,
  getAthleteFtp,
  listActivities,
  StravaApiError,
} from "./api.ts";
import {
  type ActivityCache,
  KEEP_DAYS,
  pruneCache,
  readCache,
  removeActivity,
  setPlan,
  upsertActivity,
  writeCache,
} from "./cache.ts";
import { type StravaApp, validTokens } from "./token.ts";

// Two ways into the cache (docs/KONZEPT.md §5, docs/adr/0002): the webhook
// delivers one activity id at a time, the host cron and the CLI pull
// everything recent as a fallback. Both end in the same read-modify-write of
// the cache file, serialized per process so two webhook events arriving
// together cannot overwrite each other's change. Both end with the Fuelivo
// plan for the newest visible activity (docs/adr/0008): one request per new
// activity, none per visitor, and no plan is not an error.

export interface SyncContext {
  readonly dataDir: string;
  readonly app: StravaApp;
  readonly now?: () => Date;
  readonly fetchFn?: typeof fetch;
}

/**
 * Days before the newest cached start the polling run re-reads. Garmin
 * uploads late and Strava edits change data, so a pure "since last sync"
 * would miss both.
 */
export const OVERLAP_DAYS = 7;

const queues = new Map<string, Promise<unknown>>();

/** Runs `change` on the cache file with no other change to it in flight. */
async function updateCache(
  dataDir: string,
  change: (cache: ActivityCache) => Promise<ActivityCache> | ActivityCache,
): Promise<ActivityCache> {
  const previous = queues.get(dataDir) ?? Promise.resolve();
  const run = previous
    .catch(() => undefined)
    .then(async () => {
      const next = await change(await readCache(dataDir));
      await writeCache(dataDir, next);
      return next;
    });
  queues.set(dataDir, run);
  run
    .finally(() => {
      if (queues.get(dataDir) === run) queues.delete(dataDir);
    })
    // The caller gets the rejection through `run`; this chain only cleans up.
    .catch(() => undefined);
  return run;
}

/**
 * One activity from Strava into the cache, for a webhook create or update.
 * An activity that is gone (404) or not the athlete's own leaves the cache
 * without it.
 */
export async function syncActivity(
  ctx: SyncContext,
  id: number,
): Promise<"stored" | "removed"> {
  const tokens = await validTokens(
    ctx.dataDir,
    ctx.app,
    ctx.now?.(),
    ctx.fetchFn,
  );
  let stored = true;
  try {
    const activity = await getActivity(id, tokens.accessToken, ctx.fetchFn);
    if (activity.athleteId !== tokens.athleteId) stored = false;
    else
      await updateCache(ctx.dataDir, (cache) =>
        withLatestPlan(upsertActivity(cache, activity), ctx),
      );
  } catch (error) {
    if (!(error instanceof StravaApiError) || error.status !== 404) throw error;
    stored = false;
  }
  if (!stored) await deleteActivity(ctx, id);
  return stored ? "stored" : "removed";
}

export async function deleteActivity(ctx: SyncContext, id: number) {
  await updateCache(ctx.dataDir, (cache) => removeActivity(cache, id));
}

export interface SyncReport {
  /** Activities fetched from Strava in this run. */
  readonly fetched: number;
  /** Activities in the cache afterwards. */
  readonly total: number;
}

/**
 * Everything since OVERLAP_DAYS before the newest cached activity, or the
 * whole KEEP_DAYS window when the cache is empty; then the FTP, the prune
 * and the sync timestamp.
 */
export async function syncRecent(ctx: SyncContext): Promise<SyncReport> {
  const now = ctx.now?.() ?? new Date();
  const tokens = await validTokens(ctx.dataDir, ctx.app, now, ctx.fetchFn);
  const before = await readCache(ctx.dataDir);
  const newest = before.activities[0]?.startedAt;
  const after = newest
    ? new Date(new Date(newest).getTime() - OVERLAP_DAYS * 86_400_000)
    : new Date(now.getTime() - KEEP_DAYS * 86_400_000);

  const fetched: Activity[] = [];
  for (let page = 1; ; page += 1) {
    const batch = await listActivities(
      after,
      page,
      tokens.accessToken,
      ctx.fetchFn,
    );
    fetched.push(...batch);
    if (batch.length === 0) break;
  }
  const ftp = await getAthleteFtp(tokens.accessToken, ctx.fetchFn);

  const cache = await updateCache(ctx.dataDir, (current) => {
    const merged = fetched
      .filter((a) => a.athleteId === tokens.athleteId)
      .reduce(upsertActivity, current);
    return withLatestPlan(
      { ...pruneCache(merged, now), ftp, syncedAt: now.toISOString() },
      ctx,
    );
  });
  return { fetched: fetched.length, total: cache.activities.length };
}

/**
 * The cache with a current Fuelivo plan for its newest visible activity,
 * the one the bike computer shows. A plan whose input still matches stays,
 * so a polling run that re-reads the same rides asks Fuelivo nothing; an
 * activity Fuelivo has no plan for, or one Fuelivo does not answer for,
 * stays without and is asked again on the next sync.
 */
async function withLatestPlan(
  cache: ActivityCache,
  ctx: SyncContext,
): Promise<ActivityCache> {
  const latest = cache.activities.find((a) => !a.isPrivate);
  if (!latest) return cache;
  const request = requestFor(latest, maxHeartRateOf(cache.activities));
  if (!request) return cache;
  const existing = cache.plans[latest.id];
  if (existing && sameRequest(existing.input, request)) return cache;
  const plan = await calculatePlan(request, ctx.fetchFn, ctx.now);
  return plan ? setPlan(cache, latest.id, plan) : cache;
}
