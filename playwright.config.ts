/**
 * Copyright © 2026 Jeremy Yao
 * PROPRIETARY AND CONFIDENTIAL
 * Unauthorized copying of this file, via any medium is strictly prohibited
 */
import { defineConfig, devices } from "@playwright/test";

/**
 * The site under test: the live site, unless `BASE_URL` names another one,
 * such as a preview deploy or a local dev server.
 */
const BASE_URL = process.env.BASE_URL ?? "https://jeremyyao.dev";

export default defineConfig({
  testDir: "e2e",
  // Runs the tests within a file side by side too, not just the files. Safe
  // because each test gets its own browser profile and shares nothing.
  fullyParallel: true,
  // Prints each test as it runs, and writes an HTML report to open with
  // `yarn playwright show-report`.
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    // Lets a test say `page.goto("/about")` rather than the full URL.
    baseURL: BASE_URL,
    // A failing test keeps a trace: a recording of every step, with the page
    // as it looked at each one. The HTML report links to it.
    trace: "retain-on-failure",
  },
  // One browser keeps the first run quick. Add `devices["Desktop Firefox"]` or
  // `devices["Desktop Safari"]` here to run every test in those as well.
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
