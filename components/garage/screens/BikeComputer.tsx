"use client";

import Link from "next/link";
import { useEffect, useId, useState, type ReactNode } from "react";
import { getGarageContent, type GarageContent } from "@/content/garage";
import {
  COMPUTER_PAGES,
  formatClock,
  formatDay,
  formatDistance,
  formatDuration,
  formatElevation,
  formatInteger,
  isPageKey,
  nextPage,
  pageAfterKey,
  weekdayIndex,
  type ComputerPage,
} from "@/lib/garage/computer";
import { useGarageStore } from "@/lib/garage/store";
import { defaultLocale } from "@/lib/i18n";
import {
  HOME_ZONE,
  localDay,
  type TrainingSummary,
} from "@/lib/strava/summary";
import { useTrainingSummary } from "./useTrainingSummary";

type ComputerContent = GarageContent["screens"]["radcomputer"];

/** The Edge 540 display is 246 x 322 px; the DOM is laid out at twice that. */
export const EDGE_DISPLAY = { width: 246, height: 322 } as const;

// The Edge UI of docs/KONZEPT.md §3, after a Garmin Edge 540: a button-only
// device whose Up and Down keys scroll a loop of data pages, each a grid of
// fields with a small label and a big value. Page 1 is the last session,
// page 2 the running week with a chart, page 3 the rider. The arrow keys page
// while the view is open (KONZEPT §4); a click on the display pages too, for
// the still on a phone, where there is no keyboard.
export function BikeComputer() {
  const content = getGarageContent(defaultLocale).screens.radcomputer;
  const summary = useTrainingSummary();
  const [page, setPage] = useState<ComputerPage>("today");
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
    <div
      role="group"
      aria-label={content.label}
      aria-describedby={keysId}
      tabIndex={0}
      onClick={() => setPage(nextPage)}
      className="focus-visible:ring-accent flex h-full w-full flex-col bg-black font-sans text-white outline-none select-none focus-visible:ring-2 focus-visible:ring-inset"
    >
      <span id={keysId} className="sr-only">
        {content.keys}
      </span>
      <StatusBar title={content.pages[page]} />
      {page === "today" && <TodayPage summary={summary} content={content} />}
      {page === "week" && <WeekPage summary={summary} content={content} />}
      {page === "about" && <AboutPage content={content} />}
      <PageDots page={page} />
    </div>
  );
}

interface PageProps {
  readonly summary: TrainingSummary | null;
  readonly content: ComputerContent;
}

function TodayPage({ summary, content }: PageProps) {
  const latest = summary?.latest ?? null;
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
        <span className="truncate text-[34px] leading-tight font-semibold">
          {latest ? latest.name : content.noActivity}
        </span>
        <span className="min-h-[26px] text-[20px] text-zinc-400">{when}</span>
      </Field>
      <div className="grid flex-1 grid-cols-2 grid-rows-2">
        <Field label={content.fields.duration} right bottom>
          <Value text={latest && formatDuration(latest.movingTime)} />
        </Field>
        <Field label={content.fields.distance} unit={content.units.km} bottom>
          <Value text={latest && formatDistance(latest.distance)} />
        </Field>
        <Field label={content.fields.heartRate} unit={content.units.bpm} right>
          <Value
            text={
              latest?.averageHeartRate != null
                ? formatInteger(latest.averageHeartRate)
                : null
            }
          />
        </Field>
        <Field label={content.fields.load}>
          <Value
            text={latest?.tss != null ? formatInteger(latest.tss) : null}
          />
        </Field>
      </div>
    </>
  );
}

function WeekPage({ summary, content }: PageProps) {
  const week = summary?.week ?? null;

  return (
    <>
      <div className="grid flex-1 grid-cols-2">
        <Field label={content.fields.duration} right>
          <Value text={week && formatDuration(week.movingTime)} />
        </Field>
        <Field label={content.fields.distance} unit={content.units.km}>
          <Value text={week && formatDistance(week.distance)} />
        </Field>
      </div>
      <WeekChart summary={summary} content={content} />
      <div className="grid flex-1 grid-cols-2">
        <Field label={content.fields.elevation} unit={content.units.m} right>
          <Value text={week && formatElevation(week.elevationGain)} />
        </Field>
        <Field label={content.fields.load}>
          <Value text={week?.tss != null ? formatInteger(week.tss) : null} />
        </Field>
      </div>
    </>
  );
}

/** Horizontal padding of every field, so the chart lines up with the values. */
const FIELD_PADDING = 24;

const CHART = {
  width: EDGE_DISPLAY.width * 2 - 2 * FIELD_PADDING,
  height: 170,
  barWidth: 24,
  cornerRadius: 4,
} as const;

// Moving time per day, Monday to Sunday, one hue (a single series needs no
// legend), today's bar at full strength. Zero days show only the baseline.
function WeekChart({ summary, content }: PageProps) {
  const days = summary?.week.days ?? [];
  const today = localDay(new Date(), HOME_ZONE);
  const todayIndex = weekdayIndex(today);
  const max = Math.max(...days.map((day) => day.movingTime), 1);
  const slot = CHART.width / 7;
  const baseline = CHART.height - 1;
  const count = summary?.week.count;
  const range = `${content.weekdays[0]}. bis ${content.weekdays[6]}.`;

  return (
    <figure className="border-t border-b border-zinc-700 px-6 pt-4 pb-2">
      <figcaption className="flex justify-between text-[20px] text-zinc-400">
        <span>{range}</span>
        <span className="tabular-nums">
          {count === undefined
            ? content.noData
            : `${count} ${count === 1 ? content.fields.count.one : content.fields.count.other}`}
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${CHART.width} ${CHART.height}`}
        width={CHART.width}
        height={CHART.height}
        role="img"
        aria-label={`${content.fields.duration} ${range}`}
        className="mt-2 block"
      >
        {days.map((day, index) => {
          const height = Math.round((day.movingTime / max) * (baseline - 8));
          const x = index * slot + (slot - CHART.barWidth) / 2;
          return (
            <path
              key={day.date}
              d={roundedColumn(x, baseline, CHART.barWidth, height)}
              className={
                index === todayIndex ? "fill-accent" : "fill-accent opacity-70"
              }
            >
              <title>
                {`${formatDay(day.date, today, content.day, content.weekdays)}: ${formatDuration(day.movingTime)}, ${formatDistance(day.distance)} ${content.units.km}`}
              </title>
            </path>
          );
        })}
        <line
          x1={0}
          x2={CHART.width}
          y1={baseline}
          y2={baseline}
          className="stroke-zinc-700"
          strokeWidth={2}
        />
      </svg>
      {/* HTML, not SVG <text>: under drei's tiny 3D scale Chrome lays SVG glyphs out at zero width. */}
      <div
        aria-hidden="true"
        className="grid grid-cols-7 pt-1 text-center text-[20px] leading-none text-zinc-400"
      >
        {content.weekdays.map((weekday, index) => (
          <span
            key={weekday}
            className={index === todayIndex ? "font-medium text-white" : ""}
          >
            {weekday}
          </span>
        ))}
      </div>
    </figure>
  );
}

/** A column that stands on the baseline: square foot, rounded top. */
function roundedColumn(
  x: number,
  baseline: number,
  width: number,
  height: number,
): string {
  if (height <= 0) return "";
  const r = Math.min(CHART.cornerRadius, height, width / 2);
  const top = baseline - height;
  return [
    `M${x},${baseline}`,
    `V${top + r}`,
    `A${r},${r} 0 0 1 ${x + r},${top}`,
    `H${x + width - r}`,
    `A${r},${r} 0 0 1 ${x + width},${top + r}`,
    `V${baseline}`,
    "Z",
  ].join(" ");
}

function AboutPage({ content }: { readonly content: ComputerContent }) {
  return (
    <Field label={content.about.field} wide grow>
      <div className="flex flex-1 flex-col justify-center">
        <span className="text-[72px] leading-none font-semibold">
          {content.about.name}
        </span>
        <span className="mt-4 text-[30px] leading-none text-zinc-300">
          {content.about.place}
        </span>
        <span className="mt-3 text-[24px] leading-snug text-zinc-400">
          {content.about.claim}
        </span>
      </div>
      {/* The 2D page is the source of truth (KONZEPT §5); the screen only links there. */}
      <Link
        href="/ueber"
        onClick={(event) => event.stopPropagation()}
        className="text-accent self-start text-[22px] underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
      >
        {`${content.about.more} →`}
      </Link>
    </Field>
  );
}

interface FieldProps {
  readonly label: string;
  /** Unit after the label, muted, the way the Edge annotates a field. */
  readonly unit?: string;
  /** Full display width, a fixed height unless `grow`. */
  readonly wide?: boolean;
  /** Take the remaining height (page 3). */
  readonly grow?: boolean;
  /** Divider on the right, i.e. a left-hand cell. */
  readonly right?: boolean;
  /** Divider below, i.e. a top-row cell. */
  readonly bottom?: boolean;
  readonly children: ReactNode;
}

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
        "flex min-w-0 flex-col px-6 pt-3 pb-4",
        wide ? "border-b border-zinc-700" : "",
        wide && !grow ? "h-[150px]" : "",
        grow ? "flex-1" : "",
        right ? "border-r border-zinc-700" : "",
        bottom ? "border-b border-zinc-700" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="flex items-baseline gap-2 text-[20px] leading-none text-zinc-400">
        {label}
        {unit && <span className="text-[17px] text-zinc-500">{unit}</span>}
      </span>
      {/* The value sits in the middle of the space under the label, like on the Edge. */}
      <div className="flex min-h-0 flex-1 flex-col justify-center">
        {children}
      </div>
    </div>
  );
}

// A value fills the field the way the Edge sizes its numbers: the shorter the
// text, the bigger the digits. Null shows the device's empty field.
function Value({ text }: { readonly text: string | null }) {
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
      className={`${size} leading-none font-semibold tabular-nums ${text === null ? "text-zinc-500" : ""}`}
    >
      {shown}
    </span>
  );
}

// The strip along the top of the Edge: page title left, clock and battery
// right. The clock is client state, so it renders empty on the server.
function StatusBar({ title }: { readonly title: string }) {
  const clock = useClock();
  return (
    <header className="flex h-[56px] items-center justify-between border-b border-zinc-700 px-6 text-[22px] text-zinc-300">
      <span aria-live="polite" className="font-medium">
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
      <span className="flex h-[14px] w-[26px] items-center rounded-[3px] border-2 border-zinc-400 p-[1.5px]">
        <span className="h-full w-[85%] rounded-[1px] bg-zinc-300" />
      </span>
      <span className="h-[6px] w-[2px] rounded-r-[1px] bg-zinc-400" />
    </span>
  );
}

function useClock(): string | null {
  const [clock, setClock] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setClock(formatClock(new Date()));
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
      className="flex h-[36px] shrink-0 items-center justify-center gap-3 border-t border-zinc-700"
    >
      {COMPUTER_PAGES.map((id) => (
        <span
          key={id}
          className={`h-[8px] w-[8px] rounded-full ${id === page ? "bg-white" : "bg-zinc-600"}`}
        />
      ))}
    </footer>
  );
}
