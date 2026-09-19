import type { FuelPlan } from "../fuelivo/client.ts";
import type { Activity } from "./activity.ts";
import type { ActivityCache } from "./cache.ts";

// What the bike computer and the 2D page get to see (docs/KONZEPT.md §3,
// docs/adr/0008): the last session with its Fuelivo plan and the running
// week. Computed from the cache on every request, private activities never
// leave the server, and nothing here says where a ride went.

/** The zone the week is counted in: the garage stands in Cologne. */
export const HOME_ZONE = "Europe/Berlin";

export interface PublicActivity {
  readonly id: number;
  readonly name: string;
  readonly sport: string;
  /** Local start of the activity, ISO 8601 without a zone. */
  readonly startedAtLocal: string;
  /** Seconds. */
  readonly movingTime: number;
  /** Metres. */
  readonly distance: number;
  /** Metres. */
  readonly elevationGain: number;
  readonly averageHeartRate: number | null;
  readonly averageWatts: number | null;
  readonly normalizedWatts: number | null;
  /** Training Stress Score from normalized power and the FTP on Strava. */
  readonly tss: number | null;
  readonly relativeEffort: number | null;
  /** Mean temperature in °C, null without a sensor. */
  readonly averageTemp: number | null;
  readonly trainer: boolean;
}

export interface LatestActivity extends PublicActivity {
  /** What fuelivo.de says for this session; null while there is none. */
  readonly plan: FuelPlan | null;
}

export interface WeekDay {
  /** Calendar day, YYYY-MM-DD. */
  readonly date: string;
  readonly movingTime: number;
  readonly distance: number;
  readonly count: number;
}

export interface Week {
  /** Monday of the week, YYYY-MM-DD. */
  readonly start: string;
  readonly movingTime: number;
  readonly distance: number;
  readonly elevationGain: number;
  readonly count: number;
  /** Sum over the activities that have a TSS; null when none has. */
  readonly tss: number | null;
  /** Monday to Sunday, always seven entries. */
  readonly days: readonly WeekDay[];
}

export interface TrainingSummary {
  readonly syncedAt: string | null;
  readonly latest: LatestActivity | null;
  readonly week: Week;
}

/**
 * TSS = hours * (NP / FTP)^2 * 100, the standard definition; null without a
 * normalized power or an FTP.
 */
export function trainingStress(
  activity: Pick<Activity, "movingTime" | "normalizedWatts">,
  ftp: number | null,
): number | null {
  if (!ftp || activity.normalizedWatts === null) return null;
  const intensity = activity.normalizedWatts / ftp;
  return Math.round((activity.movingTime / 3600) * intensity * intensity * 100);
}

export function toPublic(
  activity: Activity,
  ftp: number | null,
): PublicActivity {
  return {
    id: activity.id,
    name: activity.name,
    sport: activity.sport,
    startedAtLocal: activity.startedAtLocal,
    movingTime: activity.movingTime,
    distance: activity.distance,
    elevationGain: activity.elevationGain,
    averageHeartRate: activity.averageHeartRate,
    averageWatts: activity.averageWatts,
    normalizedWatts: activity.normalizedWatts,
    tss: trainingStress(activity, ftp),
    relativeEffort: activity.relativeEffort,
    averageTemp: activity.averageTemp ?? null,
    trainer: activity.trainer,
  };
}

export function toLatest(
  activity: Activity,
  cache: Pick<ActivityCache, "ftp" | "plans">,
): LatestActivity {
  return {
    ...toPublic(activity, cache.ftp),
    plan: cache.plans[activity.id] ?? null,
  };
}

/** The calendar day of `instant` in `zone`, YYYY-MM-DD. */
export function localDay(instant: Date, zone: string): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

// Day arithmetic on YYYY-MM-DD strings goes through UTC midnight, where a
// day is always 86 400 s; no zone, no DST.
function addDays(day: string, days: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

/** The Monday of the week `day` falls in. */
export function mondayOf(day: string): string {
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
  return addDays(day, -((weekday + 6) % 7));
}

/** The activities of the week starting on `monday`, oldest first. */
function inWeek(activities: readonly Activity[], monday: string): Activity[] {
  const sunday = addDays(monday, 6);
  return activities
    .filter((a) => {
      const day = a.startedAtLocal.slice(0, 10);
      return day >= monday && day <= sunday;
    })
    .reverse();
}

export function summarize(
  cache: ActivityCache,
  now: Date = new Date(),
  zone: string = HOME_ZONE,
): TrainingSummary {
  const visible = cache.activities.filter((a) => !a.isPrivate);
  const monday = mondayOf(localDay(now, zone));
  const week = inWeek(visible, monday);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    const ofDay = week.filter((a) => a.startedAtLocal.startsWith(date));
    return {
      date,
      movingTime: sum(ofDay, (a) => a.movingTime),
      distance: sum(ofDay, (a) => a.distance),
      count: ofDay.length,
    };
  });
  const stresses = week
    .map((a) => trainingStress(a, cache.ftp))
    .filter((tss): tss is number => tss !== null);

  return {
    syncedAt: cache.syncedAt,
    latest: visible[0] ? toLatest(visible[0], cache) : null,
    week: {
      start: monday,
      movingTime: sum(week, (a) => a.movingTime),
      distance: sum(week, (a) => a.distance),
      elevationGain: sum(week, (a) => a.elevationGain),
      count: week.length,
      tss: stresses.length ? stresses.reduce((a, b) => a + b, 0) : null,
      days,
    },
  };
}

function sum<T>(items: readonly T[], pick: (item: T) => number): number {
  return items.reduce((total, item) => total + pick(item), 0);
}
