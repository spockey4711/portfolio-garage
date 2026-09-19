"use client";

import Link from "next/link";
import { Fragment, useEffect, useId, useState, type ReactNode } from "react";
import { getGarageContent, type GarageContent } from "@/content/garage";
import { whyNoPlan } from "@/lib/fuelivo/request";
import {
  COMPUTER_PAGES,
  formatClock,
  formatDay,
  formatDistance,
  formatDuration,
  formatElevation,
  formatHours,
  formatInteger,
  formatTemperature,
  isPageKey,
  nextPage,
  pageAfterKey,
  type ComputerPage,
} from "@/lib/garage/computer";
import { useGarageStore } from "@/lib/garage/store";
import { defaultLocale } from "@/lib/i18n";
import { HOME_ZONE, localDay, type LatestActivity } from "@/lib/strava/summary";
import { useTrainingSummary } from "@/lib/strava/useTrainingSummary";

type ComputerContent = GarageContent["screens"]["radcomputer"];

/**
 * The front of an Edge 540 in its own display pixels: a 246 x 322 panel
 * behind a black glass lens with the wordmark under it. The lens is the mesh
 * the DOM sits on (Screen.tsx), so the same outline is built in
 * blender/build/build_bike.py (RC_LENS); change both or neither.
 */
export const EDGE = {
  display: { width: 246, height: 322 },
  bezel: { top: 46, side: 40, bottom: 68 },
} as const;

export const EDGE_LENS = {
  width: EDGE.display.width + 2 * EDGE.bezel.side,
  height: EDGE.display.height + EDGE.bezel.top + EDGE.bezel.bottom,
} as const;

/** CSS pixels per device pixel; the DOM is laid out at twice the panel. */
export const EDGE_SCALE = 2;

const px = (devicePx: number) => devicePx * EDGE_SCALE;

// The Edge UI of docs/adr/0008, after a Garmin Edge 540: a button-only
// device whose Up and Down keys scroll a loop of data pages, each a grid of
// fields with a small label and a big value, black on the white transflective
// panel, the grid lines in Garmin blue. Page 1 is the last ride from Strava,
// the demo input; page 2 the plan fuelivo.de calculated for it; page 3 why,
// Fuelivo's rationale. The arrow keys page while the view is open (KONZEPT
// §4); a click on the display pages too, for the still on a phone, where
// there is no keyboard.
export function BikeComputer() {
  const content = getGarageContent(defaultLocale).screens.radcomputer;
  const summary = useTrainingSummary();
  const latest = summary?.latest ?? null;
  const [page, setPage] = useState<ComputerPage>("ride");
  const keysId = useId();
  const isOpen = useGarageStore(
    (state) => state.phase === "focused" && state.view === "radcomputer",
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || !isPageKey(event.key)) return;
      event.preventDefault();
      setPage((current) => pageAfterKey(current, event.key) ?? current);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <Lens>
      <div
        role="group"
        aria-label={content.label}
        aria-describedby={keysId}
        tabIndex={0}
        onClick={() => setPage(nextPage)}
        className="focus-visible:ring-accent flex h-full w-full flex-col overflow-hidden rounded-[6px] bg-[#eef0f1] font-sans text-[#0e1013] outline-none select-none focus-visible:ring-2 focus-visible:ring-inset"
      >
        <span id={keysId} className="sr-only">
          {content.keys}
        </span>
        <StatusBar title={content.pages[page]} />
        {page === "ride" && <RidePage latest={latest} content={content} />}
        {page === "plan" && <PlanPage latest={latest} content={content} />}
        {page === "why" && <WhyPage latest={latest} content={content} />}
        <PageDots page={page} />
      </div>
    </Lens>
  );
}

// The black glass over the whole front: the panel sits in it a little above
// centre, the wordmark and the light sensor fill the wider bezel below.
function Lens({ children }: { readonly children: ReactNode }) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[90px] bg-[#0b0c0e] bg-[linear-gradient(165deg,#25282d_0%,#0b0c0e_38%,#0b0c0e_100%)]">
      <div
        className="absolute"
        style={{
          left: px(EDGE.bezel.side),
          top: px(EDGE.bezel.top),
          width: px(EDGE.display.width),
          height: px(EDGE.display.height),
        }}
      >
        {children}
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 flex items-center justify-center text-[34px] leading-none font-bold tracking-[0.22em] text-[#b4b8bd]"
        style={{
          top: px(EDGE.bezel.top + EDGE.display.height),
          height: px(EDGE.bezel.bottom),
        }}
      >
        <span className="pl-[0.22em]">GARMIN</span>
        <span
          className="absolute h-[12px] w-[12px] rounded-full bg-[#2c2f34]"
          style={{ right: px(EDGE.bezel.side + 8) }}
        />
      </div>
    </div>
  );
}

/** The Edge's grid lines: two device pixels of Garmin blue. */
const RULE = "border-[#0b7fcb]";

interface PageProps {
  /** Null while the data is loading, failed, or the cache is empty. */
  readonly latest: LatestActivity | null;
  readonly content: ComputerContent;
}

// Page 1: the last activity as Strava has it, the five values Fuelivo's
// plan is calculated from plus the effort behind the intensity.
function RidePage({ latest, content }: PageProps) {
  const today = localDay(new Date(), HOME_ZONE);
  const when = latest
    ? [
        formatDay(
          latest.startedAtLocal.slice(0, 10),
          today,
          content.day,
          content.weekdays,
        ),
        content.sports[latest.sport] ?? latest.sport,
      ].join(" · ")
    : null;

  return (
    <>
      <Field label={content.latest} wide>
        <span className="truncate text-[34px] leading-tight font-bold">
          {latest ? latest.name : content.noActivity}
        </span>
        <span className="min-h-[26px] text-[20px] text-[#4b525b]">{when}</span>
      </Field>
      <div className="grid flex-1 grid-cols-2 grid-rows-3">
        <Field label={content.fields.duration} right bottom>
          <Value text={latest && formatDuration(latest.movingTime)} />
        </Field>
        <Field label={content.fields.distance} unit={content.units.km} bottom>
          <Value text={latest && formatDistance(latest.distance)} />
        </Field>
        <Field
          label={content.fields.elevation}
          unit={content.units.m}
          right
          bottom
        >
          <Value text={latest && formatElevation(latest.elevationGain)} />
        </Field>
        <Field label={content.fields.heartRate} unit={content.units.bpm} bottom>
          <Value
            icon={<Heart />}
            text={
              latest?.averageHeartRate != null
                ? formatInteger(latest.averageHeartRate)
                : null
            }
          />
        </Field>
        <Field
          label={content.fields.temperature}
          unit={content.units.celsius}
          right
        >
          <Value
            text={
              latest?.averageTemp != null
                ? formatTemperature(latest.averageTemp)
                : null
            }
          />
        </Field>
        <Field label={content.fields.effort}>
          <Value
            text={
              latest?.relativeEffort != null
                ? formatInteger(latest.relativeEffort)
                : null
            }
          />
        </Field>
      </div>
    </>
  );
}

/** Why the plan pages are empty: the activity itself, or Fuelivo has not answered yet. */
function noPlanText(
  latest: LatestActivity | null,
  content: ComputerContent,
): string {
  if (!latest) return content.noActivity;
  return content.noPlan[whyNoPlan(latest) ?? "pending"];
}

// Page 2: what fuelivo.de says for the ride on page 1, in the device's own
// language: data fields, per hour on the left, for the whole ride on the
// right. The wide field names the input the plan was calculated from.
function PlanPage({ latest, content }: PageProps) {
  const plan = latest?.plan ?? null;
  const input = plan
    ? [
        content.plan.intensity[plan.input.intensity],
        `${formatHours(plan.input.duration_hours)} ${content.units.hours}`,
        `${formatTemperature(plan.input.temperature_c)} ${content.units.celsius}`,
      ].join(" · ")
    : noPlanText(latest, content);
  const rows = [
    {
      label: content.fields.carbs,
      unit: content.units.g,
      perHour: plan?.carbsPerHour,
      total: plan?.totalCarbs,
    },
    {
      label: content.fields.fluid,
      unit: content.units.ml,
      perHour: plan?.fluidPerHour,
      total: plan?.totalFluid,
    },
    {
      label: content.fields.sodium,
      unit: content.units.mg,
      perHour: plan?.sodiumPerHour,
      total: plan?.totalSodium,
    },
  ];

  return (
    <>
      <Field label={content.plan.field} wide>
        <span className="text-[30px] leading-tight font-bold">{input}</span>
        {/* The 2D page is the source of truth (KONZEPT §5); the screen only links there. */}
        <Link
          href="/projekte/fuelivo"
          onClick={(event) => event.stopPropagation()}
          className="text-[20px] font-medium text-[#0b7fcb] underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
        >
          {`${content.plan.more} →`}
        </Link>
      </Field>
      <div
        aria-hidden="true"
        className={`${RULE} grid h-[30px] grid-cols-2 items-center border-b-[4px] text-center text-[19px] leading-none tracking-wide text-[#4b525b] uppercase`}
      >
        <span>{content.plan.perHour}</span>
        <span>{content.plan.total}</span>
      </div>
      <div className="grid flex-1 grid-cols-2 grid-rows-3">
        {rows.map((row, index) => {
          const last = index === rows.length - 1;
          return (
            <Fragment key={row.label}>
              <Field
                label={row.label}
                unit={`${row.unit}${content.units.perHour}`}
                right
                bottom={!last}
              >
                <Value
                  text={row.perHour != null ? formatInteger(row.perHour) : null}
                />
              </Field>
              <Field label={row.label} unit={row.unit} bottom={!last}>
                <Value
                  text={row.total != null ? formatInteger(row.total) : null}
                />
              </Field>
            </Fragment>
          );
        })}
      </div>
    </>
  );
}

// Page 3: Fuelivo's core idea, every step of the calculation writes down
// its reason. The lines come from fuelivo.de as they are; the warnings
// follow them.
function WhyPage({ latest, content }: PageProps) {
  const plan = latest?.plan ?? null;
  if (!plan) {
    return (
      <Field label={content.why.rationale} wide grow>
        <span className="text-center text-[30px] leading-tight font-bold text-[#4b525b]">
          {noPlanText(latest, content)}
        </span>
      </Field>
    );
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <Reasons title={content.why.rationale} lines={plan.rationale} />
      {plan.warnings.length > 0 && (
        <Reasons title={content.why.warnings} lines={plan.warnings} warning />
      )}
    </div>
  );
}

// One block of lines, laid out like a wide field: label on top, then the
// lines with a dot in the colour of the block, blue for reasons, red for
// warnings.
function Reasons({
  title,
  lines,
  warning,
}: {
  readonly title: string;
  readonly lines: readonly string[];
  readonly warning?: boolean;
}) {
  return (
    <section
      className={`${RULE} border-b-[4px] px-6 pt-2 pb-4 last:border-b-0`}
    >
      <h3 className="text-center text-[19px] leading-none tracking-wide text-[#4b525b] uppercase">
        {title}
      </h3>
      <ul className="mt-3 space-y-3 text-[25px] leading-snug">
        {lines.map((line) => (
          <li key={line} className="flex gap-3">
            <span
              aria-hidden="true"
              className={`mt-[0.5em] h-[10px] w-[10px] shrink-0 rounded-full ${warning ? "bg-[#e5322d]" : "bg-[#0b7fcb]"}`}
            />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

interface FieldProps {
  readonly label: string;
  /** Unit after the label, muted, the way the Edge annotates a field. */
  readonly unit?: string;
  /** Full display width, a fixed height unless `grow`. */
  readonly wide?: boolean;
  /** Take the remaining height (page 3 without a plan). */
  readonly grow?: boolean;
  /** Divider on the right, i.e. a left-hand cell. */
  readonly right?: boolean;
  /** Divider below, i.e. a top-row cell. */
  readonly bottom?: boolean;
  readonly children: ReactNode;
}

// A data field like the Edge draws it: the label small and centred along
// the top edge, the value big in the space below.
function Field({
  label,
  unit,
  wide,
  grow,
  right,
  bottom,
  children,
}: FieldProps) {
  return (
    <div
      className={[
        "flex min-w-0 flex-col px-6 pt-2 pb-3",
        wide ? `${RULE} border-b-[4px]` : "",
        wide && !grow ? "h-[132px]" : "",
        grow ? "flex-1" : "",
        right ? `${RULE} border-r-[4px]` : "",
        bottom ? `${RULE} border-b-[4px]` : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="flex items-baseline justify-center gap-2 text-[19px] leading-none tracking-wide text-[#4b525b] uppercase">
        {label}
        {unit && (
          <span className="text-[16px] text-[#7a828c] normal-case">{unit}</span>
        )}
      </span>
      <div className="flex min-h-0 flex-1 flex-col justify-center text-center">
        {children}
      </div>
    </div>
  );
}

// A value fills the field the way the Edge sizes its numbers: the shorter the
// text, the bigger the digits. Null shows the device's empty field.
function Value({
  text,
  icon,
}: {
  readonly text: string | null;
  /** Small colour mark before the digits, like the Edge's red heart. */
  readonly icon?: ReactNode;
}) {
  const content = getGarageContent(defaultLocale).screens.radcomputer;
  const shown = text ?? content.noData;
  const size =
    shown.length <= 4
      ? "text-[72px]"
      : shown.length <= 6
        ? "text-[60px]"
        : "text-[48px]";
  return (
    <span
      className={`flex items-center justify-center gap-3 ${size} leading-none font-bold tabular-nums ${text === null ? "text-[#9aa0a6]" : ""}`}
    >
      {text !== null && icon}
      {shown}
    </span>
  );
}

function Heart() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[0.42em] w-[0.42em] shrink-0 fill-[#e5322d]"
    >
      <path d="M12 21.4 3.6 13A5.4 5.4 0 0 1 12 5.6 5.4 5.4 0 0 1 20.4 13Z" />
    </svg>
  );
}

// The strip along the top of the Edge: page title left, clock and battery
// right. The clock is client state, so it renders empty on the server.
function StatusBar({ title }: { readonly title: string }) {
  const clock = useClock();
  return (
    <header
      className={`${RULE} flex h-[48px] items-center justify-between border-b-[4px] px-6 text-[22px] text-[#0e1013]`}
    >
      <span aria-live="polite" className="font-semibold">
        {title}
      </span>
      <span className="flex items-center gap-3">
        <span className="min-w-[60px] text-right tabular-nums">{clock}</span>
        <Battery />
      </span>
    </header>
  );
}

function Battery() {
  return (
    <span aria-hidden="true" className="flex items-center">
      <span className="flex h-[16px] w-[28px] items-center rounded-[3px] border-2 border-[#0e1013] p-[2px]">
        <span className="h-full w-[85%] rounded-[1px] bg-[#3cb44b]" />
      </span>
      <span className="h-[7px] w-[2px] rounded-r-[1px] bg-[#0e1013]" />
    </span>
  );
}

function useClock(): string | null {
  const [clock, setClock] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setClock(formatClock(new Date(), HOME_ZONE));
    tick();
    const timer = setInterval(tick, 10_000);
    return () => clearInterval(timer);
  }, []);
  return clock;
}

// Where in the loop the page is, the way the Edge marks it along the bottom.
function PageDots({ page }: { readonly page: ComputerPage }) {
  return (
    <footer
      aria-hidden="true"
      className={`${RULE} flex h-[30px] shrink-0 items-center justify-center gap-3 border-t-[4px]`}
    >
      {COMPUTER_PAGES.map((id) => (
        <span
          key={id}
          className={`h-[8px] w-[8px] rounded-full ${id === page ? "bg-[#0b7fcb]" : "bg-[#b9bec4]"}`}
        />
      ))}
    </footer>
  );
}
