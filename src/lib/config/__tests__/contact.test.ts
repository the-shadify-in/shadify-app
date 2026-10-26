import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { SITE_CONFIG, getConciergeWhatsAppUrl } from "../contact";

describe("SITE_CONFIG and getConciergeWhatsAppUrl", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("exports valid brand and concierge configuration", () => {
    expect(SITE_CONFIG.name).toBe("Shadify");
    expect(SITE_CONFIG.domain).toBeDefined();
    expect(SITE_CONFIG.supportEmail).toBe("concierge@shadify.in");
    expect(SITE_CONFIG.address).toContain("Indiranagar, Bengaluru");
  });

  it("generates a valid WhatsApp URL with default onboarding inquiry text", () => {
    const url = getConciergeWhatsAppUrl();
    expect(url).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);

    const parsed = new URL(url);
    expect(parsed.protocol).toBe("https:");
    expect(parsed.hostname).toBe("wa.me");
    expect(parsed.pathname).toBe(`/${SITE_CONFIG.whatsappNumber}`);

    const text = parsed.searchParams.get("text");
    expect(text).toContain("Namaste Shadify Team");
    expect(text).toContain("Bride & Groom Names:");
    expect(text).toContain("Wedding Date:");
    expect(text).toContain("City / Venue:");
    expect(text).toContain("Please share a preview and onboarding details.");
  });

  it("appends specific plan context when requested", () => {
    const liteUrl = getConciergeWhatsAppUrl({ plan: "lite" });
    expect(decodeURIComponent(liteUrl)).toContain("(LITE Plan)");

    const premiumUrl = getConciergeWhatsAppUrl({ plan: "premium" });
    expect(decodeURIComponent(premiumUrl)).toContain("(PREMIUM Plan)");

    const platinumUrl = getConciergeWhatsAppUrl({ plan: "platinum" });
    expect(decodeURIComponent(platinumUrl)).toContain("(PLATINUM Plan)");
  });

  it("appends theme preference when context includes theme", () => {
    const themedUrl = getConciergeWhatsAppUrl({ plan: "premium", theme: "Classic Red & Gold" });
    const decoded = decodeURIComponent(themedUrl);
    expect(decoded).toContain("(PREMIUM Plan)");
    expect(decoded).toContain("Preferred Theme: Classic Red & Gold");
  });

  it("supports custom string context (e.g. from error or legal pages)", () => {
    const customUrl = getConciergeWhatsAppUrl(
      "Hi, I need help with my refund request for INV-1002.",
    );
    const parsed = new URL(customUrl);
    expect(parsed.searchParams.get("text")).toBe(
      "Hi, I need help with my refund request for INV-1002.",
    );
  });

  it("encodes special characters, newlines, and bullet points properly for WhatsApp protocol", () => {
    const url = getConciergeWhatsAppUrl();
    // Raw URL should not contain raw unencoded newlines or unencoded spaces in query string
    expect(url).not.toContain("\n");
    expect(url).not.toContain(" ");
  });
});
