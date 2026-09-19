"use client";

import { getSiteContent } from "@/content/site";
import type { FuelPlan } from "@/lib/fuelivo/client";
import { whyNoPlan } from "@/lib/fuelivo/request";
import { defaultLocale } from "@/lib/i18n";
import type { LatestActivity } from "@/lib/strava/summary";
import { useTrainingSummary } from "@/lib/strava/useTrainingSummary";

// The plan for the last ride on the 2D project page (docs/adr/0008): the
// same numbers the bike computer shows, as a spec-sheet table instead of
// device fields, so the content exists without the garage (CLAUDE.md, the
// 2D page is the source of truth). Reads /api/activity like the computer.
export function FuelPlanCard() {
  const content = getSiteContent(defaultLocale).project.plan;
  const summary = useTrainingSummary();

  if (summary === null) {
    return <Note aria-busy="true">{content.loading}</Note>;
  }
  const latest = summary.latest;
  if (latest === null) return <Note>{content.noActivity}</Note>;
  return (
    <div className="space-y-4">
      <RideLine latest={latest} />
      {latest.plan ? (
        <PlanTable plan={latest.plan} />
      ) : (
        <Note>{content.noPlan[whyNoPlan(latest) ?? "pending"]}</Note>
      )}
    </div>
  );
}

function Note({
  children,
  ...rest
}: {
  readonly children: string;
  readonly "aria-busy"?: "true";
}) {
  return (
    <p className="text-zinc-500" {...rest}>
      {children}
    </p>
  );
}

// The ride in one mono line: what Fuelivo was given.
function RideLine({ latest }: { readonly latest: LatestActivity }) {
  const content = getSiteContent(defaultLocale).project.plan;
  const facts = [
    content.sports[latest.sport] ?? latest.sport,
    date.format(new Date(latest.startedAtLocal)),
    hoursMinutes(latest.movingTime),
    latest.averageTemp !== null
      ? `${integer.format(latest.averageTemp)} °C`
      : null,
    latest.plan ? content.intensity[latest.plan.input.intensity] : null,
  ].filter((fact): fact is string => fact !== null);

  return (
    <div>
      <p className="font-medium">{latest.name}</p>
      <ul className="mt-1 flex flex-wrap gap-x-4 font-mono text-xs text-zinc-500">
        {facts.map((fact) => (
          <li key={fact}>{fact}</li>
        ))}
      </ul>
    </div>
  );
}

function PlanTable({ plan }: { readonly plan: FuelPlan }) {
  const content = getSiteContent(defaultLocale).project.plan;
  const rows = [
    {
      label: content.carbs,
      unit: "g",
      perHour: plan.carbsPerHour,
      total: plan.totalCarbs,
    },
    {
      label: content.fluid,
      unit: "ml",
      perHour: plan.fluidPerHour,
      total: plan.totalFluid,
    },
    {
      label: content.sodium,
      unit: "mg",
      perHour: plan.sodiumPerHour,
      total: plan.totalSodium,
    },
  ];

  return (
    <>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-200 font-mono text-xs tracking-[0.2em] text-zinc-500 uppercase dark:border-zinc-800">
            <th scope="col" className="py-2 text-left font-normal">
              <span className="sr-only">{content.title}</span>
            </th>
            <th scope="col" className="py-2 text-right font-normal">
              {content.perHour}
            </th>
            <th scope="col" className="py-2 text-right font-normal">
              {content.total}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.label}
              className="border-b border-zinc-200 dark:border-zinc-800"
            >
              <th scope="row" className="py-2 text-left font-normal">
                {row.label}
              </th>
              <td className="py-2 text-right tabular-nums">
                {integer.format(row.perHour)} {row.unit}/h
              </td>
              <td className="py-2 text-right tabular-nums">
                {integer.format(row.total)} {row.unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Reasons title={content.rationale} lines={plan.rationale} />
      {plan.warnings.length > 0 && (
        <Reasons title={content.warnings} lines={plan.warnings} />
      )}
    </>
  );
}

// Fuelivo's lines as they come, in Fuelivo's language: they are data from
// the calculator, not copy of this site.
function Reasons({
  title,
  lines,
}: {
  readonly title: string;
  readonly lines: readonly string[];
}) {
  return (
    <div>
      <h3 className="font-mono text-xs tracking-[0.2em] text-zinc-500 uppercase">
        {title}
      </h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-zinc-400">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

const integer = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** Seconds as "3:03 h". */
function hoursMinutes(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")} h`;
}
