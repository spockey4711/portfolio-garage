import { expect, test, type Page } from "@playwright/test";

// The click path of docs/KONZEPT.md §4 through the DOM: the hotspot links,
// ?view=, Escape, the back button of the browser and the one on screen. The
// camera itself is not asserted; that needs pixels and a GPU and is checked
// by hand. What is asserted is that every way in and out lands on the same
// URL state, which is what the store follows.

async function openGarage(page: Page, path = "/") {
  await page.goto(path);
  await expect(page.getByRole("region", { name: "3D-Garage" })).toBeVisible();
}

test("a hotspot link opens the view and Escape leaves it", async ({ page }) => {
  await openGarage(page);
  const back = page.getByRole("button", { name: "Zurück" });
  await expect(back).toBeHidden();

  // The links are visually hidden until focused: keyboard only, by design.
  await page.getByRole("link", { name: "Laptop" }).press("Enter");
  await expect(page).toHaveURL(/\?view=laptop$/);
  await expect(back).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/$/);
  await expect(back).toBeHidden();
});

test("a deep link starts inside the hotspot and the browser back button leaves it", async ({
  page,
}) => {
  await openGarage(page, "/?view=computer");
  await expect(page.getByRole("button", { name: "Zurück" })).toBeVisible();

  // The entry before the deep link, so back has somewhere to go.
  await page.getByRole("button", { name: "Zurück" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goBack();
  await expect(page).toHaveURL(/\?view=computer$/);
  await expect(page.getByRole("button", { name: "Zurück" })).toBeVisible();
});

test("Tab reaches the hotspots, Enter opens one and moves focus to the back button", async ({
  page,
}) => {
  await openGarage(page);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Werkzeugwand" })).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Whiteboard" })).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\?view=plan$/);
  await expect(page.getByRole("button", { name: "Zurück" })).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/$/);
});

test("unknown views fall back to the rest position", async ({ page }) => {
  await openGarage(page, "/?view=kitchen");
  await expect(page.getByRole("button", { name: "Zurück" })).toBeHidden();
});
