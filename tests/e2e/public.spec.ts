import { test, expect } from "@playwright/test";

/**
 * Public marketing pages. No auth, no Supabase needed.
 * Run: npm run dev (terminal 1), then npm run test:e2e -- public
 */

const PUBLIC_PAGES = [
  "/",
  "/features",
  "/how-it-works",
  "/security",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
] as const;

for (const path of PUBLIC_PAGES) {
  test(`public page ${path} renders without errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto(path);
    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator("body")).not.toContainText("Application error");
    expect(errors).toEqual([]);
  });
}

test("home page has primary CTAs", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /start free/i }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /see how it works/i })).toBeVisible();
});

test("pricing redirects to home (billing removed)", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: /free forever/i })).toBeVisible();
});

test("mobile menu opens and navigates", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: /toggle menu/i });
  if (await toggle.isVisible()) {
    await toggle.click();
    await page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "FAQ" }).click();
    await expect(page).toHaveURL(/\/faq/);
  } else {
    test.skip(true, "Desktop viewport: mobile menu hidden");
  }
});

test("sitemap and robots are served", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("<urlset");

  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  const body = await robots.text();
  expect(body).toContain("Disallow: /app/");
  expect(body).toContain("Disallow: /api/");
});
