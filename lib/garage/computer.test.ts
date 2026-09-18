import { describe, expect, it } from "vitest";
import {
  COMPUTER_PAGES,
  formatClock,
  formatDay,
  formatDistance,
  formatDuration,
  formatElevation,
  isPageKey,
  nextPage,
  pageAfterKey,
  weekdayIndex,
} from "./computer";

describe("pageAfterKey", () => {
  it("scrolls down through the pages like the Down key on the Edge", () => {
    expect(pageAfterKey("today", "ArrowDown")).toBe("week");
    expect(pageAfterKey("week", "ArrowDown")).toBe("about");
  });

  it("wraps around at both ends like the data screen loop", () => {
    expect(pageAfterKey("about", "ArrowDown")).toBe("today");
    expect(pageAfterKey("today", "ArrowUp")).toBe("about");
  });

  it("treats Left and Right like Up and Down", () => {
    expect(pageAfterKey("week", "ArrowRight")).toBe("about");
    expect(pageAfterKey("week", "ArrowLeft")).toBe("today");
  });

  it("ignores every other key", () => {
    for (const page of COMPUTER_PAGES) {
      for (const key of ["Escape", "Enter", " ", "toString"]) {
        expect(pageAfterKey(page, key)).toBeNull();
        expect(isPageKey(key)).toBe(false);
      }
    }
    expect(isPageKey("ArrowUp")).toBe(true);
  });
});

describe("nextPage", () => {
  it("is the Down key", () => {
    expect(nextPage("today")).toBe("week");
    expect(nextPage("about")).toBe("today");
  });
});

describe("formatDuration", () => {
  it("shows h:mm:ss with unpadded hours", () => {
    expect(formatDuration(10980)).toBe("3:03:00");
    expect(formatDuration(59)).toBe("0:00:59");
    expect(formatDuration(0)).toBe("0:00:00");
  });

  it("rounds to whole seconds", () => {
    expect(formatDuration(3599.6)).toBe("1:00:00");
  });
});

describe("formatDistance", () => {
  it("uses two decimals under 100 km and a comma", () => {
    expect(formatDistance(84213.5)).toBe("84,21");
    expect(formatDistance(0)).toBe("0,00");
  });

  it("drops to one decimal from 100 km so the number keeps its width", () => {
    expect(formatDistance(184_250)).toBe("184,3");
  });
});

describe("formatElevation", () => {
  it("groups thousands with a dot", () => {
    expect(formatElevation(1240.4)).toBe("1.240");
    expect(formatElevation(912)).toBe("912");
  });
});

describe("formatClock", () => {
  it("pads hours and minutes", () => {
    expect(formatClock(new Date(2026, 8, 18, 7, 5))).toBe("07:05");
  });
});

describe("formatDay", () => {
  const words = { today: "Heute", yesterday: "Gestern" };
  const weekdays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

  it("names today and yesterday", () => {
    expect(formatDay("2026-09-18", "2026-09-18", words, weekdays)).toBe(
      "Heute",
    );
    expect(formatDay("2026-09-17", "2026-09-18", words, weekdays)).toBe(
      "Gestern",
    );
  });

  it("shows weekday and date for older days", () => {
    expect(formatDay("2026-09-15", "2026-09-18", words, weekdays)).toBe(
      "Di. 15.09.",
    );
    expect(formatDay("2026-01-04", "2026-09-18", words, weekdays)).toBe(
      "So. 04.01.",
    );
  });
});

describe("weekdayIndex", () => {
  it("counts from Monday", () => {
    expect(weekdayIndex("2026-09-14")).toBe(0);
    expect(weekdayIndex("2026-09-20")).toBe(6);
  });
});
