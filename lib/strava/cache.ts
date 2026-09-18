import { join } from "node:path";
import type { Activity } from "./activity.ts";
import { readJsonFile, writeJsonFile } from "./json-file.ts";

// The activity cache is one JSON file on the data volume (docs/adr/0002),
// newest activity first. Everything that reads training data reads this
// file; only the sync writes it. Keeping a year plus margin bounds the file
// and still covers the "last twelve months" views planned for later.

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
}

export const emptyCache: ActivityCache = {
  version: 1,
  syncedAt: null,
  ftp: null,
  activities: [],
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
  return { ...cache, activities: cache.activities.filter((a) => a.id !== id) };
}

/** Drops everything that started more than KEEP_DAYS before `now`. */
export function pruneCache(cache: ActivityCache, now: Date): ActivityCache {
  const cutoff = new Date(now.getTime() - KEEP_DAYS * 86_400_000).toISOString();
  return {
    ...cache,
    activities: cache.activities.filter((a) => a.startedAt >= cutoff),
  };
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
  };
}

export async function writeCache(dataDir: string, cache: ActivityCache) {
  await writeJsonFile(cachePath(dataDir), cache);
}
