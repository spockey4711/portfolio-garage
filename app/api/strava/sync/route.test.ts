import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const syncRecent = vi.fn();
vi.mock("@/lib/strava/sync", () => ({
  syncRecent: (...args: unknown[]) => syncRecent(...args),
}));

const URL = "http://127.0.0.1:3010/api/strava/sync";

function post(authorization?: string) {
  return POST(
    new Request(URL, {
      method: "POST",
      headers: authorization ? { authorization } : {},
    }),
  );
}

describe("POST /api/strava/sync", () => {
  beforeEach(() => {
    vi.stubEnv("STRAVA_SYNC_SECRET", "cron-secret");
    vi.stubEnv("STRAVA_CLIENT_ID", "42");
    vi.stubEnv("STRAVA_CLIENT_SECRET", "s3cret");
    vi.stubEnv("DATA_DIR", "/data");
    syncRecent.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("runs the sync for the right bearer and reports", async () => {
    syncRecent.mockResolvedValue({ fetched: 3, total: 120 });
    const response = await post("Bearer cron-secret");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ fetched: 3, total: 120 });
    expect(syncRecent).toHaveBeenCalledWith({
      dataDir: "/data",
      app: { clientId: "42", clientSecret: "s3cret" },
    });
  });

  it("refuses without or with a wrong secret, without syncing", async () => {
    expect((await post()).status).toBe(401);
    expect((await post("Bearer wrong")).status).toBe(401);
    expect((await post("Bearer cron-secret-but-longer")).status).toBe(401);
    expect(syncRecent).not.toHaveBeenCalled();
  });

  it("turns a failed sync into a 502 the cron can see", async () => {
    syncRecent.mockRejectedValue(new Error("Strava API /athlete answered 500"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await post("Bearer cron-secret");
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: "Strava API /athlete answered 500",
    });
    error.mockRestore();
  });
});
