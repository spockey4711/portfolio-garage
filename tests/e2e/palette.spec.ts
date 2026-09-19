import { expect, test, type Page } from "@playwright/test";

// The command palette of docs/KONZEPT.md §10: cmd+K or the header button
// opens it on every page, typing filters, Enter runs, Escape closes it
// without touching the open hotspot. The still stands in for the canvas in
// headless Chromium (tests/e2e/still.spec.ts), which changes nothing here:
// the palette lives in the header, outside the hero.

// Control+k, which lib/palette.ts takes like cmd+K, so the run is the same on every OS.
const shortcut = "Control+k";

function palette(page: Page) {
  return page.getByRole("dialog", { name: "Befehle" });
}

// The shortcut needs the hydrated listener; goto resolves before that, so
// the press is retried until the dialog answers.
async function openPalette(page: Page) {
  await expect(async () => {
    await page.keyboard.press(shortcut);
    await expect(palette(page)).toBeVisible({ timeout: 1_000 });
  }).toPass();
}

test("cmd+K opens the palette, Escape closes it", async ({ page }) => {
  await page.goto("/ueber");
  await expect(palette(page)).toBeHidden();

  await openPalette(page);
  await expect(page.getByRole("combobox", { name: "Befehle" })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(palette(page)).toBeHidden();
});

test("the header button opens it and a click on an option navigates", async ({
  page,
  isMobile,
}) => {
  test.skip(!!isMobile, "the header shows the button from 640 px up");
  await page.goto("/ueber");
  // Same race as the shortcut: the button is in the HTML before its click
  // handler is, so a click on a cold route is retried until the dialog answers.
  await expect(async () => {
    await page.getByRole("button", { name: "Befehle" }).click();
    await expect(palette(page)).toBeVisible({ timeout: 1_000 });
  }).toPass();

  await palette(page)
    .getByRole("option", { name: /^Impressum/ })
    .click();
  await expect(page).toHaveURL(/\/impressum$/);
  await expect(palette(page)).toBeHidden();
});

test("typing filters, the arrows pick, Enter opens the project page", async ({
  page,
}) => {
  await page.goto("/");
  await openPalette(page);
  const input = page.getByRole("combobox", { name: "Befehle" });
  await input.fill("aurel");
  const options = palette(page).getByRole("option");
  await expect(options).toHaveCount(1);
  await expect(options.first()).toHaveAttribute("aria-selected", "true");

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/projekte\/aurelian$/);
});

test("a diacritic-free query finds the page and the empty state names itself", async ({
  page,
}) => {
  await page.goto("/");
  await openPalette(page);
  const input = page.getByRole("combobox", { name: "Befehle" });
  await input.fill("uber");
  await expect(
    palette(page).getByRole("option", { name: /^Über mich/ }),
  ).toBeVisible();

  await input.fill("xyzzy");
  await expect(palette(page).getByRole("option")).toHaveCount(0);
  await expect(palette(page)).toContainText("Nichts gefunden.");
});

test("a hotspot command opens the view on the start page and Escape in the palette leaves the view alone", async ({
  page,
}) => {
  await page.goto("/");
  await openPalette(page);
  await page.getByRole("combobox", { name: "Befehle" }).fill("laptop");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\?view=laptop$/);
  await expect(palette(page)).toBeHidden();

  // Escape inside the palette is the palette's; the hotspot stays open.
  await openPalette(page);
  await page.keyboard.press("Escape");
  await expect(palette(page)).toBeHidden();
  await expect(page).toHaveURL(/\?view=laptop$/);

  // The next Escape is the hotspot's.
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/$/);
});

test("a hotspot command from a deep page lands on the start page with the view open", async ({
  page,
}) => {
  await page.goto("/impressum");
  await openPalette(page);
  await page.getByRole("combobox", { name: "Befehle" }).fill("radcomputer");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/\?view=computer$/);
  await expect(page.getByRole("button", { name: "Zurück" })).toBeVisible();
});

test("copying the mail address puts it on the clipboard", async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "clipboard permissions are Chromium-only",
  );
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await openPalette(page);
  await page.getByRole("combobox", { name: "Befehle" }).fill("mail");
  await page.keyboard.press("Enter");

  await expect(palette(page)).toContainText("Kopiert");
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toBe("mail@yannikwuenker.de");
  await expect(palette(page)).toBeHidden();
});

test("the CV is a download", async ({ page }) => {
  await page.goto("/");
  await openPalette(page);
  await page.getByRole("combobox", { name: "Befehle" }).fill("cv");
  const download = page.waitForEvent("download");
  await page.keyboard.press("Enter");
  expect((await download).suggestedFilename()).toBe("yannik-wuenker.pdf");
  await expect(palette(page)).toBeHidden();
});
