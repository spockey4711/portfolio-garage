import { expect, test, type Locator, type Page } from "@playwright/test";

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

// The screens are DOM on the display meshes (KONZEPT §5). Open, they take
// the pointer; closed, they are scenery and the click reaches the hotspot
// box behind them. Both cases click by coordinates: Playwright refuses to
// click an element that does not receive pointer events, which for the
// closed screen is the point.
async function centerOf(screen: Locator) {
  const box = await screen.boundingBox();
  if (!box) throw new Error("the screen has no bounding box");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

// The bike computer's glass is a focusable group (its pages turn on click and
// arrow keys), not a picture like the placeholder screens.
function bikeComputer(page: Page) {
  return page.getByRole("group", { name: "Radcomputer-Display" });
}

test.describe("screens in the canvas", () => {
  // Under 768 px the still stands in by design (tests/e2e/still.spec.ts).
  test.skip(
    ({ isMobile }) => !!isMobile,
    "the mobile project never mounts the canvas",
  );

  // Headless Chromium draws WebGL with SwiftShader, which lib/garage/capability.ts
  // rightly counts as a weak GPU and answers with the still. These tests need
  // the canvas, so the browser reports a GPU instead; SwiftShader still draws.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const UNMASKED_RENDERER_WEBGL = 0x9246;
      const { getParameter } = WebGL2RenderingContext.prototype;
      WebGL2RenderingContext.prototype.getParameter = function (name) {
        if (name === UNMASKED_RENDERER_WEBGL) return "Playwright Test GPU";
        return getParameter.call(this, name);
      };
    });
  });

  test("a click inside the open screen stays in the hotspot, a click beside it leaves", async ({
    page,
  }) => {
    await openGarage(page, "/?view=computer");
    const screen = bikeComputer(page);
    // pointer-events switch on when the camera has arrived.
    await expect(screen).toHaveCSS("pointer-events", "auto");

    const { x, y } = await centerOf(screen);
    await page.mouse.click(x, y);
    await expect(page).toHaveURL(/\?view=computer$/);

    await page.mouse.click(x, 40);
    await expect(page).toHaveURL(/\/$/);
  });

  // The three pages of docs/adr/0008 against what the server serves: the
  // ride, the plan fuelivo.de calculated for it, and why. The fixture cache
  // in tests/e2e/data has a plan; a server on your own cache may not, then
  // the pages name the reason instead.
  test("the bike computer pages through ride, plan and why with the arrow keys", async ({
    page,
  }) => {
    const summary = (await (
      await page.request.get("/api/activity")
    ).json()) as {
      latest: {
        name: string;
        sport: string;
        movingTime: number;
        plan: {
          carbsPerHour: number;
          totalFluid: number;
          rationale: string[];
        } | null;
      } | null;
    };
    await openGarage(page, "/?view=computer");
    const screen = bikeComputer(page);
    await expect(screen).toHaveCSS("pointer-events", "auto");
    const title = screen.locator("header span").first();
    await expect(title).toHaveText("Fahrt");
    if (summary.latest) await expect(screen).toContainText(summary.latest.name);

    await page.keyboard.press("ArrowDown");
    await expect(title).toHaveText("Plan");
    const plan = summary.latest?.plan ?? null;
    if (plan) {
      await expect(screen).toContainText(String(plan.carbsPerHour));
      await expect(screen).toContainText(
        plan.totalFluid.toLocaleString("de-DE"),
      );
    } else {
      await expect(screen).toContainText(/Kein Plan|Plan folgt|Keine Einheit/);
    }
    await expect(screen.getByRole("link", { name: /fuelivo/ })).toHaveAttribute(
      "href",
      "/projekte/fuelivo",
    );

    await page.keyboard.press("ArrowDown");
    await expect(title).toHaveText("Warum");
    if (plan) await expect(screen).toContainText(plan.rationale[0]);

    await page.keyboard.press("ArrowDown");
    await expect(title).toHaveText("Fahrt");
    await page.keyboard.press("ArrowUp");
    await expect(title).toHaveText("Warum");
  });

  test("a click on a closed screen opens its hotspot", async ({ page }) => {
    await openGarage(page);
    // The bike computer sits in the middle of the frame on every viewport; the
    // laptop is outside the narrow portrait frame on the mobile project.
    const screen = bikeComputer(page);
    await expect(screen).toHaveCSS("pointer-events", "none");

    const { x, y } = await centerOf(screen);
    await page.mouse.click(x, y);
    await expect(page).toHaveURL(/\?view=computer$/);
  });

  // The rows are next/link, so the click is a client navigation out of the
  // garage; Screen.tsx stops the pointer events from bubbling to fiber, which
  // must not keep the link from navigating.
  test("a project on the open laptop navigates to its page, Escape drives back first", async ({
    page,
  }) => {
    await openGarage(page, "/?view=laptop");
    // Scoped to the hero: the start page has a "Projekte" section of its own
    // below it. Closed, the screen is inert and so hidden to a role query.
    const list = page
      .getByRole("region", { name: "3D-Garage" })
      .getByRole("region", { name: "Projekte", includeHidden: true });
    await expect(list).toHaveCSS("pointer-events", "auto");

    // A click on the list beside the rows stays in the hotspot.
    const { x, y } = await centerOf(list.getByRole("heading"));
    await page.mouse.click(x, y);
    await expect(page).toHaveURL(/\?view=laptop$/);

    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/\/$/);
    await expect(list).toHaveCSS("pointer-events", "none");

    await page.goBack();
    await expect(page).toHaveURL(/\?view=laptop$/);
    await expect(list).toHaveCSS("pointer-events", "auto");
    await list.getByRole("link", { name: /fuelivo/ }).click();
    await expect(page).toHaveURL(/\/projekte\/fuelivo$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/fuelivo/);
  });

  test("the notes on the open board are links that leave for the post", async ({
    page,
  }) => {
    await openGarage(page, "/?view=blog");
    const board = page.getByRole("navigation", { name: "Pinnwand" });
    await expect(board).toHaveCSS("pointer-events", "auto");

    await board.getByRole("link", { name: /Licht aus dem Ofen/ }).click();
    await expect(page).toHaveURL(/\/blog\/licht-aus-dem-ofen$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /Licht aus dem Ofen/,
    );
  });
});
