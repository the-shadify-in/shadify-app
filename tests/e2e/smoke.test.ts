import { test, expect } from "@playwright/test";

test.describe("Shadify Smoke Suite", () => {
  test("landing page loads with key brand elements", async ({ page }) => {
    await page.goto("/");
    // Expect page to be reachable and contain title or main heading
    await expect(page).toHaveTitle(/Shadify/i);
  });
});
