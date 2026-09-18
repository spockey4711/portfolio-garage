// The device logic of the bike computer screen (docs/KONZEPT.md §3), modelled
// on a Garmin Edge 540: three data pages in a loop that the Up and Down keys
// on the left edge of the device scroll through, and values formatted the
// way the Edge shows them. The React tree in components/garage/screens/
// BikeComputer.tsx only lays this out.

export const COMPUTER_PAGES = ["today", "week", "about"] as const;

export type ComputerPage = (typeof COMPUTER_PAGES)[number];

/**
 * The page a key press lands on. The Edge has Up and Down; Left and Right do
 * the same here because a keyboard has them next to each other. Wraps around
 * like the data screen loop on the device. Null for any other key.
 */
export function pageAfterKey(
  page: ComputerPage,
  key: string,
): ComputerPage | null {
  const step = keySteps.get(key);
  return step === undefined ? null : pageAfter(page, step);
}

/** True for a key that pages, so the screen can claim it before anyone else. */
export function isPageKey(key: string): boolean {
  return keySteps.has(key);
}

/** The page the Down key lands on. */
export function nextPage(page: ComputerPage): ComputerPage {
  return pageAfter(page, 1);
}

function pageAfter(page: ComputerPage, step: 1 | -1): ComputerPage {
  const index = COMPUTER_PAGES.indexOf(page);
  const count = COMPUTER_PAGES.length;
  return COMPUTER_PAGES[(index + step + count) % count];
}

const keySteps: ReadonlyMap<string, 1 | -1> = new Map([
  ["ArrowDown", 1],
  ["ArrowRight", 1],
  ["ArrowUp", -1],
  ["ArrowLeft", -1],
]);

/** Seconds as the Edge timer shows them: h:mm:ss, hours without padding. */
export function formatDuration(seconds: number): string {
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  return `${hours}:${pad(minutes)}:${pad(rest)}`;
}

/**
 * Metres as kilometres with the decimals the Edge distance field uses: two
 * under 100 km, one from there on, so the number keeps its width.
 */
export function formatDistance(metres: number): string {
  const km = metres / 1000;
  return (km < 100 ? twoDecimals : oneDecimal).format(km);
}

/** Whole metres of climbing, grouped in thousands. */
export function formatElevation(metres: number): string {
  return integer.format(Math.round(metres));
}

export function formatInteger(value: number): string {
  return integer.format(Math.round(value));
}

/** Time of day for the status bar, 24 h. */
export function formatClock(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export interface DayWords {
  readonly today: string;
  readonly yesterday: string;
}

/**
 * The day an activity started, relative to today where that reads better:
 * "Heute", "Gestern", otherwise weekday and date like "Di. 15.09.". Both
 * arguments are local YYYY-MM-DD days (lib/strava/summary.ts).
 */
export function formatDay(
  day: string,
  today: string,
  words: DayWords,
  weekdays: readonly string[],
): string {
  const date = new Date(`${day}T00:00:00Z`);
  const daysAgo = Math.round(
    (Date.parse(`${today}T00:00:00Z`) - date.getTime()) / 86_400_000,
  );
  if (daysAgo === 0) return words.today;
  if (daysAgo === 1) return words.yesterday;
  const weekday = weekdays[(date.getUTCDay() + 6) % 7];
  return `${weekday}. ${pad(date.getUTCDate())}.${pad(date.getUTCMonth() + 1)}.`;
}

/** Index of a YYYY-MM-DD day in a Monday-first week, 0 to 6. */
export function weekdayIndex(day: string): number {
  return (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7;
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

// The device speaks German (docs/adr/0003): decimal comma, dot for thousands.
const integer = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
const oneDecimal = fixedDecimals(1);
const twoDecimals = fixedDecimals(2);

function fixedDecimals(digits: number): Intl.NumberFormat {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
