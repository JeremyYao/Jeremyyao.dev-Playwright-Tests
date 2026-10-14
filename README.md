# Jeremyyao.dev-Playwright-Tests
Playwright Tests for jeremyyao.dev. This repo is for learning Playwright.

## End-to-End Tests

1. **Install the dependencies**

   ```bash
   yarn install
   ```

2. **Install the browser**

   `yarn install` does not download it. Run this once, and again after a Playwright upgrade:

   ```bash
   yarn playwright install chromium
   ```

3. **Run the tests**

   ```bash
   yarn test:e2e       # Headless, with results in the terminal
   yarn test:e2e:ui    # Interactive runner: pick tests and watch each step
   ```

   The tests run against the live site at `https://jeremyyao.dev`. To point them at another copy, such as a preview deploy or a local dev server, set `BASE_URL`:

   ```bash
   BASE_URL=http://127.0.0.1:5173 yarn test:e2e
   ```

Useful variations:

```bash
yarn test:e2e e2e/theme.spec.ts    # One file
yarn test:e2e -g "not-found"       # Tests whose name matches
yarn test:e2e --headed             # Show the browser window
yarn test:e2e --debug              # Step through with the Playwright Inspector
yarn playwright show-report        # Open the HTML report of the last run
```

A failing test keeps a trace, a step-by-step recording of the page, which the HTML report links to.

If every test fails with the page title `Just a moment...`, Cloudflare showed the browser its bot check instead of the site. The tests cannot pass until Cloudflare lets them through.
