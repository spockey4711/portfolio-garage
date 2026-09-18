import { defineConfig } from "@playwright/test";

// Browser tests against next dev. They live outside pnpm test on purpose: the
// quality gate stays a Node-only run, and this suite needs a browser. No GPU:
// headless Chromium draws WebGL with SwiftShader, which the garage answers
// with the still (lib/garage/capability.ts); the canvas tests override the
// renderer string to get the canvas anyway.
//
// The port is fixed so the suite never fights a pnpm dev on 3000 for the
// port. Next allows one dev server per checkout, though: with pnpm dev
// already running, point the suite at it with
// E2E_BASE_URL=http://localhost:3000 instead of starting the one below.
const port = 3100;
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  // next dev compiles a route on its first request and the GLB has to load
  // once; the budgets fit a cold start without hiding a stuck page.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    locale: "de-DE",
    timezoneId: "Europe/Berlin",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { browserName: "chromium", viewport: { width: 1280, height: 800 } },
    },
    {
      name: "mobile",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `pnpm dev --port ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
