import { describe, expect, it } from "vitest";
import { type ActivityCache, emptyCache, upsertActivity } from "./cache";
import { activity, ride } from "./fixtures";
import {
  localDay,
  mondayOf,
  summarize,
  toPublic,
  trainingStress,
} from "./summary";

// 2026-09-18 is a Friday; the week runs 14.09. to 20.09.
const friday = new Date("2026-09-18T10:00:00Z");

function cacheOf(
  activities: readonly Parameters<typeof activity>[0][],
  ftp: number | null = 260,
): ActivityCache {
  return {
    ...activities.map(activity).reduce(upsertActivity, emptyCache),
    ftp,
    syncedAt: "2026-09-18T09:00:00.000Z",
  };
}

describe("localDay", () => {
  it("takes the calendar day in the zone, not in UTC", () => {
    expect(localDay(new Date("2026-09-18T22:30:00Z"), "Europe/Berlin")).toBe(
      "2026-09-19",
    );
    expect(localDay(new Date("2026-01-18T23:30:00Z"), "Europe/Berlin")).toBe(
      "2026-01-19",
    );
    expect(localDay(new Date("2026-09-18T22:30:00Z"), "UTC")).toBe(
      "2026-09-18",
    );
  });
});

describe("mondayOf", () => {
  it("finds the Monday of the ISO week", () => {
    expect(mondayOf("2026-09-18")).toBe("2026-09-14");
    expect(mondayOf("2026-09-14")).toBe("2026-09-14");
    expect(mondayOf("2026-09-20")).toBe("2026-09-14");
    expect(mondayOf("2026-01-01")).toBe("2025-12-29");
  });
});

describe("trainingStress", () => {
  it("is hours times intensity squared times 100", () => {
    // One hour at FTP is 100 TSS by definition.
    expect(
      trainingStress({ movingTime: 3600, normalizedWatts: 260 }, 260),
    ).toBe(100);
    expect(trainingStress(ride, 260)).toBe(220);
  });

  it("is null without power or FTP", () => {
    expect(
      trainingStress({ movingTime: 3600, normalizedWatts: null }, 260),
    ).toBe(null);
    expect(trainingStress(ride, null)).toBe(null);
    expect(trainingStress(ride, 0)).toBe(null);
  });
});

describe("toPublic", () => {
  it("carries no athlete id and no privacy flag", () => {
    const pub = toPublic(ride, 260);
    expect(pub).not.toHaveProperty("athleteId");
    expect(pub).not.toHaveProperty("isPrivate");
    expect(pub.tss).toBe(220);
  });
});

describe("summarize", () => {
  it("is empty but well-formed before the first sync", () => {
    const summary = summarize(emptyCache, friday);
    expect(summary.syncedAt).toBeNull();
    expect(summary.latest).toBeNull();
    expect(summary.week.start).toBe("2026-09-14");
    expect(summary.week.count).toBe(0);
    expect(summary.week.tss).toBeNull();
    expect(summary.week.days).toHaveLength(7);
    expect(summary.week.days[6].date).toBe("2026-09-20");
  });

  it("sums the running week by local day and names the latest", () => {
    const cache = cacheOf([
      {
        id: 1,
        startedAt: "2026-09-13T08:00:00Z",
        startedAtLocal: "2026-09-13T10:00:00",
        movingTime: 3600,
        distance: 30000,
        elevationGain: 100,
      },
      {
        id: 2,
        startedAt: "2026-09-15T05:42:10Z",
        startedAtLocal: "2026-09-15T07:42:10",
      },
      {
        id: 3,
        startedAt: "2026-09-17T16:00:00Z",
        startedAtLocal: "2026-09-17T18:00:00",
        movingTime: 1800,
        distance: 12000,
        elevationGain: 50,
        normalizedWatts: null,
      },
      {
        id: 4,
        startedAt: "2026-09-17T18:00:00Z",
        startedAtLocal: "2026-09-17T20:00:00",
        movingTime: 600,
        distance: 3000,
        elevationGain: 0,
        normalizedWatts: null,
      },
    ]);
    const { latest, week } = summarize(cache, friday);
    expect(latest?.id).toBe(4);
    expect(week.count).toBe(3);
    expect(week.movingTime).toBe(10980 + 1800 + 600);
    expect(week.distance).toBe(84213.5 + 12000 + 3000);
    expect(week.elevationGain).toBe(912 + 50);
    expect(week.tss).toBe(220);
    expect(week.days.map((d) => d.count)).toEqual([0, 1, 0, 2, 0, 0, 0]);
    expect(week.days[3].movingTime).toBe(2400);
  });

  it("counts a ride by its own local day, late in the evening", () => {
    // Started 23:30 local on Sunday the 13th: last week, even though UTC is
    // already Monday for a ride in New Zealand.
    const cache = cacheOf([
      {
        id: 1,
        startedAt: "2026-09-13T11:30:00Z",
        startedAtLocal: "2026-09-13T23:30:00",
      },
      {
        id: 2,
        startedAt: "2026-09-20T22:30:00Z",
        startedAtLocal: "2026-09-20T23:30:00",
      },
    ]);
    expect(summarize(cache, friday).week.count).toBe(1);
  });

  it("never serves a private activity", () => {
    const cache = cacheOf([
      {
        id: 1,
        startedAt: "2026-09-17T06:00:00Z",
        startedAtLocal: "2026-09-17T08:00:00",
        isPrivate: true,
      },
      {
        id: 2,
        startedAt: "2026-09-15T06:00:00Z",
        startedAtLocal: "2026-09-15T08:00:00",
      },
    ]);
    const summary = summarize(cache, friday);
    expect(summary.latest?.id).toBe(2);
    expect(summary.week.count).toBe(1);
    expect(JSON.stringify(summary)).not.toContain('"id":1');
  });

  it("has no TSS without an FTP on Strava", () => {
    const cache = cacheOf(
      [
        {
          id: 1,
          startedAt: "2026-09-15T06:00:00Z",
          startedAtLocal: "2026-09-15T08:00:00",
        },
      ],
      null,
    );
    const summary = summarize(cache, friday);
    expect(summary.latest?.tss).toBeNull();
    expect(summary.week.tss).toBeNull();
  });
});
