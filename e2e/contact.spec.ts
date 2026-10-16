import { expect, test } from "@playwright/test";

// Per https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status#client_error_responses
const BAD_REQUEST = 400;
const FORBIDDEN = 403;
const NOT_FOUND = 404;
const METHOD_NOT_FOUND = 405;

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

test.describe("/api/contact API tests", () => {
  // /api/contact only handles POST. Any other method gets
  // Cloudflare's default response for a plain static site:
  // - GET returns NOT_FOUND, because there's no page at /api/contact.
  // - DELETE, PUT and PATCH return 405/METHOD_NOT_FOUND, because Cloudflare only allows GET on
  //   static files. Every URL on the site does this, not just this one.
  test("Should return a METHOD_NOT_FOUND for DELETE requests", async ({
    request,
  }) => {
    const response = await request.delete("/api/contact");
    expect(response.status()).toBe(METHOD_NOT_FOUND);
  });

  test("Should return a METHOD_NOT_FOUND for PUT requests", async ({
    request,
  }) => {
    const response = await request.put("/api/contact");
    expect(response.status()).toBe(METHOD_NOT_FOUND);
  });

  test("Should return a METHOD_NOT_FOUND for patch requests", async ({
    request,
  }) => {
    const response = await request.patch("/api/contact");
    expect(response.status()).toBe(METHOD_NOT_FOUND);
  });

  test("Should return a NOT_FOUND page for GET requests", async ({
    request,
  }) => {
    const response = await request.get("/api/contact");
    expect(response.status()).toBe(NOT_FOUND);

    // The response text is the HTML of the NOT_FOUND page, which contains the text "Page not found" and a message about the page not existing or having moved.
    expect(await response.text()).toContain("Page not found");
    expect(await response.text()).toContain(
      "The page you're looking for doesn't exist or has moved.",
    );
  });

  test.describe("POST /api/contact tests without origin", () => {
    test("Obviously invalid payload should return FORBIDDEN and an error message", async ({
      request,
    }) => {
      const response = await request.post("/api/contact", {
        // A browser adds Origin to every POST; the API rejects a POST without it with a forbidden error.
        headers: { "Content-Type": "application/json" },
        data: { name: "Test", message: "Hello" },
      });

      expect(response.status()).toBe(FORBIDDEN);
      expect(await response.json()).toEqual({
        success: false,
        error: "Invalid request origin.",
      });
    });

    test("Close to valid payload should return FORBIDDEN and an error message", async ({
      request,
    }) => {
      const response = await request.post("/api/contact", {
        // A browser adds Origin to every POST; the API rejects a POST without it with a forbidden error.
        headers: { "Content-Type": "application/json" },
        data: {
          name: "Name",
          email: "Email@email.com",
          subject: "Email.com",
          message: "Email.comEmail.com",
          turnstileToken:
            "1.cAhuGr-QYJb97pz9MmmdV3of4ErI5JBmrZPeZYOOO790aTs_Su0VOclNnkXLObfYc_0bvgyV2bqT5RkngPqeWPP9AYO8yPd0uBUKjGYwPAAEc8eYE-Pk_asJsb0hpEF7T51wPkRVJVmdr3rulqJN47wDMutpeXCYfOo5JrLZbXEz_tzJUgz6q9UM85RnesqhLSu7VRGBuBZDzC_gawPXg5UsOxM7RAQbEWfhgfqQ64xQ6hDc_nl13uD9rkh0B3EHdhHoOML-S1rqHBYd8MK7gDLKYMNt90RrL44kCBo2zaggxKkNq_Lb9FToJ89Ggqu0KRoBz99xqkV797nb8JRbnJKHzp0PgnQxE2pP2g8KMCzTcZGgbGrPcCnY52nN_w8cwJPAask3jxQVuXFDCdZEaPuMgmDWALxJ095qKuxGnKHcwa3StjR_0x_jo5t3BPkcJFAORZfXpl1g7vqvDzea9W7dhG7mB2P4Uv4zCeRJI7TxAixXVF6bIhuavkG44bVpGZT6bJGgVeDn-IwLUxnlfDtds4ep7Obq5lEI-7SPNP_bfZqYE2aPbe7_Tp_R_h9uJNK9FUS4nTStubM_2O95R4BH7lcQq20Vy1XtvnE2ltefGiPtLx5gMfbJMNeZtSFv.McIj9_OV78uvbU1tAg0KtQ.eaad39745f770be3779a843a4b53b141d76eae888e3dd51b0cc0f26aNOT_FOUND7cf9f",
        },
      });

      expect(response.status()).toBe(FORBIDDEN);
      expect(await response.json()).toEqual({
        success: false,
        error: "Invalid request origin.",
      });
    });
  });

  test.describe("POST /api/contact tests with origin", () => {
    test.describe("All fields are required tests", () => {
      test("No payload", async ({ request, baseURL }) => {
        const response = await request.post("/api/contact", {
          // A browser adds Origin to every POST; the API rejects a POST without it.
          headers: { Origin: new URL(baseURL!).origin },
          data: {},
        });

        expect(response.status()).toBe(BAD_REQUEST);
        expect(await response.json()).toEqual({
          success: false,
          error: "All fields are required.",
        });
      });

      test("Test name and message of Hello", async ({ request, baseURL }) => {
        const response = await request.post("/api/contact", {
          // A browser adds Origin to every POST; the API rejects a POST without it.
          headers: { Origin: new URL(baseURL!).origin },
          data: { name: "Test", message: "Hello" },
        });

        expect(response.status()).toBe(BAD_REQUEST);
        expect(await response.json()).toEqual({
          success: false,
          error: "All fields are required.",
        });
      });

      test("Missing TurnstileToken in Payload", async ({
        request,
        baseURL,
      }) => {
        const response = await request.post("/api/contact", {
          // A browser adds Origin to every POST; the API rejects a POST without it.
          headers: { Origin: new URL(baseURL!).origin },
          data: {
            name: "Test",
            email: "Test@test.ai",
            subject: "Test subject",
            message: "Test message",
          },
        });

        expect(response.status()).toBe(BAD_REQUEST);
        expect(await response.json()).toEqual({
          success: false,
          error: "All fields are required.",
        });
      });
    });

    test("Should reject a request with a turnstile token that is invalid with a FORBIDDEN", async ({
      request,
      baseURL,
    }) => {
      const response = await request.post("/api/contact", {
        // A browser adds Origin to every POST; the API rejects a POST without it.
        headers: { Origin: new URL(baseURL!).origin },
        data: {
          name: "Name",
          email: "Email@email.com",
          subject: "Email.com",
          message: "Email.comEmail.com",
          turnstileToken:
            "1.cAhuGr-QYJb97pz9MmmdV3of4ErI5JBmrZPeZYOOO790aTs_Su0VOclNnkXLObfYc_0bvgyV2bqT5RkngPqeWPP9AYO8yPd0uBUKjGYwPAAEc8eYE-Pk_asJsb0hpEF7T51wPkRVJVmdr3rulqJN47wDMutpeXCYfOo5JrLZbXEz_tzJUgz6q9UM85RnesqhLSu7VRGBuBZDzC_gawPXg5UsOxM7RAQbEWfhgfqQ64xQ6hDc_nl13uD9rkh0B3EHdhHoOML-S1rqHBYd8MK7gDLKYMNt90RrL44kCBo2zaggxKkNq_Lb9FToJ89Ggqu0KRoBz99xqkV797nb8JRbnJKHzp0PgnQxE2pP2g8KMCzTcZGgbGrPcCnY52nN_w8cwJPAask3jxQVuXFDCdZEaPuMgmDWALxJ095qKuxGnKHcwa3StjR_0x_jo5t3BPkcJFAORZfXpl1g7vqvDzea9W7dhG7mB2P4Uv4zCeRJI7TxAixXVF6bIhuavkG44bVpGZT6bJGgVeDn-IwLUxnlfDtds4ep7Obq5lEI-7SPNP_bfZqYE2aPbe7_Tp_R_h9uJNK9FUS4nTStubM_2O95R4BH7lcQq20Vy1XtvnE2ltefGiPtLx5gMfbJMNeZtSFv.McIj9_OV78uvbU1tAg0KtQ.eaad39745f770be3779a843a4b53b141d76eae888e3dd51b0cc0f26aNOT_FOUND7cf9f",
        },
      });

      expect(response.status()).toBe(FORBIDDEN);
      expect(await response.json()).toEqual({
        success: false,
        error: "Spam verification failed. Please try again.",
      });
    });

    // Javascript's .json and JSON.parse functionality throws an error on "" and other invalid JSON, so the API never sees it.
    test.describe("Invalid JSON body tests", () => {
      test("Empty body", async ({ request, baseURL }) => {
        const response = await request.post("/api/contact", {
          // A browser adds Origin to every POST; the API rejects a POST without it.
          headers: { Origin: new URL(baseURL!).origin },
        });

        expect(response.status()).toBe(BAD_REQUEST);
        expect(await response.json()).toEqual({
          success: false,
          error: "Invalid JSON body.",
        });
      });

      test("Not a string", async ({ request, baseURL }) => {
        const response = await request.post("/api/contact", {
          // A browser adds Origin to every POST; the API rejects a POST without it.
          headers: { Origin: new URL(baseURL!).origin },
          data: "not a string",
        });

        expect(response.status()).toBe(BAD_REQUEST);
        expect(await response.json()).toEqual({
          success: false,
          error: "Invalid JSON body.",
        });
      });

      test("Close to a JSON object", async ({ request, baseURL }) => {
        const response = await request.post("/api/contact", {
          // A browser adds Origin to every POST; the API rejects a POST without it.
          headers: { Origin: new URL(baseURL!).origin },
          data: '{object: "not a JSON object"}', // Needs object keys to be in double quotes to be valid JSON.
        });

        expect(response.status()).toBe(BAD_REQUEST);
        expect(await response.json()).toEqual({
          success: false,
          error: "Invalid JSON body.",
        });
      });

      test("Malformed JSON", async ({ request, baseURL }) => {
        const response = await request.post("/api/contact", {
          // A browser adds Origin to every POST; the API rejects a POST without it.
          headers: { Origin: new URL(baseURL!).origin },
          data: '{"object": "not a JSON object"', // Needs object keys to be in double quotes to be valid JSON.
        });

        expect(response.status()).toBe(BAD_REQUEST);
        expect(await response.json()).toEqual({
          success: false,
          error: "Invalid JSON body.",
        });
      });

      // The API only sees valid JSON, so it can only reject valid JSON that doesn't match the expected schema.
      test("Number body", async ({ request, baseURL }) => {
        const response = await request.post("/api/contact", {
          // A browser adds Origin to every POST; the API rejects a POST without it.
          headers: { Origin: new URL(baseURL!).origin },
          data: 69,
        });

        expect(response.status()).toBe(BAD_REQUEST);
        expect(await response.json()).toEqual({
          success: false,
          error: "Invalid request body.",
        });
      });

      test("Null body", async ({ request, baseURL }) => {
        const response = await request.post("/api/contact", {
          // A browser adds Origin to every POST; the API rejects a POST without it.
          headers: { Origin: new URL(baseURL!).origin },
          data: null,
        });

        expect(response.status()).toBe(BAD_REQUEST);
        expect(await response.json()).toEqual({
          success: false,
          error: "Invalid request body.",
        });
      });
    });
  });
});
