import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

// Per https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status#client_error_responses
const BAD_REQUEST = 400;
const FORBIDDEN = 403;
const NOT_FOUND = 404;
const METHOD_NOT_ALLOWED = 405;

test.describe("Frontend Tests", () => {
  // Runs before each test in this file. The form ignores input until React has
  // hydrated the page, so wait for the contact page to mark <html> as hydrated.
  test.beforeEach(async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true");
  });
  // Forms: find a field by its label, type into it, and check the validation
  // message. Nothing is submitted, so no message is ever sent.
  test.describe("Contact Form Validation", () => {
    test("a required field left empty shows an error", async ({ page }) => {
      const name = page.getByLabel("Name");

      // The form validates a field when focus leaves it.
      await name.focus();
      await name.blur();

      await expect(page.getByText("Name is required.")).toBeVisible();
    });

    test("an invalid email address shows an error until it is fixed", async ({
      page,
    }) => {
      const email = page.getByLabel("Email");
      const error = page.getByText("Please enter a valid email address.");

      await email.fill("not-an-email");
      await email.blur();
      await expect(error).toBeVisible();

      await email.fill("visitor@example.com");
      await expect(error).toBeHidden();
    });
  });
});

// ---------------------------------------------------------------------------
// /api/contact
//
// Cloudflare's Bot Fight Mode answers a plain HTTP request from a datacenter
// IP, such as a CI runner, with its "Just a moment..." bot check, so the
// request never reaches the API. A real browser gets through. So these tests
// send their requests with fetch() from inside a page, the way the contact
// form does, and only fall back to Playwright's `request` fixture when a
// browser can't send the request they need.
// ---------------------------------------------------------------------------

// Every field filled in, with a real-looking Turnstile token that Cloudflare
// won't accept.
const SUBMISSION_WITH_FAKE_TOKEN = {
  name: "Name",
  email: "Email@email.com",
  subject: "Email.com",
  message: "Email.comEmail.com",
  turnstileToken:
    "1.cAhuGr-QYJb97pz9MmmdV3of4ErI5JBmrZPeZYOOO790aTs_Su0VOclNnkXLObfYc_0bvgyV2bqT5RkngPqeWPP9AYO8yPd0uBUKjGYwPAAEc8eYE-Pk_asJsb0hpEF7T51wPkRVJVmdr3rulqJN47wDMutpeXCYfOo5JrLZbXEz_tzJUgz6q9UM85RnesqhLSu7VRGBuBZDzC_gawPXg5UsOxM7RAQbEWfhgfqQ64xQ6hDc_nl13uD9rkh0B3EHdhHoOML-S1rqHBYd8MK7gDLKYMNt90RrL44kCBo2zaggxKkNq_Lb9FToJ89Ggqu0KRoBz99xqkV797nb8JRbnJKHzp0PgnQxE2pP2g8KMCzTcZGgbGrPcCnY52nN_w8cwJPAask3jxQVuXFDCdZEaPuMgmDWALxJ095qKuxGnKHcwa3StjR_0x_jo5t3BPkcJFAORZfXpl1g7vqvDzea9W7dhG7mB2P4Uv4zCeRJI7TxAixXVF6bIhuavkG44bVpGZT6bJGgVeDn-IwLUxnlfDtds4ep7Obq5lEI-7SPNP_bfZqYE2aPbe7_Tp_R_h9uJNK9FUS4nTStubM_2O95R4BH7lcQq20Vy1XtvnE2ltefGiPtLx5gMfbJMNeZtSFv.McIj9_OV78uvbU1tAg0KtQ.eaad39745f770be3779a843a4b53b141d76eae888e3dd51b0cc0f26aNOT_FOUND7cf9f",
};

// What the helpers below hand back: the status code and the raw body.
type ApiResult = { status: number; text: string };

// Sends a request to /api/contact from inside the page. The browser adds the
// page's Origin header itself, as it does for the contact form.
async function fetchFromPage(
  page: Page,
  method: string,
  body?: string,
): Promise<ApiResult> {
  const { challenged, ...result } = await page.evaluate(
    async ({ method, body }) => {
      const response = await fetch("/api/contact", {
        method,
        body,
        headers: body ? { "Content-Type": "application/json" } : undefined,
      });
      return {
        status: response.status,
        text: await response.text(),
        challenged: response.headers.get("cf-mitigated") === "challenge",
      };
    },
    { method, body },
  );

  expect(challenged, "Cloudflare's bot check blocked the request").toBe(false);
  return result;
}

// Sends a POST to /api/contact from outside the browser, which is the only way
// to leave out the Origin header. From CI, Bot Fight Mode blocks these, so the
// test is skipped there instead of failing. It still runs from a home
// connection, or against a copy of the site that isn't behind Cloudflare.
async function postWithoutOrigin(
  request: APIRequestContext,
  data: object,
): Promise<ApiResult> {
  const response = await request.post("/api/contact", { data });
  test.skip(
    response.headers()["cf-mitigated"] === "challenge",
    "Cloudflare's bot check blocked this request, as it does from CI's datacenter IPs.",
  );
  return { status: response.status(), text: await response.text() };
}

// The API rejects a request with a status code and a JSON error message.
function expectError(result: ApiResult, status: number, error: string) {
  expect(result.status).toBe(status);
  expect(JSON.parse(result.text)).toEqual({ success: false, error });
}

test.describe("/api/contact API tests", () => {
  // fetch() needs a page on the site to run in. Waiting for the title lets any
  // bot check Cloudflare shows the browser finish first.
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Jeremy Yao/);
  });

  // /api/contact only handles POST. Any other method gets
  // Cloudflare's default response for a plain static site:
  // - GET returns NOT_FOUND, because there's no page at /api/contact.
  // - DELETE, PUT and PATCH return 405/METHOD_NOT_ALLOWED, because Cloudflare only allows GET on
  //   static files. Every URL on the site does this, not just this one.
  for (const method of ["DELETE", "PUT", "PATCH"]) {
    test(`Should return a METHOD_NOT_ALLOWED for ${method} requests`, async ({
      page,
    }) => {
      const { status } = await fetchFromPage(page, method);
      expect(status).toBe(METHOD_NOT_ALLOWED);
    });
  }

  test("Should return a NOT_FOUND page for GET requests", async ({ page }) => {
    const { status, text } = await fetchFromPage(page, "GET");
    expect(status).toBe(NOT_FOUND);

    // The response text is the HTML of the NOT_FOUND page, which contains the text "Page not found" and a message about the page not existing or having moved.
    expect(text).toContain("Page not found");
    expect(text).toContain(
      "The page you're looking for doesn't exist or has moved.",
    );
  });

  test.describe("POST /api/contact tests with origin", () => {
    test.describe("All fields are required tests", () => {
      test("No payload", async ({ page }) => {
        const result = await fetchFromPage(page, "POST", JSON.stringify({}));
        expectError(result, BAD_REQUEST, "All fields are required.");
      });

      test("Test name and message of Hello", async ({ page }) => {
        const result = await fetchFromPage(
          page,
          "POST",
          JSON.stringify({ name: "Test", message: "Hello" }),
        );
        expectError(result, BAD_REQUEST, "All fields are required.");
      });

      test("Missing TurnstileToken in Payload", async ({ page }) => {
        const { turnstileToken, ...withoutToken } = SUBMISSION_WITH_FAKE_TOKEN;
        const result = await fetchFromPage(
          page,
          "POST",
          JSON.stringify(withoutToken),
        );
        expectError(result, BAD_REQUEST, "All fields are required.");
      });
    });

    test("Should reject a request with a turnstile token that is invalid with a FORBIDDEN", async ({
      page,
    }) => {
      const result = await fetchFromPage(
        page,
        "POST",
        JSON.stringify(SUBMISSION_WITH_FAKE_TOKEN),
      );
      expectError(
        result,
        FORBIDDEN,
        "Spam verification failed. Please try again.",
      );
    });

    // Javascript's .json and JSON.parse functionality throws an error on "" and other invalid JSON, so the API never sees it.
    test.describe("Invalid JSON body tests", () => {
      test("Empty body", async ({ page }) => {
        const result = await fetchFromPage(page, "POST");
        expectError(result, BAD_REQUEST, "Invalid JSON body.");
      });

      test("Not a string", async ({ page }) => {
        const result = await fetchFromPage(page, "POST", "not a string");
        expectError(result, BAD_REQUEST, "Invalid JSON body.");
      });

      test("Close to a JSON object", async ({ page }) => {
        // Needs object keys to be in double quotes to be valid JSON.
        const result = await fetchFromPage(
          page,
          "POST",
          '{object: "not a JSON object"}',
        );
        expectError(result, BAD_REQUEST, "Invalid JSON body.");
      });

      test("Malformed JSON", async ({ page }) => {
        // Missing the closing brace.
        const result = await fetchFromPage(
          page,
          "POST",
          '{"object": "not a JSON object"',
        );
        expectError(result, BAD_REQUEST, "Invalid JSON body.");
      });

      // The API only sees valid JSON, so it can only reject valid JSON that doesn't match the expected schema.
      test("Number body", async ({ page }) => {
        const result = await fetchFromPage(page, "POST", JSON.stringify(69));
        expectError(result, BAD_REQUEST, "Invalid request body.");
      });

      test("Null body", async ({ page }) => {
        const result = await fetchFromPage(page, "POST", JSON.stringify(null));
        expectError(result, BAD_REQUEST, "Invalid request body.");
      });
    });
  });
});

// A browser adds Origin to every POST; the API rejects a POST without it with a
// forbidden error.
test.describe("POST /api/contact tests without origin", () => {
  test("Obviously invalid payload should return FORBIDDEN and an error message", async ({
    request,
  }) => {
    const result = await postWithoutOrigin(request, {
      name: "Test",
      message: "Hello",
    });
    expectError(result, FORBIDDEN, "Invalid request origin.");
  });

  test("Close to valid payload should return FORBIDDEN and an error message", async ({
    request,
  }) => {
    const result = await postWithoutOrigin(request, SUBMISSION_WITH_FAKE_TOKEN);
    expectError(result, FORBIDDEN, "Invalid request origin.");
  });
});
