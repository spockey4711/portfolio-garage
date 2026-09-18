import { describe, expect, it } from "vitest";
import { DRIVE_MAX_S, DRIVE_MIN_S, driveDuration, easeInOut } from "./camera";
import { REST_VIEW, views } from "./hotspots";

describe("driveDuration", () => {
  it("stays within the 1.0 to 1.2 s window of the concept", () => {
    expect(driveDuration(0)).toBe(DRIVE_MIN_S);
    expect(driveDuration(100)).toBe(DRIVE_MAX_S);
    expect(driveDuration(-1)).toBe(DRIVE_MIN_S);
  });

  it("gives every drive from the rest position a duration in that window", () => {
    const [rx, ry, rz] = views[REST_VIEW].camera;
    for (const view of Object.values(views)) {
      const [x, y, z] = view.camera;
      const distance = Math.hypot(x - rx, y - ry, z - rz);
      const duration = driveDuration(distance);
      expect(duration, view.id).toBeGreaterThanOrEqual(DRIVE_MIN_S);
      expect(duration, view.id).toBeLessThanOrEqual(DRIVE_MAX_S);
    }
  });
});

describe("easeInOut", () => {
  it("clamps and hits the end points", () => {
    expect(easeInOut(-1)).toBe(0);
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(0.5)).toBe(0.5);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(2)).toBe(1);
  });

  it("starts and ends slow, is monotonic", () => {
    expect(easeInOut(0.1)).toBeLessThan(0.1);
    expect(easeInOut(0.9)).toBeGreaterThan(0.9);
    let last = 0;
    for (let i = 1; i <= 100; i++) {
      const value = easeInOut(i / 100);
      expect(value).toBeGreaterThan(last);
      last = value;
    }
  });
});
