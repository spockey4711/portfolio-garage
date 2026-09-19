import type { CalculationRequest } from "./request.ts";

// The one call to fuelivo.de (docs/adr/0008): POST /calculate is public,
// needs no login, and answers a CalculationResponse (app/schemas/fueling.py
// in the Fuelivo repo). The free tier fills the per-hour values, the totals,
// the during-session timing and the rationale, which is all three pages of
// the bike computer need; what_to_fuel and the before/after phases stay
// null and are not kept. A failure of any kind is "no plan", never an
// error: the sync that asked must not fall over because Fuelivo is slow.

export const FUELIVO_URL = "https://fuelivo.de/calculate";
export const TIMEOUT_MS = 10_000;

/** What the garage keeps of a plan, next to the activity in the cache. */
export interface FuelPlan {
  /** When fuelivo.de answered, ISO 8601. */
  readonly calculatedAt: string;
  readonly logicVersion: string;
  /** What was sent, so a changed activity gets a new plan. */
  readonly input: CalculationRequest;
  /** Grams of carbohydrate per hour. */
  readonly carbsPerHour: number;
  /** Millilitres per hour. */
  readonly fluidPerHour: number;
  /** Milligrams per hour. */
  readonly sodiumPerHour: number;
  readonly totalCarbs: number;
  readonly totalFluid: number;
  readonly totalSodium: number;
  /** When to take it, as Fuelivo phrases it. */
  readonly timing: string;
  /** One line per step of the calculation, Fuelivo's core idea. */
  readonly rationale: readonly string[];
  /** Messages of the warnings, in Fuelivo's order. */
  readonly warnings: readonly string[];
}

export class InvalidPlanError extends Error {
  constructor(field: string) {
    super(`Fuelivo answer has no usable "${field}"`);
  }
}

type Raw = Record<string, unknown>;

function record(value: unknown, field: string): Raw {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new InvalidPlanError(field);
  }
  return value as Raw;
}

function integer(raw: Raw, field: string): number {
  const value = raw[field];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new InvalidPlanError(field);
  }
  return Math.round(value);
}

function string(raw: Raw, field: string): string {
  const value = raw[field];
  if (typeof value !== "string") throw new InvalidPlanError(field);
  return value;
}

function strings(raw: Raw, field: string): string[] {
  const value = raw[field];
  if (!Array.isArray(value)) throw new InvalidPlanError(field);
  return value.filter((item): item is string => typeof item === "string");
}

/** The plan out of a CalculationResponse; throws on a shape it cannot read. */
export function planFromResponse(
  value: unknown,
  input: CalculationRequest,
  calculatedAt: Date,
): FuelPlan {
  const raw = record(value, "response");
  const during = record(raw.during_ride_nutrition, "during_ride_nutrition");
  const warnings = raw.warnings;
  return {
    calculatedAt: calculatedAt.toISOString(),
    logicVersion: string(raw, "logic_version"),
    input,
    carbsPerHour: integer(raw, "carbs_per_hour_g"),
    fluidPerHour: integer(raw, "fluid_ml_per_hour"),
    sodiumPerHour: integer(raw, "sodium_mg_per_hour"),
    totalCarbs: integer(raw, "total_carbs_g"),
    totalFluid: integer(raw, "total_fluid_ml"),
    totalSodium: integer(raw, "total_sodium_mg"),
    timing: string(during, "timing"),
    rationale: strings(raw, "rationale"),
    warnings: Array.isArray(warnings)
      ? warnings
          .map((warning: unknown) =>
            typeof warning === "object" && warning !== null
              ? (warning as Raw).message
              : null,
          )
          .filter((message): message is string => typeof message === "string")
      : [],
  };
}

/**
 * The plan for `request` from fuelivo.de, or null when there is none to be
 * had right now: timeout, network, a non-2xx or an answer that does not
 * parse. The reason goes to the log, the caller only sees "no plan".
 */
export async function calculatePlan(
  request: CalculationRequest,
  fetchFn: typeof fetch = fetch,
  now: () => Date = () => new Date(),
): Promise<FuelPlan | null> {
  try {
    const response = await fetchFn(FUELIVO_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`fuelivo.de answered ${response.status}`);
    }
    return planFromResponse(await response.json(), request, now());
  } catch (error) {
    console.warn("No plan from fuelivo.de:", error);
    return null;
  }
}
