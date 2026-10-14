# Jeremyyao.dev-Playwright-Tests
Playwright Tests for jeremyyao.dev. This repo is for learning Playwright.

## End-to-End Tests

1. **Install the browser**

   `yarn install` does not download it. Run this once, and again after a Playwright upgrade:

   ```bash
   yarn playwright install chromium
   ```

2. **Run the tests**

   ```bash
   yarn test:e2e       # Headless, with results in the terminal
   yarn test:e2e:ui    # Interactive runner: pick tests and watch each step
   ```

   Playwright starts its own dev server at `http://127.0.0.1:5173` for the run. It uses an IP address rather than `localhost`, which Vite can bind to IPv6 alone while the browser tries IPv4. A `yarn dev` you already have running listens on `localhost`, so it is not reused; the two run side by side.

Useful variations:

```bash
yarn test:e2e e2e/theme.spec.ts    # One file
yarn test:e2e -g "not-found"       # Tests whose name matches
yarn test:e2e --headed             # Show the browser window
yarn test:e2e --debug              # Step through with the Playwright Inspector
yarn playwright show-report        # Open the HTML report of the last run
```

A failing test keeps a trace, a step-by-step recording of the page, which the HTML report links to.

If every test fails at its first `page.goto` with `net::ERR_CONNECTION_REFUSED`, which in UI mode leaves the preview on `about:blank`, the browser could not reach the dev server: check that nothing else is using port 5173.

The tests run against the dev server. 
