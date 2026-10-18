import { describe, it, expect } from "vitest";
import { PRICING_PLANS } from "../pricing";

describe("Authoritative Pricing Tiers", () => {
  it("enforces exact price points in INR and paise", () => {
    expect(PRICING_PLANS.lite.priceInr).toBe(2999);
    expect(PRICING_PLANS.lite.pricePaise).toBe(299900);

    expect(PRICING_PLANS.premium.priceInr).toBe(7999);
    expect(PRICING_PLANS.premium.pricePaise).toBe(799900);

    expect(PRICING_PLANS.platinum.priceInr).toBe(19999);
    expect(PRICING_PLANS.platinum.pricePaise).toBe(1999900);
  });

  it("enforces 5-year hosting and 90-day RAW photo retention across all plans", () => {
    for (const plan of Object.values(PRICING_PLANS)) {
      expect(plan.hostingDurationYears).toBe(5);
      expect(plan.rawOriginalsRetentionDays).toBe(90);
    }
  });

  it("correctly gates branding and custom domain entitlements", () => {
    expect(PRICING_PLANS.lite.canHideBranding).toBe(false);
    expect(PRICING_PLANS.lite.canCustomDomain).toBe(false);

    expect(PRICING_PLANS.premium.canHideBranding).toBe(true);
    expect(PRICING_PLANS.premium.canCustomDomain).toBe(false);

    expect(PRICING_PLANS.platinum.canHideBranding).toBe(true);
    expect(PRICING_PLANS.platinum.canCustomDomain).toBe(true);
  });
});
