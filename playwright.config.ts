/**
 * Copyright © 2026 Jeremy Yao
 * PROPRIETARY AND CONFIDENTIAL
 * Unauthorized copying of this file, via any medium is strictly prohibited
 */
import { defineConfig, devices } from "@playwright/test";

/**
 * Where the dev server listens during a run: an IP address, not `localhost`.
 * Vite listens on whichever address `localhost` resolves to first, which here
 * is IPv6 `::1` alone, while a browser may send `localhost` to IPv4
 * `127.0.0.1`. Then the first `page.goto` fails with ERR_CONNECTION_REFUSED
 * and the test never leaves about:blank.
 */
const HOST = "127.0.0.1";
/** `--strictPort` below keeps the dev server from moving off this port. */
const PORT = 5173;
const BASE_URL = `http://${HOST}:${PORT}`;

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
  // Starts the dev server for the run, or uses one already running at BASE_URL.
  webServer: {
    command: `yarn dev --host ${HOST} --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: true,
  },
});
