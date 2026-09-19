import { describe, expect, it } from "vitest";
import { activity, ride } from "../strava/fixtures";
import { rideRequest } from "./fixtures";
import {
  intensityOf,
  maxHeartRateOf,
  requestFor,
  sameRequest,
  sportTypeFor,
  temperatureFor,
  whyNoPlan,
} from "./request";

describe("sportTypeFor", () => {
  it("maps every kind of ride to bike, runs to running, swims to swimming", () => {
    expect(sportTypeFor("Ride")).toBe("bike");
    expect(sportTypeFor("GravelRide")).toBe("bike");
    expect(sportTypeFor("VirtualRide")).toBe("bike");
    expect(sportTypeFor("TrailRun")).toBe("running");
    expect(sportTypeFor("Swim")).toBe("swimming");
  });

  it("has no sport for what Fuelivo has no plan for", () => {
    expect(sportTypeFor("Hike")).toBeNull();
    expect(sportTypeFor("WeightTraining")).toBeNull();
    expect(sportTypeFor("")).toBeNull();
  });
});

describe("whyNoPlan", () => {
  it("names the sport first, then the duration", () => {
    expect(whyNoPlan(ride)).toBeNull();
    expect(whyNoPlan(activity({ sport: "Hike" }))).toBe("sport");
    expect(whyNoPlan(activity({ sport: "Hike", movingTime: 600 }))).toBe(
      "sport",
    );
    expect(whyNoPlan(activity({ movingTime: 1799 }))).toBe("duration");
    expect(whyNoPlan(activity({ movingTime: 1800 }))).toBeNull();
    expect(whyNoPlan(activity({ movingTime: 25 * 3600 }))).toBe("duration");
  });
});

describe("intensityOf", () => {
  it("grades heart rate against the maximum", () => {
    expect(intensityOf(activity({ averageHeartRate: 130 }), 194)).toBe("easy");
    expect(intensityOf(ride, 194)).toBe("moderate");
    expect(intensityOf(activity({ averageHeartRate: 166 }), 194)).toBe("hard");
  });

  it("falls back to relative effort per hour without heart rate or maximum", () => {
    const noHeart = { averageHeartRate: null, movingTime: 3600 };
    expect(intensityOf(activity({ ...noHeart, relativeEffort: 20 }), 194)).toBe(
      "easy",
    );
    expect(intensityOf(activity({ ...noHeart, relativeEffort: 50 }), 194)).toBe(
      "moderate",
    );
    expect(intensityOf(activity({ ...noHeart, relativeEffort: 90 }), 194)).toBe(
      "hard",
    );
    expect(intensityOf(activity({ relativeEffort: 90 }), null)).toBe("easy");
  });

  it("is moderate when nothing says otherwise", () => {
    expect(
      intensityOf(
        activity({ averageHeartRate: null, relativeEffort: null }),
        194,
      ),
    ).toBe("moderate");
  });
});

describe("maxHeartRateOf", () => {
  it("is the highest maximum of any activity, null without one", () => {
    expect(
      maxHeartRateOf([
        activity({ maxHeartRate: 176 }),
        activity({ maxHeartRate: null }),
        activity({ maxHeartRate: 194 }),
      ]),
    ).toBe(194);
    expect(maxHeartRateOf([activity({ maxHeartRate: null })])).toBeNull();
    expect(maxHeartRateOf([])).toBeNull();
  });
});

describe("temperatureFor", () => {
  it("rounds to whole degrees inside Fuelivo's range, 20 without a reading", () => {
    expect(temperatureFor(17.4)).toBe(17);
    expect(temperatureFor(-3)).toBe(0);
    expect(temperatureFor(44)).toBe(40);
    expect(temperatureFor(null)).toBe(20);
  });
});

describe("requestFor", () => {
  it("maps the fixture ride to the fixture request", () => {
    expect(requestFor(ride, 194)).toEqual(rideRequest);
  });

  it("is null for an activity without a plan", () => {
    expect(requestFor(activity({ sport: "Yoga" }), 194)).toBeNull();
    expect(requestFor(activity({ movingTime: 900 }), 194)).toBeNull();
  });

  it("takes 20 degrees for a cached activity without the temperature field", () => {
    const { averageTemp: _omitted, ...before } = ride;
    void _omitted;
    expect(requestFor(before as typeof ride, 194)?.temperature_c).toBe(20);
  });
});

describe("sameRequest", () => {
  it("compares every field", () => {
    expect(sameRequest(rideRequest, { ...rideRequest })).toBe(true);
    expect(
      sameRequest(rideRequest, { ...rideRequest, intensity: "hard" }),
    ).toBe(false);
    expect(
      sameRequest(rideRequest, { ...rideRequest, temperature_c: 18 }),
    ).toBe(false);
  });
});
