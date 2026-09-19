import { describe, expect, it } from "vitest";
import { HEAD, isEditable, sectionAfter, shortcutFor } from "./shortcuts";

const plain = { metaKey: false, ctrlKey: false, altKey: false };

describe("shortcutFor", () => {
  it("maps j, k and ? and nothing else", () => {
    expect(shortcutFor({ ...plain, key: "j" })).toBe("next");
    expect(shortcutFor({ ...plain, key: "k" })).toBe("prev");
    expect(shortcutFor({ ...plain, key: "?" })).toBe("help");
    expect(shortcutFor({ ...plain, key: "J" })).toBeNull();
    expect(shortcutFor({ ...plain, key: "/" })).toBeNull();
    expect(shortcutFor({ ...plain, key: "Escape" })).toBeNull();
  });

  it("leaves modified keys to the browser", () => {
    expect(shortcutFor({ ...plain, key: "j", metaKey: true })).toBeNull();
    expect(shortcutFor({ ...plain, key: "k", ctrlKey: true })).toBeNull();
    expect(shortcutFor({ ...plain, key: "j", altKey: true })).toBeNull();
  });
});

describe("isEditable", () => {
  it("is true for fields and editable elements", () => {
    expect(isEditable({ tagName: "INPUT", isContentEditable: false })).toBe(
      true,
    );
    expect(isEditable({ tagName: "TEXTAREA", isContentEditable: false })).toBe(
      true,
    );
    expect(isEditable({ tagName: "SELECT", isContentEditable: false })).toBe(
      true,
    );
    expect(isEditable({ tagName: "DIV", isContentEditable: true })).toBe(true);
  });

  it("is false for the page and for no target", () => {
    expect(isEditable({ tagName: "BODY", isContentEditable: false })).toBe(
      false,
    );
    expect(isEditable({ tagName: "H2", isContentEditable: false })).toBe(false);
    expect(isEditable(null)).toBe(false);
  });
});

describe("sectionAfter", () => {
  // Four sections; the viewport top sits on the second one.
  const tops = [-900, 0, 700, 1500];

  it("next skips the section at the top and takes the one below", () => {
    expect(sectionAfter(tops, "next")).toBe(2);
  });

  it("prev takes the section above, not the one at the top", () => {
    expect(sectionAfter(tops, "prev")).toBe(0);
  });

  it("treats a few pixels off as at the top", () => {
    expect(sectionAfter([-5, 700], "next")).toBe(1);
    expect(sectionAfter([-5, 700], "prev")).toBeNull();
    expect(sectionAfter([5, 700], "next")).toBe(1);
  });

  it("finds nothing past the ends", () => {
    expect(sectionAfter([-1500, -700], "next")).toBeNull();
    expect(sectionAfter([0, 700], "prev")).toBeNull();
    expect(sectionAfter([], "next")).toBeNull();
    expect(sectionAfter([], "prev")).toBeNull();
  });

  it("from the top of the page, next is the first section below the fold", () => {
    expect(sectionAfter([200, 900], "next")).toBe(0);
  });

  it("steps from the section in flight regardless of where the scroll is", () => {
    // Halfway to section 2, whose top is still below the fold.
    const flying = [-1200, -300, 400, 1200];
    expect(sectionAfter(flying, "next", 2)).toBe(3);
    expect(sectionAfter(flying, "prev", 2)).toBe(1);
    expect(sectionAfter(flying, "next", 3)).toBeNull();
    expect(sectionAfter(flying, "prev", 0)).toBeNull();
  });

  it("from the head of the page in flight, next is the first section", () => {
    expect(sectionAfter([-100, 600], "next", HEAD)).toBe(0);
    expect(sectionAfter([-100, 600], "prev", HEAD)).toBeNull();
  });
});
