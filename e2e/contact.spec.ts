/**
 * Copyright © 2026 Jeremy Yao
 * PROPRIETARY AND CONFIDENTIAL
 * Unauthorized copying of this file, via any medium is strictly prohibited
 */
import { expect, test } from "@playwright/test";

// Forms: find a field by its label, type into it, and check the validation
// message. Nothing is submitted, so no message is ever sent.

// Runs before each test in this file.
test.beforeEach(async ({ page }) => {
  await page.goto("/contact");
});

test("a required field left empty shows an error", async ({ page }) => {
  const name = page.getByLabel("Name");

  // The form validates a field when focus leaves it.
  await name.focus();
  await name.blur();

  await expect(page.getByText("Name is required.")).toBeVisible();
});

test("an invalid email address shows an error until it is fixed", async ({ page }) => {
  const email = page.getByLabel("Email");
  const error = page.getByText("Please enter a valid email address.");

  await email.fill("not-an-email");
  await email.blur();
  await expect(error).toBeVisible();

  await email.fill("visitor@example.com");
  await expect(error).toBeHidden();
});
