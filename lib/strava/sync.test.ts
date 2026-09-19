import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FUELIVO_URL } from "../fuelivo/client";
import { plan, rawPlan, rideRequest } from "../fuelivo/fixtures";
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

  /** fuelivo.de answering the fixture plan and recording every request body. */
  function fuelivo(status = 200) {
    const requests: unknown[] = [];
    const routes = {
      [FUELIVO_URL]: (_url: URL, init?: RequestInit) => {
        requests.push(JSON.parse(String(init?.body)));
        return json(status === 200 ? rawPlan : {}, status);
      },
    };
    return { requests, routes };
  }

  describe("syncActivity", () => {
    it("fetches the activity with the token, stores it and asks Fuelivo for its plan", async () => {
      const { requests, routes } = fuelivo();
      const { fetchFn, calls } = fakeFetch({
        [`${API_URL}/activities/${rawRide.id}`]: () => json(rawRide),
        ...routes,
      });
      expect(await syncActivity(ctx(fetchFn), rawRide.id)).toBe("stored");
      const cache = await readCache(dir);
      expect(cache.activities.map((a) => a.id)).toEqual([rawRide.id]);
      expect(cache.plans[rawRide.id]).toEqual({
        ...plan,
        calculatedAt: now.toISOString(),
      });
      expect(calls).toHaveLength(2);
      // The maximum heart rate comes from the cache: here only this ride's 176.
      expect(requests).toEqual([rideRequest]);
    });

    it("keeps a plan whose input has not changed and replaces one whose input has", async () => {
      const { requests, routes } = fuelivo();
      const { fetchFn } = fakeFetch({
        [`${API_URL}/activities/${rawRide.id}`]: () => json(rawRide),
        ...routes,
      });
      await syncActivity(ctx(fetchFn), rawRide.id);
      await syncActivity(ctx(fetchFn), rawRide.id);
      expect(requests).toHaveLength(1);

      const warmer = fakeFetch({
        [`${API_URL}/activities/${rawRide.id}`]: () =>
          json({ ...rawRide, average_temp: 31 }),
        ...routes,
      });
      await syncActivity(ctx(warmer.fetchFn), rawRide.id);
      expect(requests).toHaveLength(2);
      expect(
        (await readCache(dir)).plans[rawRide.id]?.input.temperature_c,
      ).toBe(31);
    });

    it("stores the activity without a plan when Fuelivo has none or does not answer", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const hike = fakeFetch({
        [`${API_URL}/activities/`]: () =>
          json({ ...rawRide, sport_type: "Hike" }),
        ...fuelivo().routes,
      });
      await syncActivity(ctx(hike.fetchFn), rawRide.id);
      expect(hike.calls).toHaveLength(1);

      const down = fakeFetch({
        [`${API_URL}/activities/`]: () => json(rawRide),
        ...fuelivo(503).routes,
      });
      expect(await syncActivity(ctx(down.fetchFn), rawRide.id)).toBe("stored");
      expect((await readCache(dir)).plans).toEqual({});
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
        ...fuelivo().routes,
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
      // Only the newest activity gets a plan: it is the one the computer shows.
      expect(Object.keys(cache.plans)).toEqual(["2"]);
    });

    it("asks Fuelivo for the newest visible activity, not a private one", async () => {
      const secret = {
        ...rawRide,
        id: 2,
        private: true,
        start_date: "2026-09-16T05:00:00Z",
      };
      const strava = stravaWithPages({ 1: [rawRide, secret] });
      await syncRecent(ctx(strava.fetchFn));
      expect(Object.keys((await readCache(dir)).plans)).toEqual([
        String(rawRide.id),
      ]);
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
