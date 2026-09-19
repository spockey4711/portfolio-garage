import { describe, expect, it } from "vitest";
import {
  activityFromStrava,
  InvalidActivityError,
  zoneFromStravaTimezone,
} from "./activity";
import { rawRide, ride } from "./fixtures";

describe("activityFromStrava", () => {
  it("keeps the bike computer's fields and drops the location", () => {
    const parsed = activityFromStrava(rawRide);
    expect(parsed).toEqual(ride);
    expect(JSON.stringify(parsed)).not.toContain("latlng");
  });

  it("strips the false Z from the local start", () => {
    expect(activityFromStrava(rawRide).startedAtLocal).toBe(
      "2026-09-15T07:42:10",
    );
  });

  it("handles a ride without power, heart rate or temperature", () => {
    const parsed = activityFromStrava({
      ...rawRide,
      average_watts: undefined,
      weighted_average_watts: undefined,
      kilojoules: undefined,
      device_watts: undefined,
      has_heartrate: false,
      average_heartrate: undefined,
      max_heartrate: undefined,
      suffer_score: undefined,
      total_elevation_gain: undefined,
      average_temp: undefined,
    });
    expect(parsed.averageWatts).toBeNull();
    expect(parsed.normalizedWatts).toBeNull();
    expect(parsed.powerFromMeter).toBeNull();
    expect(parsed.averageHeartRate).toBeNull();
    expect(parsed.relativeEffort).toBeNull();
    expect(parsed.averageTemp).toBeNull();
    expect(parsed.elevationGain).toBe(0);
  });

  it("tells estimated power from a meter", () => {
    expect(
      activityFromStrava({ ...rawRide, device_watts: false }).powerFromMeter,
    ).toBe(false);
  });

  it("rejects an object without the required fields", () => {
    expect(() => activityFromStrava({ ...rawRide, id: "x" })).toThrow(
      InvalidActivityError,
    );
    expect(() => activityFromStrava({ ...rawRide, athlete: null })).toThrow(
      InvalidActivityError,
    );
    expect(() => activityFromStrava(null)).toThrow(InvalidActivityError);
    expect(() => activityFromStrava([rawRide])).toThrow(InvalidActivityError);
  });
});

describe("zoneFromStravaTimezone", () => {
  it("takes the IANA zone after the offset", () => {
    expect(zoneFromStravaTimezone("(GMT+01:00) Europe/Berlin")).toBe(
      "Europe/Berlin",
    );
    expect(zoneFromStravaTimezone("(GMT-08:00) America/Los_Angeles")).toBe(
      "America/Los_Angeles",
    );
  });

  it("falls back to UTC for anything else", () => {
    expect(zoneFromStravaTimezone("")).toBe("UTC");
    expect(zoneFromStravaTimezone("(GMT+00:00) UTC")).toBe("UTC");
  });
});
