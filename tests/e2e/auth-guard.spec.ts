import { test, expect } from "@playwright/test";

/**
 * Route protection: /app/* must redirect logged-out visitors to sign-in.
 * API routes must reject unauthenticated callers with 401.
 * Requires the dev server; Supabase env needed for full auth flows
 * (see docs/TESTING.md). Guard checks work with any env.
 */

const APP_ROUTES = [
  "/app/dashboard",
  "/app/documents",
  "/app/ask",
  "/app/summaries",
  "/app/compare",
  "/app/extracted",
  "/app/usage",
  "/app/settings",
] as const;

for (const path of APP_ROUTES) {
  test(`${path} redirects logged-out users to sign-in`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/sign-in\?next=/);
  });
}

test("GET /api/documents rejects unauthenticated callers", async ({ request }) => {
  const res = await request.get("/api/documents");
  expect(res.status()).toBe(401);
  expect((await res.json()).error).toMatch(/sign in/i);
});

test("POST /api/chat rejects unauthenticated callers", async ({ request }) => {
  const res = await request.post("/api/chat", {
    data: {
      documentId: "123e4567-e89b-12d3-a456-426614174000",
      message: "What is this about?",
    },
  });
  expect(res.status()).toBe(401);
});

test("POST /api/documents/upload rejects unauthenticated callers", async ({ request }) => {
  const res = await request.post("/api/documents/upload", {
    multipart: {
      file: {
        name: "test.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("hello world"),
      },
    },
  });
  expect(res.status()).toBe(401);
});

test("sign-in page shows validation for bad credentials", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel(/email/i).fill("nobody@example.com");
  await page.getByLabel("Password").fill("wrongpassword123");
  await page.getByRole("button", { name: /sign in/i }).click();
  // Either a Supabase error message or a network error — never a silent success.
  await expect(page.getByRole("alert")).toBeVisible({ timeout: 15000 });
});
