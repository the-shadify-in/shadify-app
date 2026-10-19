import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { normalizeIp, getClientIp } from "../ratelimit";

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

  describe("getClientIp (Anti-Spoofing & Platform Headers)", () => {
    it("uses x-real-ip in standard Vercel / reverse proxy deployment and ignores client-supplied cf-connecting-ip", () => {
      const req = new Request("http://localhost:3000/api/test", {
        headers: {
          "x-real-ip": "203.0.113.195",
          "cf-connecting-ip": "198.51.100.99", // Spoofed header
        },
      });
      // Without TRUSTED_PROXY_PROVIDER=cloudflare, cf-connecting-ip is ignored
      expect(getClientIp(req)).toBe("203.0.113.195");
    });

    it("reads cf-connecting-ip ONLY when TRUSTED_PROXY_PROVIDER is set to cloudflare", () => {
      process.env.TRUSTED_PROXY_PROVIDER = "cloudflare";
      const req = new Request("http://localhost:3000/api/test", {
        headers: {
          "cf-connecting-ip": "198.51.100.99",
          "x-real-ip": "203.0.113.195",
        },
      });
      expect(getClientIp(req)).toBe("198.51.100.99");
    });

    it("uses the leftmost IP from sanitized x-forwarded-for header", () => {
      const req = new Request("http://localhost:3000/api/test", {
        headers: {
          "x-forwarded-for": "198.51.100.42, 10.0.0.1",
        },
      });
      expect(getClientIp(req)).toBe("198.51.100.42");
    });

    it("falls back to 127.0.0.1 if no headers are present", () => {
      const req = new Request("http://localhost:3000/api/test");
      expect(getClientIp(req)).toBe("127.0.0.1");
    });
  });
});
