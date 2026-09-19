import { afterEach, describe, expect, it, vi } from "vitest";
import { fakeFetch, json } from "../strava/fixtures";
import {
  calculatePlan,
  FUELIVO_URL,
  InvalidPlanError,
  planFromResponse,
} from "./client";
import { plan, rawPlan, rideRequest } from "./fixtures";

const calculatedAt = new Date("2026-09-18T10:00:00Z");

describe("planFromResponse", () => {
  it("keeps the per-hour values, totals, timing, rationale and warnings", () => {
    expect(planFromResponse(rawPlan, rideRequest, calculatedAt)).toEqual(plan);
  });

  it("does without warnings", () => {
    const { warnings: _omitted, ...bare } = rawPlan;
    void _omitted;
    expect(planFromResponse(bare, rideRequest, calculatedAt).warnings).toEqual(
      [],
    );
  });

  it("rejects an answer without the values the computer shows", () => {
    expect(() =>
      planFromResponse(
        { ...rawPlan, carbs_per_hour_g: "65" },
        rideRequest,
        calculatedAt,
      ),
    ).toThrow(InvalidPlanError);
    expect(() =>
      planFromResponse(
        { ...rawPlan, during_ride_nutrition: null },
        rideRequest,
        calculatedAt,
      ),
    ).toThrow(InvalidPlanError);
    expect(() => planFromResponse(null, rideRequest, calculatedAt)).toThrow(
      InvalidPlanError,
    );
  });
});

describe("calculatePlan", () => {
  afterEach(() => vi.restoreAllMocks());

  it("posts the request as JSON and returns the plan", async () => {
    let body: unknown;
    const { fetchFn, calls } = fakeFetch({
      [FUELIVO_URL]: (_url, init) => {
        body = JSON.parse(String(init?.body));
        expect(init?.method).toBe("POST");
        return json(rawPlan);
      },
    });
    expect(
      await calculatePlan(rideRequest, fetchFn, () => calculatedAt),
    ).toEqual(plan);
    expect(calls.map(String)).toEqual([FUELIVO_URL]);
    expect(body).toEqual(rideRequest);
  });

  it("answers null, not an error, when Fuelivo does not deliver", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const refused = fakeFetch({ [FUELIVO_URL]: () => json({}, 422) });
    expect(await calculatePlan(rideRequest, refused.fetchFn)).toBeNull();
    const garbled = fakeFetch({ [FUELIVO_URL]: () => json({ phase: "x" }) });
    expect(await calculatePlan(rideRequest, garbled.fetchFn)).toBeNull();
    const down = (async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch;
    expect(await calculatePlan(rideRequest, down)).toBeNull();
    expect(console.warn).toHaveBeenCalledTimes(3);
  });
});
