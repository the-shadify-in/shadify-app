import { test, expect } from "@playwright/test";

test.describe("Shadify Public Marketing & Policy Pages", () => {
  test("landing page loads with key brand elements and pricing plans", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(/Shadify/i);

    // Verify Brand Hero Heading
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/wedding invitation that feels like royal mail/i);

    // Verify 3 Pricing Plans are present with INR pricing
    await expect(page.getByText("Lite", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("₹2,999")).toBeVisible();

    await expect(page.getByText("Premium", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("₹7,999")).toBeVisible();

    await expect(page.getByText("Platinum", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("₹19,999")).toBeVisible();

    // Verify Concierge WhatsApp CTAs are present
    const conciergeLinks = page.locator('a[href*="wa.me"]');
    await expect(conciergeLinks.first()).toBeVisible();

    // Verify Navigation to Policy Pages from Footer
    await expect(page.getByRole("link", { name: "Terms of Service" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Privacy Policy/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Refund & Postponement Policy/i })).toBeVisible();
  });

  test("policy pages (/terms, /privacy, /refunds) render successfully", async ({ page }) => {
    // Terms of Service
    await page.goto("/terms", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(/Terms of Service/i);
    await expect(page.getByRole("heading", { name: "Terms of Service" })).toBeVisible();
    await expect(page.getByText(/5-Year Web Hosting/i).first()).toBeVisible();

    // Privacy Policy
    await page.goto("/privacy", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(/Privacy Policy/i);
    await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
    await expect(page.getByText(/Zero Contact-Harvesting/i).first()).toBeVisible();

    // Refund Policy
    await page.goto("/refunds", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(/Cancellation & Refund Policy/i);
    await expect(page.getByText(/Cancellation & Cooling-Off Windows/i)).toBeVisible();
  });
});

test.describe("Shadify Guest Wedding Journey (/[slug])", () => {
  test("guest can view seeded wedding celebration and reveal envelope", async ({ page }) => {
    await page.goto("/priya-rahul", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(/priya-rahul/i);

    // Verify Wedding Couple and Itinerary
    await expect(page.getByText(/Priya/i).first()).toBeVisible();
    await expect(page.getByText(/Rahul/i).first()).toBeVisible();

    // Verify Itinerary events exist
    const itinerary = page.locator("body");
    await expect(itinerary).toContainText(/Sangeet|Vivah|Mehendi/i);

    // Verify Direct UPI / Shagun Gifting section is present
    await expect(page.getByText(/Shagun|Gifting|Blessings/i).first()).toBeVisible();
  });

  test("legacy /w/:slug path permanently redirects to clean direct /:slug", async ({ page }) => {
    const response = await page.goto("/w/priya-rahul");
    expect(response?.url()).toContain("/priya-rahul");
    expect(response?.url()).not.toContain("/w/priya-rahul");
  });
});

test.describe("Shadify Security, Middleware & API Smoke Tests", () => {
  test("unauthenticated access to /admin redirects to /admin/login", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/admin\/login\?from=%2Fadmin/);
    await expect(page.getByRole("heading", { name: /Staff Concierge/i })).toBeVisible();
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
  });

  test("middleware rejects malicious probe patterns with 404", async ({ request }) => {
    const resPhp = await request.get("/index.php");
    expect(resPhp.status()).toBe(404);

    const resEnv = await request.get("/.env");
    expect(resEnv.status()).toBe(404);

    const resMalformedSlug = await request.get("/INVALID__SLUG!!");
    expect(resMalformedSlug.status()).toBe(404);
  });

  test("system health endpoint returns json response with live database", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("status", "healthy");
    expect(body).toHaveProperty("services");
    expect(body.services).toHaveProperty("api", "up");
    expect(body.services).toHaveProperty("database", "up");
    expect(body).toHaveProperty("uptimeSeconds");
  });

  test("promo code validation endpoint validates active partner codes against Neon DB", async ({
    request,
  }) => {
    // Valid code test
    const validRes = await request.post("/api/promos/validate", {
      data: { code: "STUDIOPARTNER", plan: "premium" },
    });
    expect(validRes.ok()).toBe(true);
    const validData = await validRes.json();
    expect(validData.success).toBe(true);
    expect(validData.data.valid).toBe(true);
    expect(validData.data.code).toBe("STUDIOPARTNER");
    expect(validData.data.discountPaise).toBe(29900); // ₹299 standard discount

    // Invalid code test
    const invalidRes = await request.post("/api/promos/validate", {
      data: { code: "NONEXISTENT_CODE_XYZ", plan: "premium" },
    });
    expect(invalidRes.status()).toBe(404);
    const invalidData = await invalidRes.json();
    expect(invalidData.error).toContain("invalid or does not exist");
  });
});
