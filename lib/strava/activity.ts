// The garage's own activity record: the fields the bike computer shows
// (docs/KONZEPT.md §3) and nothing that locates a ride. Strava's summary and
// detailed activity objects both map onto it, so the webhook path (one
// detailed activity) and the polling path (a page of summaries) write the
// same shape. Parsing is by hand: the API is stable and there is no schema
// dependency (CLAUDE.md, no new dependencies without asking).

export interface Activity {
  readonly id: number;
  /** Strava's athlete id; a fetched activity must belong to the athlete of the token. */
  readonly athleteId: number;
  readonly name: string;
  /** Strava sport type, e.g. "Ride", "VirtualRide", "GravelRide", "Run". */
  readonly sport: string;
  /** Start in UTC, ISO 8601. */
  readonly startedAt: string;
  /** Start in the activity's local time, ISO 8601 without a zone. */
  readonly startedAtLocal: string;
  /** IANA zone of the start, e.g. "Europe/Berlin". */
  readonly timezone: string;
  /** Seconds. */
  readonly movingTime: number;
  /** Seconds. */
  readonly elapsedTime: number;
  /** Metres. */
  readonly distance: number;
  /** Metres. */
  readonly elevationGain: number;
  readonly averageHeartRate: number | null;
  readonly maxHeartRate: number | null;
  readonly averageWatts: number | null;
  /** Strava's weighted average power, the normalized power of the ride. */
  readonly normalizedWatts: number | null;
  /** Power from a meter, not Strava's estimate; null when there is no power at all. */
  readonly powerFromMeter: boolean | null;
  readonly kilojoules: number | null;
  /** Strava's relative effort ("suffer score"), heart-rate based. */
  readonly relativeEffort: number | null;
  /** Mean temperature in °C from the head unit; null without a sensor. */
  readonly averageTemp: number | null;
  readonly trainer: boolean;
  readonly commute: boolean;
  /** Private on Strava: kept in the cache, never served by the public API. */
  readonly isPrivate: boolean;
}

export class InvalidActivityError extends Error {
  constructor(field: string) {
    super(`Strava activity has no usable "${field}"`);
  }
}

type Raw = Record<string, unknown>;

function record(value: unknown): Raw {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new InvalidActivityError("activity");
  }
  return value as Raw;
}

function number(raw: Raw, field: string): number {
  const value = raw[field];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new InvalidActivityError(field);
  }
  return value;
}

function optionalNumber(raw: Raw, field: string): number | null {
  const value = raw[field];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function string(raw: Raw, field: string): string {
  const value = raw[field];
  if (typeof value !== "string" || value === "") {
    throw new InvalidActivityError(field);
  }
  return value;
}

function boolean(raw: Raw, field: string): boolean {
  return raw[field] === true;
}

/**
 * The IANA zone out of Strava's "(GMT+01:00) Europe/Berlin"; the offset in
 * front is the offset at the start of the ride and drops away.
 */
export function zoneFromStravaTimezone(timezone: string): string {
  const zone = timezone.split(" ").at(-1);
  return zone && zone.includes("/") ? zone : "UTC";
}

/** Strava writes local times with a "Z" that is not true; strip it. */
function localIso(value: string): string {
  return value.replace(/Z$/, "");
}

/** One activity out of a Strava summary or detailed activity object. */
export function activityFromStrava(value: unknown): Activity {
  const raw = record(value);
  const athlete = record(raw.athlete);
  const hasPower = typeof raw.average_watts === "number";
  return {
    id: number(raw, "id"),
    athleteId: number(athlete, "id"),
    name: string(raw, "name"),
    sport: string(raw, "sport_type"),
    startedAt: string(raw, "start_date"),
    startedAtLocal: localIso(string(raw, "start_date_local")),
    timezone: zoneFromStravaTimezone(string(raw, "timezone")),
    movingTime: number(raw, "moving_time"),
    elapsedTime: number(raw, "elapsed_time"),
    distance: number(raw, "distance"),
    elevationGain: optionalNumber(raw, "total_elevation_gain") ?? 0,
    averageHeartRate: optionalNumber(raw, "average_heartrate"),
    maxHeartRate: optionalNumber(raw, "max_heartrate"),
    averageWatts: optionalNumber(raw, "average_watts"),
    normalizedWatts: optionalNumber(raw, "weighted_average_watts"),
    powerFromMeter: hasPower ? boolean(raw, "device_watts") : null,
    kilojoules: optionalNumber(raw, "kilojoules"),
    relativeEffort: optionalNumber(raw, "suffer_score"),
    averageTemp: optionalNumber(raw, "average_temp"),
    trainer: boolean(raw, "trainer"),
    commute: boolean(raw, "commute"),
    isPrivate: boolean(raw, "private"),
  };
}
