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
  // Fails a CI run that contains a `test.only` left in by mistake, which would
  // otherwise run that one test and skip the rest.
  forbidOnly: !!process.env.CI,
  // Prints each test as it runs, and writes an HTML report to open with
  // `yarn playwright show-report`.
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    // Lets a test say `page.goto("/about")` rather than the full URL.
    baseURL: BASE_URL,
    // A failing test keeps a trace: a recording of every step, with the page
    // as it looked at each one. The HTML report links to it.
    trace: "retain-on-failure",

    // A failing test keeps a screenshot of the page at the moment of failure.
    screenshot: "only-on-failure",

    // A failing test keeps a video recording of the test run. The HTML report
    // links to it.
    video: "retain-on-failure",
  },
  // One browser keeps the first run quick. Add `devices["Desktop Firefox"]` or
  // `devices["Desktop Safari"]` here to run every test in those as well.
  projects: [
    // Desktop viewports
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    // Mobile viewports
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],
});
