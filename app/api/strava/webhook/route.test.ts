import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

// The response must not wait for Strava: after() runs the handler once the
// response is out. The mock runs it right away and lets the test await it.
const scheduled: Promise<unknown>[] = [];
vi.mock("next/server", () => ({
  after: (callback: () => Promise<unknown>) => {
    scheduled.push(callback());
  },
}));

const handleEvent = vi.fn<() => Promise<void>>();
vi.mock("@/lib/strava/webhook", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/strava/webhook")>()),
  handleEvent: (...args: unknown[]) => handleEvent(...(args as [])),
}));

const BASE = "http://garage.test/api/strava/webhook";

describe("GET /api/strava/webhook", () => {
  beforeEach(() => vi.stubEnv("STRAVA_VERIFY_TOKEN", "geheim"));
  afterEach(() => vi.unstubAllEnvs());

  it("answers Strava's validation with the challenge", async () => {
    const response = await GET(
      new Request(
        `${BASE}?hub.mode=subscribe&hub.verify_token=geheim&hub.challenge=abc`,
      ),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ "hub.challenge": "abc" });
  });

  it("refuses a wrong verify token", async () => {
    const response = await GET(
      new Request(
        `${BASE}?hub.mode=subscribe&hub.verify_token=nope&hub.challenge=abc`,
      ),
    );
    expect(response.status).toBe(403);
  });
});

describe("POST /api/strava/webhook", () => {
  beforeEach(() => {
    vi.stubEnv("STRAVA_CLIENT_ID", "42");
    vi.stubEnv("STRAVA_CLIENT_SECRET", "s3cret");
    vi.stubEnv("DATA_DIR", "/nonexistent");
    handleEvent.mockReset();
    scheduled.length = 0;
  });
  afterEach(() => vi.unstubAllEnvs());

  const event = {
    aspect_type: "create",
    event_time: 1758190000,
    object_id: 1234567890,
    object_type: "activity",
    owner_id: 4711,
    subscription_id: 1,
    updates: {},
  };

  it("acknowledges the event and handles it afterwards", async () => {
    handleEvent.mockResolvedValue(undefined);
    const response = await POST(
      new Request(BASE, { method: "POST", body: JSON.stringify(event) }),
    );
    expect(response.status).toBe(200);
    await Promise.all(scheduled);
    expect(handleEvent).toHaveBeenCalledWith(
      {
        dataDir: "/nonexistent",
        app: { clientId: "42", clientSecret: "s3cret" },
      },
      {
        objectType: "activity",
        objectId: 1234567890,
        aspect: "create",
        ownerId: 4711,
      },
    );
  });

  it("logs a failed handler instead of throwing after the response", async () => {
    handleEvent.mockRejectedValue(new Error("Strava down"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    await POST(
      new Request(BASE, { method: "POST", body: JSON.stringify(event) }),
    );
    await Promise.all(scheduled);
    expect(error).toHaveBeenCalledWith(
      "Strava webhook create 1234567890 failed",
      expect.any(Error),
    );
    error.mockRestore();
  });

  it("rejects a body that is not an event", async () => {
    expect(
      (await POST(new Request(BASE, { method: "POST", body: "{}" }))).status,
    ).toBe(400);
    expect(
      (await POST(new Request(BASE, { method: "POST", body: "not json" })))
        .status,
    ).toBe(400);
    expect(handleEvent).not.toHaveBeenCalled();
  });
});
