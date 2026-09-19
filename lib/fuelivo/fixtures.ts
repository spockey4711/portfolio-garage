import type { FuelPlan } from "./client.ts";
import type { CalculationRequest } from "./request.ts";

// Test data in Fuelivo's shape and in ours: the request the ride in
// lib/strava/fixtures.ts maps to, and the answer fuelivo.de/calculate gave
// for it on 2026-09-19 (free tier, so what_to_fuel and the before/after
// phases are null).

/** What `ride` from lib/strava/fixtures.ts maps to: 3:03 h, 143 of 194 bpm, 17 °C. */
export const rideRequest: CalculationRequest = {
  duration_hours: 3.05,
  intensity: "moderate",
  sport_type: "bike",
  session_type: "training",
  temperature_c: 17,
};

export const rawPlan = {
  logic_version: "1.0",
  phase: "during",
  target_carbs_per_hour: 65,
  duration_minutes: 183,
  items: [
    {
      fuel_item_id: "drink_500ml",
      quantity: 3,
      carbs_total_g: 90,
      time_offset_min: 0,
      phase: "during",
    },
    {
      fuel_item_id: "gel_standard",
      quantity: 5,
      carbs_total_g: 125,
      time_offset_min: 30,
      phase: "during",
    },
  ],
  carbs_per_hour_g: 65,
  total_carbs_g: 198,
  fluid_ml_per_hour: 800,
  total_fluid_ml: 2440,
  sodium_mg_per_hour: 770,
  total_sodium_mg: 2350,
  recovery: { carbs_g: 84, protein_g: 21 },
  before_ride_nutrition: null,
  during_ride_nutrition: {
    title: "During Session Nutrition",
    timing: "Every 20-30 minutes during session",
    carbs_g: 198,
    fluid_ml: 2440,
    sodium_mg: 2350,
    protein_g: null,
    what_to_fuel: null,
    product_options: null,
    substitution: null,
    rationale: [
      "During-session targets are based on per-hour recommendations and session duration.",
    ],
  },
  after_ride_nutrition: null,
  race_schedule: null,
  warnings: [
    { code: "heat", message: "Warm conditions: watch your fluid intake." },
  ],
  rationale: [
    "Duration bucket baseline set carbs to 70 g/h.",
    "Intensity modifier (moderate) adjusted carbs by +0 g/h.",
  ],
};

export const plan: FuelPlan = {
  calculatedAt: "2026-09-18T10:00:00.000Z",
  logicVersion: "1.0",
  input: rideRequest,
  carbsPerHour: 65,
  fluidPerHour: 800,
  sodiumPerHour: 770,
  totalCarbs: 198,
  totalFluid: 2440,
  totalSodium: 2350,
  timing: "Every 20-30 minutes during session",
  rationale: [
    "Duration bucket baseline set carbs to 70 g/h.",
    "Intensity modifier (moderate) adjusted carbs by +0 g/h.",
  ],
  warnings: ["Warm conditions: watch your fluid intake."],
};
