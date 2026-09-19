import type { Activity } from "../strava/activity.ts";

// A Strava activity as the input of fuelivo.de/calculate (docs/adr/0008):
// the ride is the demo input, the plan is what the bike computer shows.
// The shape is CalculationRequest from app/schemas/fueling.py in the Fuelivo
// repo, reduced to the fields the mapping sets; everything else keeps its
// default there. Pure functions, no I/O: the client (client.ts) sends the
// request, the sync (lib/strava/sync.ts) decides when.
//
// Same rules as lib/strava/: relative imports with the .ts extension, no
// enum, no @/ alias, because scripts/strava.mts runs this on plain Node.

export type SportType = "bike" | "running" | "swimming";
export type Intensity = "easy" | "moderate" | "hard";

export interface CalculationRequest {
  /** Fuelivo accepts 0.5 to 24 hours. */
  readonly duration_hours: number;
  readonly intensity: Intensity;
  readonly sport_type: SportType;
  readonly session_type: "training";
  /** Whole degrees, 0 to 40. */
  readonly temperature_c: number;
}

/** Fuelivo's limits on the request; outside them there is no plan. */
export const DURATION_HOURS = { min: 0.5, max: 24 } as const;
export const TEMPERATURE_C = { min: 0, max: 40, default: 20 } as const;

/**
 * Average heart rate as a share of the maximum: below `easy` counts as
 * easy, from `hard` on as hard. Between is moderate, the bulk of training.
 */
export const HEART_RATE_SHARE = { easy: 0.7, hard: 0.85 } as const;

/**
 * Without heart rate the intensity comes from Strava's relative effort per
 * hour; the thresholds mirror the heart-rate ones for a typical ride.
 */
export const EFFORT_PER_HOUR = { easy: 30, hard: 80 } as const;

const sportTypes: ReadonlyMap<string, SportType> = new Map([
  ["Ride", "bike"],
  ["VirtualRide", "bike"],
  ["GravelRide", "bike"],
  ["MountainBikeRide", "bike"],
  ["EBikeRide", "bike"],
  ["EMountainBikeRide", "bike"],
  ["Handcycle", "bike"],
  ["Velomobile", "bike"],
  ["Run", "running"],
  ["TrailRun", "running"],
  ["VirtualRun", "running"],
  ["Swim", "swimming"],
]);

/** Fuelivo's sport for a Strava sport type; null for a sport it has no plan for. */
export function sportTypeFor(sport: string): SportType | null {
  return sportTypes.get(sport) ?? null;
}

export type NoPlanReason = "sport" | "duration";

/**
 * Why an activity gets no plan, decidable from the activity alone: a sport
 * Fuelivo does not cover, or a duration outside its range. Null when a plan
 * is possible.
 */
export function whyNoPlan(
  activity: Pick<Activity, "sport" | "movingTime">,
): NoPlanReason | null {
  if (sportTypeFor(activity.sport) === null) return "sport";
  const hours = activity.movingTime / 3600;
  if (hours < DURATION_HOURS.min || hours > DURATION_HOURS.max)
    return "duration";
  return null;
}

/**
 * The intensity of an activity: heart rate relative to the athlete's
 * maximum where both are known, otherwise relative effort per hour, and
 * moderate when there is neither.
 */
export function intensityOf(
  activity: Pick<
    Activity,
    "averageHeartRate" | "relativeEffort" | "movingTime"
  >,
  maxHeartRate: number | null,
): Intensity {
  if (activity.averageHeartRate !== null && maxHeartRate) {
    return grade(activity.averageHeartRate / maxHeartRate, HEART_RATE_SHARE);
  }
  if (activity.relativeEffort !== null && activity.movingTime > 0) {
    return grade(
      activity.relativeEffort / (activity.movingTime / 3600),
      EFFORT_PER_HOUR,
    );
  }
  return "moderate";
}

function grade(
  value: number,
  limits: { readonly easy: number; readonly hard: number },
): Intensity {
  if (value < limits.easy) return "easy";
  if (value >= limits.hard) return "hard";
  return "moderate";
}

/**
 * The athlete's maximum heart rate as the cache has seen it: the highest
 * maximum of any activity. Strava's athlete profile does not carry one, and
 * over a year of rides the observed peak is close to the true maximum.
 */
export function maxHeartRateOf(
  activities: readonly Pick<Activity, "maxHeartRate">[],
): number | null {
  let max: number | null = null;
  for (const activity of activities) {
    if (activity.maxHeartRate !== null && activity.maxHeartRate > (max ?? 0))
      max = activity.maxHeartRate;
  }
  return max;
}

/** The request for an activity, or null when Fuelivo has no plan for it. */
export function requestFor(
  activity: Activity,
  maxHeartRate: number | null,
): CalculationRequest | null {
  const sportType = sportTypeFor(activity.sport);
  if (sportType === null || whyNoPlan(activity) !== null) return null;
  return {
    duration_hours: Math.round((activity.movingTime / 3600) * 100) / 100,
    intensity: intensityOf(activity, maxHeartRate),
    sport_type: sportType,
    session_type: "training",
    temperature_c: temperatureFor(activity.averageTemp ?? null),
  };
}

/** Whole degrees inside Fuelivo's range; without a reading, its default. */
export function temperatureFor(averageTemp: number | null): number {
  if (averageTemp === null) return TEMPERATURE_C.default;
  return Math.min(
    TEMPERATURE_C.max,
    Math.max(TEMPERATURE_C.min, Math.round(averageTemp)),
  );
}

export function sameRequest(
  a: CalculationRequest,
  b: CalculationRequest,
): boolean {
  return (
    a.duration_hours === b.duration_hours &&
    a.intensity === b.intensity &&
    a.sport_type === b.sport_type &&
    a.session_type === b.session_type &&
    a.temperature_c === b.temperature_c
  );
}
