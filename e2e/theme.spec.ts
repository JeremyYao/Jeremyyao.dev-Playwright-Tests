import { expect, test } from "@playwright/test";

// Controlling the browser itself: the OS color scheme, a reload, and the
// storage that survives it.
//
// Each test gets a brand-new browser profile, so a theme chosen in one test
// is never still stored when the next one starts.

// The OS setting every test in this file starts from, so the results don't
// depend on the machine running them.
test.use({ colorScheme: "light" });

test("the toggle switches to dark mode and the choice survives a reload", async ({
  page,
}) => {
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).toContainClass("light");

  await page.getByRole("button", { name: "Switch to dark mode" }).click();

  await expect(html).toContainClass("dark");
  // The button now offers the way back.
  await expect(
    page.getByRole("button", { name: "Switch to light mode" }),
  ).toBeVisible();

  await page.reload();
  await expect(html).toContainClass("dark");
});

test("a visitor whose OS is in dark mode starts in the dark theme", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");

  await expect(page.locator("html")).toContainClass("dark");
});
