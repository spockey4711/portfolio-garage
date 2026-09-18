import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptyCache, writeCache } from "@/lib/strava/cache";
import { activity } from "@/lib/strava/fixtures";
import { GET } from "./route";

describe("GET /api/activity", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "garage-activity-"));
    vi.stubEnv("DATA_DIR", dir);
  });
  afterEach(async () => {
    vi.unstubAllEnvs();
    await rm(dir, { recursive: true, force: true });
  });

  it("serves an empty summary before the first sync", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("public, max-age=60");
    const body = await response.json();
    expect(body.latest).toBeNull();
    expect(body.week.days).toHaveLength(7);
  });

  it("serves the public summary of the cache", async () => {
    await writeCache(dir, {
      ...emptyCache,
      syncedAt: "2026-09-18T09:00:00.000Z",
      ftp: 260,
      activities: [
        activity({ id: 2, isPrivate: true, name: "Geheim" }),
        activity({ id: 1, startedAt: "2026-09-14T05:00:00Z" }),
      ],
    });
    const body = await (await GET()).json();
    expect(body.syncedAt).toBe("2026-09-18T09:00:00.000Z");
    expect(body.latest.id).toBe(1);
    expect(body.latest.tss).toBe(220);
    expect(JSON.stringify(body)).not.toContain("Geheim");
    expect(JSON.stringify(body)).not.toContain("athleteId");
  });
});
