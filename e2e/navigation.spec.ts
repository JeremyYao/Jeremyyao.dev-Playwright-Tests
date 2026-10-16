import { expect, test } from "@playwright/test";

// The basics: open a page, find elements the way a visitor would (by role and
// name, not by CSS class), and assert on what they see.
//
// Every `expect` here retries until it passes or times out, so there are no
// manual waits for the page to load or a navigation to finish.

test("the home page shows the name as its heading", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Jeremy Yao/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Jeremy Yao",
  );
});

test("a navbar link opens its page and is marked as current", async ({
  page,
}) => {
  await page.goto("/");

  // Scoped to the navbar: the home page also has a "Learn more about me"
  // link, and a role lookup matches any link whose name contains "About".
  const navbar = page.getByRole("navigation", { name: "Primary" });
  const aboutLink = navbar.getByRole("link", { name: "About" });
  await aboutLink.click();

  await expect(page).toHaveURL("/about");
  await expect(aboutLink).toHaveAttribute("aria-current", "page");
});

test("an unknown URL shows the not-found page with a way back", async ({
  page,
}) => {
  await page.goto("/no-such-page");

  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Back to Home" }).click();
  await expect(page).toHaveURL("/");
});

test("an unknown URL requesting .env should show the not-found page", async ({
  page,
}) => {
  await page.goto("/.env");

  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Back to Home" }).click();
  await expect(page).toHaveURL("/");
});
