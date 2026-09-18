import { describe, expect, it } from "vitest";
import { SOFT_CLIP_KNEE, softClip } from "./softclip";

describe("softClip", () => {
  it("leaves everything below the knee untouched", () => {
    for (const value of [0, 0.02, 0.15, 0.4, SOFT_CLIP_KNEE]) {
      expect(softClip(value)).toBe(value);
    }
  });

  it("compresses everything above the knee below 1 and keeps the order", () => {
    const values = [0.9, 1.0, 1.5, 2.0, 4.0];
    const clipped = values.map((v) => softClip(v));
    for (const c of clipped) expect(c).toBeLessThan(1);
    for (let i = 1; i < clipped.length; i++) {
      expect(clipped[i]).toBeGreaterThan(clipped[i - 1]);
    }
    expect(softClip(40)).toBeLessThanOrEqual(1);
  });

  it("joins the two halves without a kink", () => {
    const h = 1e-4;
    const below = (softClip(SOFT_CLIP_KNEE) - softClip(SOFT_CLIP_KNEE - h)) / h;
    const above = (softClip(SOFT_CLIP_KNEE + h) - softClip(SOFT_CLIP_KNEE)) / h;
    expect(below).toBeCloseTo(1, 3);
    expect(above).toBeCloseTo(1, 3);
  });
});
