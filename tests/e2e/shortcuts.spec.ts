import { expect, test, type Page } from "@playwright/test";

// Keyboard-first (docs/KONZEPT.md §10): j and k walk the sections of every
// page and hand the focus to the heading, ? opens the overlay with every
// shortcut, and none of the three fires where another key owner sits: a
// field, the palette, an open hotspot.

function overlay(page: Page) {
  return page.getByRole("dialog", { name: "Tastenkürzel" });
}

// The keys need the hydrated listener; goto resolves before that, so the
// first press is retried until the page answers.
async function pressUntil(
  page: Page,
  key: string,
  settled: () => Promise<void>,
) {
  await expect(async () => {
    await page.keyboard.press(key);
    await settled();
  }).toPass();
}

test("j and k walk the sections of the start page and focus the heading", async ({
  page,
}) => {
  await page.goto("/");
  const projekte = page.getByRole("heading", { name: "Projekte", level: 2 });
  const blog = page.getByRole("heading", { name: "Blog", level: 2 });
  const ueber = page.getByRole("heading", { name: "Über mich", level: 2 });

  await pressUntil(page, "j", () =>
    expect(projekte).toBeFocused({ timeout: 1_000 }),
  );
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);

  await page.keyboard.press("j");
  await expect(blog).toBeFocused();
  await page.keyboard.press("j");
  await expect(ueber).toBeFocused();

  // Past the last section j stays put.
  await page.keyboard.press("j");
  await expect(ueber).toBeFocused();

  await page.keyboard.press("k");
  await expect(blog).toBeFocused();
  await page.keyboard.press("k");
  await expect(projekte).toBeFocused();

  // Before the first section comes the hero, which takes the focus itself.
  await page.keyboard.press("k");
  await expect(page.getByRole("region", { name: "3D-Garage" })).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page).toHaveURL(/\/$/);
});

test("j and k walk the sections of a deep page", async ({ page }) => {
  await page.goto("/bauweise");
  const headings = page.locator("section[data-section] h2");
  const first = headings.nth(0);
  const second = headings.nth(1);

  await pressUntil(page, "j", () =>
    expect(first).toBeFocused({ timeout: 1_000 }),
  );
  await page.keyboard.press("j");
  await expect(second).toBeFocused();
  await page.keyboard.press("k");
  await expect(first).toBeFocused();
});

test("? opens the overlay, Escape closes it, the garage rows appear on the start page only", async ({
  page,
}) => {
  await page.goto("/ueber");
  await expect(overlay(page)).toBeHidden();
  await pressUntil(page, "?", () =>
    expect(overlay(page)).toBeVisible({ timeout: 1_000 }),
  );
  await expect(overlay(page)).toContainText("Nächster und voriger Abschnitt");
  await expect(overlay(page)).toContainText("Befehle");
  await expect(overlay(page)).not.toContainText("Radcomputer");

  await page.keyboard.press("Escape");
  await expect(overlay(page)).toBeHidden();

  await page.goto("/");
  await pressUntil(page, "?", () =>
    expect(overlay(page)).toBeVisible({ timeout: 1_000 }),
  );
  await expect(overlay(page)).toContainText("Radcomputer");
  await expect(overlay(page)).toContainText("Hotspots");

  // ? again closes it as well.
  await page.keyboard.press("?");
  await expect(overlay(page)).toBeHidden();
});

test("the keys stay quiet in the palette and in an open hotspot", async ({
  page,
}) => {
  await page.goto("/");
  await pressUntil(page, "?", () =>
    expect(overlay(page)).toBeVisible({ timeout: 1_000 }),
  );
  await page.keyboard.press("Escape");
  await expect(overlay(page)).toBeHidden();

  // Typing into the palette's field is typing.
  await page.keyboard.press("Control+k");
  const input = page.getByRole("combobox", { name: "Befehle" });
  await expect(input).toBeFocused();
  await input.pressSequentially("j?");
  await expect(input).toHaveValue("j?");
  await expect(overlay(page)).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(input).toBeHidden();

  // Inside a hotspot the page belongs to the screen; Escape leaves the hotspot.
  await page.getByRole("link", { name: "Laptop" }).press("Enter");
  await expect(page).toHaveURL(/\?view=laptop$/);
  await page.keyboard.press("?");
  await page.keyboard.press("j");
  await expect(overlay(page)).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/$/);
  await expect(overlay(page)).toBeHidden();
});
