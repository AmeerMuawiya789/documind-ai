import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests. Run the dev server first (`npm run dev`),
 * then `npm run test:e2e`. Auth tests use a throwaway Supabase user;
 * see docs/TESTING.md for the full setup.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: undefined, // start `npm run dev` yourself; see docs/TESTING.md
});
