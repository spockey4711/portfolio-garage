// Pure timing for the camera drives (docs/KONZEPT.md §3: 1.0 to 1.2 s,
// ease-in-out). CameraRig.tsx applies it per frame; this file has no three.js
// in it so the numbers stay testable.

/** Shortest and longest drive in seconds; the distance picks a point between. */
export const DRIVE_MIN_S = 1.0;
export const DRIVE_MAX_S = 1.2;

/** A drive this long (in metres) or longer takes the full DRIVE_MAX_S. */
const FULL_LENGTH_M = 4;

export function driveDuration(distanceM: number): number {
  const t = Math.min(Math.max(distanceM / FULL_LENGTH_M, 0), 1);
  return DRIVE_MIN_S + (DRIVE_MAX_S - DRIVE_MIN_S) * t;
}

/** Cubic ease-in-out on 0..1, clamped. */
export function easeInOut(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
