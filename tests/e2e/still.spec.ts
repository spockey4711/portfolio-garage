import { expect, test, type Page } from "@playwright/test";

// The static fallback of docs/KONZEPT.md §5. Headless Chromium draws WebGL
// with SwiftShader, which capability.ts counts as a weak GPU, so on the
// desktop project the still stands in too and its whole path is testable
// without a GPU: no canvas, the image, the click areas, the 2D stand-in.

const ALT = /Blick von vorn in die Garage/;

async function openStill(page: Page, path = "/") {
  await page.goto(path);
  await expect(page.getByRole("img", { name: ALT })).toBeVisible();
  // The mode is decided a frame after hydration; give it that frame.
  await page.waitForTimeout(100);
  await expect(page.locator("canvas")).toHaveCount(0);
}

test("shows the still and never mounts the canvas", async ({ page }) => {
  await openStill(page);
  const image = page.getByRole("img", { name: ALT });
  const box = await image.boundingBox();
  const viewport = page.viewportSize();
  expect(box?.width).toBe(viewport?.width);
  expect(box?.height).toBe(viewport?.height);
});

test("a click on a hotspot area opens the same ?view= as in 3D and shows its screen", async ({
  page,
}) => {
  await openStill(page);
  await page.locator('svg a[href="/?view=laptop"] rect').click();
  await expect(page).toHaveURL(/\?view=laptop$/);

  const dialog = page.getByRole("dialog", { name: "Laptop" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("img", { name: "Laptop-Display" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Zurück" })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/$/);
  await expect(dialog).toBeHidden();
});

test("a hotspot without a screen gets the note, and a click beside the card leaves", async ({
  page,
}) => {
  await openStill(page, "/?view=board");
  const dialog = page.getByRole("dialog", { name: "Pinnwand" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Inhalt folgt in Phase 2.")).toBeVisible();

  await page.mouse.click(10, 300);
  await expect(page).toHaveURL(/\/$/);
  await expect(dialog).toBeHidden();
});

test("the browser back button closes the stand-in", async ({ page }) => {
  await openStill(page);
  await page.locator('svg a[href="/?view=computer"] rect').click();
  await expect(page.getByRole("dialog", { name: "Radcomputer" })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test.describe("prefers-reduced-motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("keeps the still even where the GPU would do", async ({ page }) => {
    await openStill(page);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
