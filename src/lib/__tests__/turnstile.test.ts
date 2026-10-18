import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { verifyTurnstileToken, isTurnstileEnforced } from "../turnstile";

describe("Cloudflare Turnstile Verification Module", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("permits mock dev tokens when TURNSTILE_SECRET_KEY is absent in dev/test", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";

    const result = await verifyTurnstileToken("test-turnstile-token");
    expect(result.success).toBe(true);
  });

  it("fails safe in production if TURNSTILE_SECRET_KEY is missing", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";

    const result = await verifyTurnstileToken("any-token");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Turnstile secret key is not configured");
  });

  it("rejects empty or whitespace-only tokens when secret key is present", async () => {
    process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";

    const res1 = await verifyTurnstileToken("");
    expect(res1.success).toBe(false);

    const res2 = await verifyTurnstileToken("   ");
    expect(res2.success).toBe(false);
  });

  it("successfully verifies valid token with Cloudflare API", async () => {
    process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await verifyTurnstileToken("valid-token-from-client", "203.0.113.195");
    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("handles verification failure response from Cloudflare API", async () => {
    process.env.TURNSTILE_SECRET_KEY = "2x0000000000000000000000000000000AA";

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: false,
        "error-codes": ["invalid-input-response"],
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await verifyTurnstileToken("invalid-token", "203.0.113.195");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Bot protection verification failed");
    expect(result.errorCodes).toContain("invalid-input-response");
  });

  it("correctly identifies when Turnstile is enforced", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    expect(isTurnstileEnforced()).toBe(true);

    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    delete process.env.TURNSTILE_SECRET_KEY;
    expect(isTurnstileEnforced()).toBe(false);

    process.env.TURNSTILE_SECRET_KEY = "secret";
    expect(isTurnstileEnforced()).toBe(true);
  });
});
