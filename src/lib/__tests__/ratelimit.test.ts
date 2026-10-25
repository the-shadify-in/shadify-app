import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  normalizeIp,
  getClientIp,
  checkRateLimitDistributed,
  validateRateLimitConfiguration,
} from "../ratelimit";

describe("Rate Limiting IP Extraction & Normalization", () => {
  const originalEnv = process.env.TRUSTED_PROXY_PROVIDER;

  beforeEach(() => {
    delete process.env.TRUSTED_PROXY_PROVIDER;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.TRUSTED_PROXY_PROVIDER = originalEnv;
    } else {
      delete process.env.TRUSTED_PROXY_PROVIDER;
    }
  });

  describe("normalizeIp (IPv4, IPv6 /64 Prefix, IPv4-Mapped)", () => {
    it("leaves standard IPv4 addresses unchanged", () => {
      expect(normalizeIp("192.168.1.1")).toBe("192.168.1.1");
      expect(normalizeIp("10.0.0.254")).toBe("10.0.0.254");
    });

    it("correctly unwraps IPv4-mapped IPv6 addresses (::ffff:192.0.2.128)", () => {
      expect(normalizeIp("::ffff:192.0.2.128")).toBe("192.0.2.128");
      expect(normalizeIp("::ffff:10.10.10.10")).toBe("10.10.10.10");
    });

    it("normalizes compressed IPv6 addresses to their /64 prefix (2001:db8::1)", () => {
      const ip1 = normalizeIp("2001:db8::1");
      const ip2 = normalizeIp("2001:db8::2");
      expect(ip1).toBe("2001:db8:0:0::/64");
      expect(ip2).toBe("2001:db8:0:0::/64");
      expect(ip1).toBe(ip2); // Same /64 prefix blocks address cycling!
    });

    it("normalizes full 8-hextet IPv6 addresses to their /64 prefix", () => {
      expect(normalizeIp("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe("2001:db8:85a3:0::/64");
    });

    it("gracefully falls back on empty or invalid IP strings", () => {
      expect(normalizeIp("")).toBe("127.0.0.1");
      expect(normalizeIp("invalid-ip-string")).toBe("invalid-ip-string");
    });
  });

  describe("getClientIp (Anti-Spoofing & Trusted Proxy Boundary)", () => {
    beforeEach(() => {
      vi.unstubAllEnvs();
    });

    it("prefers x-vercel-forwarded-for on Vercel deployment over x-forwarded-for and x-real-ip", () => {
      process.env.TRUSTED_PROXY_PROVIDER = "vercel";
      const req = new Request("http://localhost:3000/api/test", {
        headers: {
          "x-vercel-forwarded-for": "203.0.113.10, 10.0.0.1",
          "x-forwarded-for": "198.51.100.20",
          "x-real-ip": "198.51.100.30",
        },
      });
      expect(getClientIp(req)).toBe("203.0.113.10");
    });

    it("falls back to first entry in x-forwarded-for on Vercel when x-vercel-forwarded-for is missing", () => {
      process.env.TRUSTED_PROXY_PROVIDER = "vercel";
      const req = new Request("http://localhost:3000/api/test", {
        headers: {
          "x-forwarded-for": "203.0.113.50, 10.0.0.2",
          "x-real-ip": "198.51.100.30",
        },
      });
      expect(getClientIp(req)).toBe("203.0.113.50");
    });

    it("falls back to x-real-ip on Vercel when forwarded headers are missing", () => {
      process.env.TRUSTED_PROXY_PROVIDER = "vercel";
      const req = new Request("http://localhost:3000/api/test", {
        headers: {
          "x-real-ip": "203.0.113.195",
        },
      });
      expect(getClientIp(req)).toBe("203.0.113.195");
    });

    it("rejects malformed IP headers on Vercel and falls safe to untrusted sentinel in production", () => {
      vi.stubEnv("NODE_ENV", "production");
      process.env.TRUSTED_PROXY_PROVIDER = "vercel";
      const req = new Request("http://localhost:3000/api/test", {
        headers: {
          "x-vercel-forwarded-for": "malformed_ip_value",
          "x-forwarded-for": "another_bad_ip",
          "x-real-ip": "totally-invalid",
        },
      });
      expect(getClientIp(req)).toBe("untrusted-proxy-client");
    });

    it("logs a security warning via structured logger with method and route label (no query) and returns untrusted sentinel when all trusted headers are missing in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      process.env.TRUSTED_PROXY_PROVIDER = "vercel";
      const { logger } = await import("../log");
      const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});

      const req = new Request(
        "http://localhost:3000/api/weddings/secret-slug-123/verify-pin?token=sensitive-preview-token",
        {
          method: "POST",
        },
      );

      const clientIp = getClientIp(req);
      expect(clientIp).toBe("untrusted-proxy-client");
      expect(warnSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          route: "/api/weddings/secret-slug-123/verify-pin", // Route path only, no ?token=
        }),
        expect.stringContaining("[RATE_LIMIT_SENTINEL]"),
      );
      warnSpy.mockRestore();
    });

    it("reads cf-connecting-ip ONLY when TRUSTED_PROXY_PROVIDER is set to cloudflare with valid origin secret", () => {
      process.env.TRUSTED_PROXY_PROVIDER = "cloudflare";
      process.env.CLOUDFLARE_ORIGIN_VERIFY_SECRET = "super_secret_origin_pull_token_123";
      const req = new Request("http://localhost:3000/api/test", {
        headers: {
          "cf-connecting-ip": "198.51.100.99",
          "x-origin-verify-secret": "super_secret_origin_pull_token_123",
          "x-real-ip": "203.0.113.195",
        },
      });
      expect(getClientIp(req)).toBe("198.51.100.99");
    });

    it("verifies CLOUDFLARE_ORIGIN_VERIFY_SECRET when configured behind Cloudflare", () => {
      process.env.TRUSTED_PROXY_PROVIDER = "cloudflare";
      process.env.CLOUDFLARE_ORIGIN_VERIFY_SECRET = "super_secret_origin_pull_token_123";

      const validReq = new Request("http://localhost:3000/api/test", {
        headers: {
          "cf-connecting-ip": "198.51.100.99",
          "x-origin-verify-secret": "super_secret_origin_pull_token_123",
        },
      });
      expect(getClientIp(validReq)).toBe("198.51.100.99");

      // Attacker bypassing Cloudflare with invalid origin secret
      const invalidReq = new Request("http://localhost:3000/api/test", {
        headers: {
          "cf-connecting-ip": "198.51.100.99",
          "x-origin-verify-secret": "wrong_secret",
        },
      });
      expect(getClientIp(invalidReq)).toBe("untrusted-proxy-client");
    });

    it("fails safe to untrusted-proxy-client in production when Cloudflare is selected but CLOUDFLARE_ORIGIN_VERIFY_SECRET is missing", () => {
      vi.stubEnv("NODE_ENV", "production");
      process.env.TRUSTED_PROXY_PROVIDER = "cloudflare";
      delete process.env.CLOUDFLARE_ORIGIN_VERIFY_SECRET;

      const req = new Request("http://localhost:3000/api/test", {
        headers: {
          "cf-connecting-ip": "198.51.100.99",
        },
      });
      expect(getClientIp(req)).toBe("untrusted-proxy-client");
    });

    it("fails safe to untrusted-proxy-client when Cloudflare request has missing cf-connecting-ip", () => {
      process.env.TRUSTED_PROXY_PROVIDER = "cloudflare";
      process.env.CLOUDFLARE_ORIGIN_VERIFY_SECRET = "valid_secret";

      const req = new Request("http://localhost:3000/api/test", {
        headers: {
          "x-origin-verify-secret": "valid_secret",
          // cf-connecting-ip omitted
        },
      });
      expect(getClientIp(req)).toBe("untrusted-proxy-client");
    });

    it("never trusts arbitrary client-supplied x-forwarded-for header in non-Vercel mode without proxy authentication", () => {
      process.env.TRUSTED_PROXY_PROVIDER = "cloudflare";
      delete process.env.CLOUDFLARE_ORIGIN_VERIFY_SECRET;
      const req = new Request("http://localhost:3000/api/test", {
        headers: {
          "x-forwarded-for": "198.51.100.42, 10.0.0.1",
        },
      });
      expect(getClientIp(req)).toBe("untrusted-proxy-client");
    });

    it("returns untrusted-proxy-client sentinel in production when trusted headers are missing", () => {
      vi.stubEnv("NODE_ENV", "production");
      process.env.TRUSTED_PROXY_PROVIDER = "vercel";
      const req = new Request("http://localhost:3000/api/test"); // All trusted headers missing
      expect(getClientIp(req)).toBe("untrusted-proxy-client");
    });

    it("returns 127.0.0.1 in development when no proxy headers are present", () => {
      vi.stubEnv("NODE_ENV", "development");
      process.env.TRUSTED_PROXY_PROVIDER = "vercel";
      const req = new Request("http://localhost:3000/api/test");
      expect(getClientIp(req)).toBe("127.0.0.1");
    });
  });

  describe("validateRateLimitConfiguration (Operational Guarantee)", () => {
    beforeEach(() => {
      vi.unstubAllEnvs();
    });
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("passes cleanly in development or test without requiring Redis", () => {
      vi.stubEnv("NODE_ENV", "test");
      const res = validateRateLimitConfiguration();
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });

    it("rejects startup in production when Redis configuration or fail-closed enforcement is missing", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("NEXT_PHASE", "");
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      delete process.env.RATE_LIMIT_FAIL_CLOSED;

      const res = validateRateLimitConfiguration();
      expect(res.valid).toBe(false);
      expect(res.errors).toContain(
        "UPSTASH_REDIS_REST_URL is required in production for distributed rate limiting across serverless instances.",
      );
      expect(res.errors).toContain(
        "UPSTASH_REDIS_REST_TOKEN is required in production for distributed rate limiting.",
      );
      expect(res.errors).toContain(
        "RATE_LIMIT_FAIL_CLOSED must be explicitly set to 'true' in production to guarantee fail-closed enforcement under Redis outages.",
      );
    });

    it("accepts valid production configuration with URL, token, and RATE_LIMIT_FAIL_CLOSED=true", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("NEXT_PHASE", "");
      vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://valid-redis.upstash.io");
      vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "valid-upstash-token");
      vi.stubEnv("RATE_LIMIT_FAIL_CLOSED", "true");
      vi.stubEnv("RATE_LIMIT_HASH_SECRET", "super_secure_rate_limit_hash_secret_32_long");

      const res = validateRateLimitConfiguration();
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });
  });

  describe("checkRateLimitDistributed (Credentials, Outages, Timeouts, & Fail-Closed/Open)", () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      vi.unstubAllEnvs();
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.unstubAllEnvs();
      global.fetch = originalFetch;
    });

    it("fails closed on missing Redis credentials in production when RATE_LIMIT_FAIL_CLOSED=true", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("RATE_LIMIT_FAIL_CLOSED", "true");
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      const res = await checkRateLimitDistributed("test-key-fail-closed", 10, 60);
      expect(res.success).toBe(false);
      expect(res.remaining).toBe(0);
    });

    it("gracefully degrades guest endpoints (failClosed: false) to local sliding window limiter on Redis outage", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("RATE_LIMIT_FAIL_CLOSED", "true");
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      const res = await checkRateLimitDistributed("guest-rsvp-key", 60, 60, {
        failClosed: false,
        fallbackLocalLimit: 30,
      });
      expect(res.success).toBe(true);
      expect(res.limit).toBe(30);
    });

    it("falls back to local memory if RATE_LIMIT_FAIL_CLOSED is not true (fail-open)", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("RATE_LIMIT_FAIL_CLOSED", "false");
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      const res = await checkRateLimitDistributed("test-key-fail-open", 10, 60);
      expect(res.success).toBe(true);
      expect(res.remaining).toBe(9);
    });

    it("fails closed on upstream Redis HTTP 500 error when RATE_LIMIT_FAIL_CLOSED=true", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://mock.upstash.io");
      vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "mock-token");
      vi.stubEnv("RATE_LIMIT_FAIL_CLOSED", "true");

      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response("Internal Server Error", {
          status: 500,
          statusText: "Internal Server Error",
        }),
      );

      const res = await checkRateLimitDistributed("test-redis-500", 10, 60);
      expect(res.success).toBe(false);
      expect(res.remaining).toBe(0);
    });

    it("fails closed on upstream Redis timeout / network abort when RATE_LIMIT_FAIL_CLOSED=true", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://mock.upstash.io");
      vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "mock-token");
      vi.stubEnv("RATE_LIMIT_FAIL_CLOSED", "true");

      vi.mocked(global.fetch).mockRejectedValueOnce(
        new DOMException("The operation was aborted due to timeout", "TimeoutError"),
      );

      const res = await checkRateLimitDistributed("test-redis-timeout", 10, 60);
      expect(res.success).toBe(false);
      expect(res.remaining).toBe(0);
    });

    it("fails closed when Upstash Redis returns malformed non-array JSON result", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://mock.upstash.io");
      vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "mock-token");
      vi.stubEnv("RATE_LIMIT_FAIL_CLOSED", "true");

      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ result: "invalid_scalar_payload" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const res = await checkRateLimitDistributed("test-redis-malformed", 10, 60);
      expect(res.success).toBe(false);
      expect(res.remaining).toBe(0);
    });

    it("returns successful distributed limit decision when Redis returns valid Lua evaluation", async () => {
      vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://mock.upstash.io");
      vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "mock-token");

      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ result: [3, 45] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const res = await checkRateLimitDistributed("distributed-ok-key", 10, 60);
      expect(res.success).toBe(true);
      expect(res.remaining).toBe(7);
      expect(res.resetMs).toBe(45000);
    });
  });

  describe("validateRateLimitConfiguration (Edge Proxy Boundaries)", () => {
    it("rejects Cloudflare provider in production when CLOUDFLARE_ORIGIN_VERIFY_SECRET is missing", async () => {
      vi.stubEnv("NODE_ENV", "production");
      delete process.env.NEXT_PHASE;
      process.env.UPSTASH_REDIS_REST_URL = "https://mock.upstash.io";
      process.env.UPSTASH_REDIS_REST_TOKEN = "tok";
      process.env.RATE_LIMIT_FAIL_CLOSED = "true";
      process.env.TRUSTED_PROXY_PROVIDER = "cloudflare";
      delete process.env.CLOUDFLARE_ORIGIN_VERIFY_SECRET;

      const { validateRateLimitConfiguration } = await import("../ratelimit");
      const config = validateRateLimitConfiguration();
      expect(config.valid).toBe(false);
      expect(config.errors.some((e) => e.includes("CLOUDFLARE_ORIGIN_VERIFY_SECRET"))).toBe(true);
    });

    it("accepts Cloudflare provider in production when CLOUDFLARE_ORIGIN_VERIFY_SECRET is configured", async () => {
      vi.stubEnv("NODE_ENV", "production");
      delete process.env.NEXT_PHASE;
      process.env.UPSTASH_REDIS_REST_URL = "https://mock.upstash.io";
      process.env.UPSTASH_REDIS_REST_TOKEN = "tok";
      process.env.RATE_LIMIT_FAIL_CLOSED = "true";
      process.env.TRUSTED_PROXY_PROVIDER = "cloudflare";
      process.env.CLOUDFLARE_ORIGIN_VERIFY_SECRET = "production_secret_token_abc123";
      process.env.RATE_LIMIT_HASH_SECRET = "super_secure_rate_limit_hash_secret_32_long";

      const { validateRateLimitConfiguration } = await import("../ratelimit");
      const config = validateRateLimitConfiguration();
      expect(config.valid).toBe(true);
      expect(config.errors).toHaveLength(0);
    });

    it("rejects direct mode in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      delete process.env.NEXT_PHASE;
      process.env.UPSTASH_REDIS_REST_URL = "https://mock.upstash.io";
      process.env.UPSTASH_REDIS_REST_TOKEN = "tok";
      process.env.RATE_LIMIT_FAIL_CLOSED = "true";
      process.env.TRUSTED_PROXY_PROVIDER = "direct";
      process.env.RATE_LIMIT_HASH_SECRET = "super_secure_rate_limit_hash_secret_32_long";

      const { validateRateLimitConfiguration } = await import("../ratelimit");
      const config = validateRateLimitConfiguration();
      expect(config.valid).toBe(false);
      expect(config.errors.some((e) => e.includes("cannot be 'direct'"))).toBe(true);
    });

    it("rejects production when RATE_LIMIT_HASH_SECRET is missing or less than 32 characters", async () => {
      vi.stubEnv("NODE_ENV", "production");
      delete process.env.NEXT_PHASE;
      process.env.UPSTASH_REDIS_REST_URL = "https://mock.upstash.io";
      process.env.UPSTASH_REDIS_REST_TOKEN = "tok";
      process.env.RATE_LIMIT_FAIL_CLOSED = "true";
      process.env.TRUSTED_PROXY_PROVIDER = "vercel";
      process.env.RATE_LIMIT_HASH_SECRET = "short_secret"; // <32 chars

      const { validateRateLimitConfiguration } = await import("../ratelimit");
      const config = validateRateLimitConfiguration();
      expect(config.valid).toBe(false);
      expect(config.errors.some((e) => e.includes("RATE_LIMIT_HASH_SECRET"))).toBe(true);
    });
  });

  describe("hashIpForStorage", () => {
    it("throws FATAL_CONFIG_ERROR in production when RATE_LIMIT_HASH_SECRET is missing", async () => {
      vi.stubEnv("NODE_ENV", "production");
      delete process.env.RATE_LIMIT_HASH_SECRET;

      const { hashIpForStorage } = await import("../ratelimit");
      expect(() => hashIpForStorage("203.0.113.195")).toThrow(
        /RATE_LIMIT_HASH_SECRET is required in production/,
      );
    });

    it("hashes IP consistently using RATE_LIMIT_HASH_SECRET and maps untrusted sentinel consistently", async () => {
      process.env.RATE_LIMIT_HASH_SECRET = "test_rate_limit_hash_secret_32_chars_long";
      const { hashIpForStorage, UNTRUSTED_IP_SENTINEL } = await import("../ratelimit");

      const hash1 = hashIpForStorage("203.0.113.195");
      const hash2 = hashIpForStorage("203.0.113.195");
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(16);

      const sentinelHash = hashIpForStorage(UNTRUSTED_IP_SENTINEL);
      expect(sentinelHash).toBe("untrusted_proxy_client_hash");
    });
  });
});
