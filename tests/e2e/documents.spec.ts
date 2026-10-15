import { test, expect } from "@playwright/test";

/**
 * Authenticated document flows. Requires a Supabase project with the
 * migrations applied and a test user. Set E2E_EMAIL / E2E_PASSWORD and
 * ensure DOCUMIND_MOCK_AI=true (or a real AI key) before running.
 * Skipped automatically when credentials are absent.
 */

const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;
const hasCreds = Boolean(EMAIL && PASSWORD);

test.describe("authenticated document flows", () => {
  test.skip(!hasCreds, "E2E_EMAIL/E2E_PASSWORD not set");

  test.beforeEach(async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel(/email/i).fill(EMAIL!);
    await page.getByLabel("Password").fill(PASSWORD!);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 15000 });
  });

  test("upload a text file and see it become ready", async ({ page }) => {
    await page.goto("/app/documents");
    await page.getByRole("button", { name: /upload document/i }).click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles("tests/e2e/fixtures/sample.txt");

    await page.getByRole("button", { name: /upload & process/i }).click();
    // Lands on the viewer page for the new document.
    await expect(page).toHaveURL(/\/app\/documents\/.+/, { timeout: 30000 });
    await expect(page.getByText("ready", { exact: false }).first()).toBeVisible({ timeout: 60000 });
  });

  test("ask a question about the uploaded document", async ({ page }) => {
    await page.goto("/app/ask");
    // Pick the first ready document.
    await page.locator("#doc-select").click();
    const first = page.getByRole("option").first();
    await first.click();

    await page.getByLabel(/your question/i).fill("What is this document about?");
    await page.getByRole("button", { name: /send question/i }).click();

    // Mock AI answers deterministically; real AI answers with citations.
    await expect(page.locator("text=Thinking")).toBeHidden({ timeout: 90000 });
  });

  test("document search filters the list", async ({ page }) => {
    await page.goto("/app/documents");
    await page.getByLabel(/search documents/i).fill("sample");
    await expect(page.getByText("sample.txt")).toBeVisible({ timeout: 15000 });
  });
});
