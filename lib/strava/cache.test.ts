import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type ActivityCache,
  cachePath,
  emptyCache,
  KEEP_DAYS,
  pruneCache,
  readCache,
  removeActivity,
  upsertActivity,
  writeCache,
} from "./cache";
import { activity, ride } from "./fixtures";

const older = activity({ id: 1, startedAt: "2026-09-10T06:00:00Z" });
const newer = activity({ id: 2, startedAt: "2026-09-17T06:00:00Z" });

describe("upsertActivity", () => {
  it("keeps the newest first whatever the order of arrival", () => {
    const cache = [older, newer, ride].reduce(upsertActivity, emptyCache);
    expect(cache.activities.map((a) => a.id)).toEqual([2, ride.id, 1]);
  });

  it("replaces an activity with the same id", () => {
    const cache = upsertActivity(
      upsertActivity(emptyCache, ride),
      activity({ name: "Renamed" }),
    );
    expect(cache.activities).toHaveLength(1);
    expect(cache.activities[0].name).toBe("Renamed");
  });

  it("does not touch the input", () => {
    const before = upsertActivity(emptyCache, older);
    upsertActivity(before, newer);
    expect(before.activities).toHaveLength(1);
  });
});

describe("removeActivity", () => {
  it("removes by id and tolerates an unknown one", () => {
    const cache = upsertActivity(emptyCache, ride);
    expect(removeActivity(cache, ride.id).activities).toEqual([]);
    expect(removeActivity(cache, 99).activities).toEqual([ride]);
  });
});

describe("pruneCache", () => {
  it("drops what started more than KEEP_DAYS ago", () => {
    const now = new Date("2026-09-18T12:00:00Z");
    const ancient = activity({
      id: 3,
      startedAt: new Date(
        now.getTime() - (KEEP_DAYS + 1) * 86_400_000,
      ).toISOString(),
    });
    const kept = activity({
      id: 4,
      startedAt: new Date(
        now.getTime() - (KEEP_DAYS - 1) * 86_400_000,
      ).toISOString(),
    });
    const cache = [ancient, kept].reduce(upsertActivity, emptyCache);
    expect(pruneCache(cache, now).activities.map((a) => a.id)).toEqual([4]);
  });
});

describe("readCache and writeCache", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "garage-cache-"));
  });
  afterEach(() => rm(dir, { recursive: true, force: true }));

  it("is empty before the first write", async () => {
    expect(await readCache(dir)).toEqual(emptyCache);
  });

  it("round-trips", async () => {
    const cache: ActivityCache = {
      version: 1,
      syncedAt: "2026-09-18T12:00:00.000Z",
      ftp: 260,
      activities: [ride],
    };
    await writeCache(dir, cache);
    expect(await readCache(dir)).toEqual(cache);
    expect(await readFile(cachePath(dir), "utf8")).toMatch(/\n$/);
  });

  it("treats a file of another version as empty", async () => {
    await writeFile(cachePath(dir), JSON.stringify({ version: 2 }));
    expect(await readCache(dir)).toEqual(emptyCache);
  });
});
