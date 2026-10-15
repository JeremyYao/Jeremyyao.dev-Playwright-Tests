# Jeremyyao.dev-Playwright-Tests

Playwright end-to-end tests for [jeremyyao.dev](https://jeremyyao.dev). This repo is for learning Playwright.

| Path                        | What it holds                                                 |
| --------------------------- | ------------------------------------------------------------- |
| `e2e/`                      | The tests, one file per area of the site                      |
| `playwright.config.ts`      | Which site and browser the tests use, and what a run produces |
| `.github/workflows/e2e.yml` | The CI run on every push                                      |
| `.node-version`             | The Node version, read by fnm, nvm and CI                     |

## Setup

1. **Install the dependencies**

   ```bash
   yarn install
   ```

2. **Install the browsers**

   `yarn install` does not download it. Run this once, and again after a Playwright upgrade:

   ```bash
   yarn playwright install
   ```

## Running the tests

```bash
yarn test:e2e       # Headless, with results in the terminal
yarn test:e2e:ui    # Interactive runner: pick tests and watch each step
```

The tests run against the live site at `https://jeremyyao.dev`. To point them at another copy, such as a preview deploy or a local dev server, set `BASE_URL`:

```bash
BASE_URL=http://127.0.0.1:5173 yarn test:e2e              # bash
$env:BASE_URL = "http://127.0.0.1:5173"; yarn test:e2e    # PowerShell
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

## Before committing

```bash
yarn typecheck    # Type errors, which Playwright itself does not check for
yarn format       # Formats every file with Prettier
```

CI fails on a type error or an unformatted file, so running these first saves a round trip.

## Continuous Integration

GitHub Actions runs the checks and the tests on every push, to any branch, and every night at 07:17 UTC against `main`. To run them on demand, such as right after deploying the site, use **Run workflow** on the repo's Actions tab. Each run's summary page shows whether they passed, and has the HTML report to download as the `playwright-report` artifact, with a trace for any test that failed.

## Troubleshooting

If every test fails with the page title `Just a moment...`, Cloudflare showed the browser its bot check instead of the site. The tests cannot pass until Cloudflare lets them through.
