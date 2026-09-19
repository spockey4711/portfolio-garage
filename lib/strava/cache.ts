import { join } from "node:path";
import type { FuelPlan } from "../fuelivo/client.ts";
import type { Activity } from "./activity.ts";
import { readJsonFile, writeJsonFile } from "./json-file.ts";

// The activity cache is one JSON file on the data volume (docs/adr/0002),
// newest activity first, with the Fuelivo plan of an activity next to it
// under its id (docs/adr/0008). Everything that reads training data reads
// this file; only the sync writes it. Keeping a year plus margin bounds the
// file and still covers the "last twelve months" views planned for later.

export const CACHE_FILE = "activities.json";
export const KEEP_DAYS = 400;

export interface ActivityCache {
  readonly version: 1;
  /** When the sync last ran to completion, ISO 8601, null before the first. */
  readonly syncedAt: string | null;
  /** The athlete's FTP on Strava, the base of the TSS; null when unset. */
  readonly ftp: number | null;
  /** Newest start first. */
  readonly activities: readonly Activity[];
  /** Fuelivo plans by activity id; an activity without one has no entry. */
  readonly plans: Readonly<Record<string, FuelPlan>>;
}

export const emptyCache: ActivityCache = {
  version: 1,
  syncedAt: null,
  ftp: null,
  activities: [],
  plans: {},
};

function byStartDesc(a: Activity, b: Activity): number {
  return b.startedAt.localeCompare(a.startedAt) || b.id - a.id;
}

/** The cache with `activity` added or replaced, order kept. */
export function upsertActivity(
  cache: ActivityCache,
  activity: Activity,
): ActivityCache {
  const others = cache.activities.filter((a) => a.id !== activity.id);
  return { ...cache, activities: [...others, activity].sort(byStartDesc) };
}

export function removeActivity(cache: ActivityCache, id: number) {
  return withActivities(
    cache,
    cache.activities.filter((a) => a.id !== id),
  );
}

/** The cache with `plan` stored for the activity `id`. */
export function setPlan(
  cache: ActivityCache,
  id: number,
  plan: FuelPlan,
): ActivityCache {
  return { ...cache, plans: { ...cache.plans, [id]: plan } };
}

/** Drops everything that started more than KEEP_DAYS before `now`. */
export function pruneCache(cache: ActivityCache, now: Date): ActivityCache {
  const cutoff = new Date(now.getTime() - KEEP_DAYS * 86_400_000).toISOString();
  return withActivities(
    cache,
    cache.activities.filter((a) => a.startedAt >= cutoff),
  );
}

/** The cache with these activities, keeping only the plans of activities still in it. */
function withActivities(
  cache: ActivityCache,
  activities: readonly Activity[],
): ActivityCache {
  const ids = new Set(activities.map((a) => String(a.id)));
  const plans = Object.fromEntries(
    Object.entries(cache.plans).filter(([id]) => ids.has(id)),
  );
  return { ...cache, activities, plans };
}

export function cachePath(dataDir: string): string {
  return join(dataDir, CACHE_FILE);
}

/** The cache on disk; a missing or foreign file counts as empty. */
export async function readCache(dataDir: string): Promise<ActivityCache> {
  const value = (await readJsonFile(
    cachePath(dataDir),
  )) as Partial<ActivityCache | null>;
  if (value?.version !== 1 || !Array.isArray(value.activities)) {
    return emptyCache;
  }
  return {
    version: 1,
    syncedAt: typeof value.syncedAt === "string" ? value.syncedAt : null,
    ftp: typeof value.ftp === "number" ? value.ftp : null,
    activities: value.activities,
    plans: isRecord(value.plans) ? value.plans : {},
  };
}

function isRecord(value: unknown): value is Record<string, FuelPlan> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function writeCache(dataDir: string, cache: ActivityCache) {
  await writeJsonFile(cachePath(dataDir), cache);
}
