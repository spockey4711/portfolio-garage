import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGarageStore } from "@/lib/garage/store";
import { plan } from "@/lib/fuelivo/fixtures";
import type { TrainingSummary } from "@/lib/strava/summary";
import { BikeComputer } from "./BikeComputer";

// The screen against a fixed summary and a fixed clock: what each page shows
// and how the keys move between them. Fetch is stubbed; the store decides
// whether the keys count, as it does in the scene.

const summary: TrainingSummary = {
  syncedAt: "2026-09-18T17:30:00Z",
  latest: {
    id: 3,
    name: "Bergisches Land",
    sport: "Ride",
    startedAtLocal: "2026-09-17T07:42:10",
    movingTime: 10980,
    distance: 84213.5,
    elevationGain: 912,
    averageHeartRate: 142.7,
    averageWatts: 198.4,
    normalizedWatts: 221,
    tss: 220,
    relativeEffort: 118,
    averageTemp: 17.4,
    trainer: false,
    plan,
  },
  week: {
    start: "2026-09-14",
    movingTime: 20100,
    distance: 157513.5,
    elevationGain: 1240,
    count: 3,
    tss: 381,
    days: [
      { date: "2026-09-14", movingTime: 5400, distance: 42100, count: 1 },
      { date: "2026-09-15", movingTime: 0, distance: 0, count: 0 },
      { date: "2026-09-16", movingTime: 3720, distance: 31200, count: 1 },
      { date: "2026-09-17", movingTime: 10980, distance: 84213.5, count: 1 },
      { date: "2026-09-18", movingTime: 0, distance: 0, count: 0 },
      { date: "2026-09-19", movingTime: 0, distance: 0, count: 0 },
      { date: "2026-09-20", movingTime: 0, distance: 0, count: 0 },
    ],
  },
};

let container: HTMLDivElement;
let root: Root;

async function mount(data: TrainingSummary | null) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      data === null ? new Response(null, { status: 503 }) : Response.json(data),
    ),
  );
  await act(async () => {
    root.render(<BikeComputer />);
  });
}

function press(key: string) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key }));
  });
}

function title(): string {
  return container.querySelector("header span")!.textContent!;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
  vi.setSystemTime(new Date("2026-09-18T18:04:00+02:00"));
  vi.spyOn(console, "warn").mockImplementation(() => {});
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  useGarageStore.setState({ phase: "focused", view: "radcomputer" });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  useGarageStore.setState({ phase: "idle", view: "ruhe" });
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("BikeComputer", () => {
  it("opens on page 1 with the last ride in Edge formatting", async () => {
    await mount(summary);
    expect(title()).toBe("Fahrt");
    const text = container.textContent;
    expect(text).toContain("Bergisches Land");
    expect(text).toContain("Gestern · Rad");
    expect(text).toContain("3:03:00");
    expect(text).toContain("84,21");
    expect(text).toContain("912");
    expect(text).toContain("143");
    expect(text).toContain("17");
    expect(text).toContain("118");
    expect(text).toContain("18:04");
  });

  it("pages with the arrow keys and wraps around like the device", async () => {
    await mount(summary);
    press("ArrowDown");
    expect(title()).toBe("Plan");
    const text = container.textContent;
    expect(text).toContain("moderat · 3,1 h · 17 °C");
    expect(text).toContain("65");
    expect(text).toContain("198");
    expect(text).toContain("800");
    expect(text).toContain("2.440");
    expect(text).toContain("770");
    expect(text).toContain("2.350");
    expect(container.querySelector("a")?.getAttribute("href")).toBe(
      "/projekte/fuelivo",
    );
    press("ArrowDown");
    expect(title()).toBe("Warum");
    expect(container.textContent).toContain(plan.rationale[0]);
    expect(container.textContent).toContain(plan.warnings[0]);
    press("ArrowDown");
    expect(title()).toBe("Fahrt");
    press("ArrowUp");
    expect(title()).toBe("Warum");
  });

  it("names the reason when the activity has no plan", async () => {
    await mount({
      ...summary,
      latest: { ...summary.latest!, sport: "Hike", plan: null },
    });
    press("ArrowDown");
    expect(container.textContent).toContain("Kein Plan für diese Sportart");
    expect(container.textContent).not.toContain("65");
    press("ArrowDown");
    expect(container.textContent).toContain("Kein Plan für diese Sportart");
  });

  it("says the plan is still to come when Fuelivo has not answered yet", async () => {
    await mount({ ...summary, latest: { ...summary.latest!, plan: null } });
    press("ArrowDown");
    expect(container.textContent).toContain("Plan folgt");
  });

  it("ignores the keys while the view is not open", async () => {
    await mount(summary);
    act(() => useGarageStore.setState({ phase: "idle", view: "ruhe" }));
    press("ArrowDown");
    expect(title()).toBe("Fahrt");
  });

  it("keeps its fields empty when the data does not arrive", async () => {
    await mount(null);
    expect(container.textContent).toContain("Keine Einheit");
    expect(container.textContent).toContain("--");
    expect(container.textContent).not.toContain("NaN");
    press("ArrowDown");
    expect(container.textContent).toContain("Keine Einheit");
  });
});
