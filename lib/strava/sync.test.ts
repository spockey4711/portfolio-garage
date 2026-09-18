import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { API_URL, PAGE_SIZE } from "./api";
import { KEEP_DAYS, readCache, writeCache, emptyCache } from "./cache";
import {
  activity,
  ATHLETE_ID,
  fakeFetch,
  json,
  rawRide,
  ride,
  tokens,
} from "./fixtures";
import { deleteActivity, OVERLAP_DAYS, syncActivity, syncRecent } from "./sync";
import { writeTokens } from "./token";

const app = { clientId: "42", clientSecret: "s3cret" };
const now = new Date("2026-09-18T10:00:00Z");

describe("sync", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "garage-sync-"));
    await writeTokens(dir, {
      ...tokens,
      expiresAt: now.getTime() / 1000 + 3600,
    });
  });
  afterEach(() => rm(dir, { recursive: true, force: true }));

  function ctx(fetchFn: typeof fetch) {
    return { dataDir: dir, app, now: () => now, fetchFn };
  }

  describe("syncActivity", () => {
    it("fetches the activity with the token and stores it", async () => {
      const { fetchFn, calls } = fakeFetch({
        [`${API_URL}/activities/${rawRide.id}`]: () => json(rawRide),
      });
      expect(await syncActivity(ctx(fetchFn), rawRide.id)).toBe("stored");
      expect((await readCache(dir)).activities.map((a) => a.id)).toEqual([
        rawRide.id,
      ]);
      expect(calls).toHaveLength(1);
    });

    it("removes an activity Strava no longer has", async () => {
      await writeCache(dir, {
        ...emptyCache,
        activities: [{ ...ride }],
      });
      const { fetchFn } = fakeFetch({
        [`${API_URL}/activities/`]: () => json({ message: "Not Found" }, 404),
      });
      expect(await syncActivity(ctx(fetchFn), rawRide.id)).toBe("removed");
      expect((await readCache(dir)).activities).toEqual([]);
    });

    it("keeps someone else's activity out", async () => {
      const { fetchFn } = fakeFetch({
        [`${API_URL}/activities/`]: () =>
          json({ ...rawRide, athlete: { id: ATHLETE_ID + 1 } }),
      });
      expect(await syncActivity(ctx(fetchFn), rawRide.id)).toBe("removed");
      expect((await readCache(dir)).activities).toEqual([]);
    });

    it("passes other API errors on", async () => {
      const { fetchFn } = fakeFetch({
        [`${API_URL}/activities/`]: () => json({}, 500),
      });
      await expect(syncActivity(ctx(fetchFn), 1)).rejects.toThrow("500");
    });

    it("serializes writes that arrive together", async () => {
      const { fetchFn } = fakeFetch({
        [`${API_URL}/activities/`]: (url) => {
          const id = Number(url.pathname.split("/").at(-1));
          return json({
            ...rawRide,
            id,
            start_date: `2026-09-1${id}T05:00:00Z`,
          });
        },
      });
      await Promise.all([1, 2, 3].map((id) => syncActivity(ctx(fetchFn), id)));
      expect((await readCache(dir)).activities.map((a) => a.id)).toEqual([
        3, 2, 1,
      ]);
    });
  });

  describe("deleteActivity", () => {
    it("removes the id", async () => {
      const { fetchFn } = fakeFetch({
        [`${API_URL}/activities/`]: () => json(rawRide),
      });
      await syncActivity(ctx(fetchFn), rawRide.id);
      await deleteActivity(ctx(fetchFn), rawRide.id);
      expect((await readCache(dir)).activities).toEqual([]);
    });
  });

  describe("syncRecent", () => {
    function stravaWithPages(pages: Record<number, unknown[]>, ftp = 260) {
      const afters: number[] = [];
      const stub = fakeFetch({
        [`${API_URL}/athlete/activities`]: (url) => {
          afters.push(Number(url.searchParams.get("after")));
          expect(url.searchParams.get("per_page")).toBe(String(PAGE_SIZE));
          return json(pages[Number(url.searchParams.get("page"))] ?? []);
        },
        [`${API_URL}/athlete`]: () => json({ id: ATHLETE_ID, ftp }),
      });
      return { ...stub, afters };
    }

    it("backfills the whole window page by page when the cache is empty", async () => {
      const second = { ...rawRide, id: 2, start_date: "2026-09-16T05:00:00Z" };
      const strava = stravaWithPages({ 1: [rawRide], 2: [second] });
      const report = await syncRecent(ctx(strava.fetchFn));
      expect(report).toEqual({ fetched: 2, total: 2 });
      expect(strava.afters[0]).toBe(
        Math.floor((now.getTime() - KEEP_DAYS * 86_400_000) / 1000),
      );
      const cache = await readCache(dir);
      expect(cache.activities.map((a) => a.id)).toEqual([2, rawRide.id]);
      expect(cache.ftp).toBe(260);
      expect(cache.syncedAt).toBe(now.toISOString());
    });

    it("re-reads a week before the newest cached activity", async () => {
      const strava = stravaWithPages({ 1: [rawRide] });
      await syncRecent(ctx(strava.fetchFn));
      await syncRecent(ctx(strava.fetchFn));
      const newest = Date.parse(rawRide.start_date) / 1000;
      expect(strava.afters.at(-2)).toBe(newest - OVERLAP_DAYS * 86_400);
      expect((await readCache(dir)).activities).toHaveLength(1);
    });

    it("prunes what fell out of the window and forgets a removed FTP", async () => {
      const old = {
        ...rawRide,
        id: 9,
        start_date: new Date(
          now.getTime() - (KEEP_DAYS + 5) * 86_400_000,
        ).toISOString(),
      };
      await writeCache(dir, {
        ...emptyCache,
        ftp: 260,
        activities: [
          activity({
            id: 9,
            startedAt: old.start_date,
          }),
        ],
      });
      const strava = stravaWithPages({ 1: [rawRide] }, 0);
      const report = await syncRecent(ctx(strava.fetchFn));
      expect(report.total).toBe(1);
      const cache = await readCache(dir);
      expect(cache.activities.map((a) => a.id)).toEqual([rawRide.id]);
      expect(cache.ftp).toBeNull();
    });
  });
});
