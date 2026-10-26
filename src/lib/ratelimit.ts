import ipaddr from "ipaddr.js";
import "./env";
import { logger } from "./log";

function extractRouteLabel(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    // Strip query string and dynamic UUIDs to prevent PII or token leakage in logs
    return url.pathname.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      ":id",
    );
  } catch {
    return "unknown";
  }
}

/**
 * Groups IPv6 addresses to their /64 routing prefix to prevent address cycling,
 * handles compressed IPv6 addresses (2001:db8::1 -> 2001:db8:0:0::/64),
 * handles IPv4-mapped IPv6 (::ffff:192.0.2.1 -> 192.0.2.1),
 * and leaves standard IPv4 addresses unchanged.
 */
export function normalizeIp(ip: string): string {
  try {
    const trimmed = ip.trim();
    if (!trimmed) return "127.0.0.1";
    const parsed = ipaddr.parse(trimmed);
    if (parsed.kind() === "ipv4") {
      return parsed.toString();
    }
    const v6 = parsed as ipaddr.IPv6;
    if (v6.isIPv4MappedAddress()) {
      return v6.toIPv4Address().toString();
    }
    // First 4 parts represent the 64-bit network routing prefix
    const prefixParts = v6.parts.slice(0, 4);
    return prefixParts.map((n) => n.toString(16)).join(":") + "::/64";
  } catch {
    return ip.trim();
  }
}

export const UNTRUSTED_IP_SENTINEL = "untrusted-proxy-client";

/**
 * Safely extracts client IP from trusted edge proxy headers.
 * Avoids spoofing by strictly checking the configured proxy provider:
 * - If behind Cloudflare, uses 'cf-connecting-ip' ONLY when TRUSTED_PROXY_PROVIDER === "cloudflare"
 *   and verifies CLOUDFLARE_ORIGIN_VERIFY_SECRET if configured.
 * - In Vercel deployments, relies on Vercel's sanitized 'x-real-ip' (stripped of client injection).
 * - Never trusts arbitrary client-supplied 'x-forwarded-for'.
 * - If safe client identity cannot be verified, returns UNTRUSTED_IP_SENTINEL to throttle all unverified requests collectively.
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.BUILD_TARGET === "production";
  const proxyProvider = (process.env.TRUSTED_PROXY_PROVIDER?.toLowerCase() ?? "vercel") as
    "cloudflare" | "vercel" | "direct";

  // 1. Cloudflare deployment
  if (proxyProvider === "cloudflare") {
    const originSecret = process.env.CLOUDFLARE_ORIGIN_VERIFY_SECRET;
    if (!originSecret || originSecret.trim().length === 0) {
      if (isProduction) {
        console.error(
          "[SECURITY_ALERT] CLOUDFLARE_ORIGIN_VERIFY_SECRET is missing in production with Cloudflare proxy provider. Failing safe to untrusted sentinel.",
        );
        return UNTRUSTED_IP_SENTINEL;
      }
    } else if (headers.get("x-origin-verify-secret") !== originSecret) {
      console.warn(
        "[SECURITY_ALERT] Request with invalid or missing origin verification secret bypasses Cloudflare proxy",
      );
      return UNTRUSTED_IP_SENTINEL;
    }

    const cfIp = headers.get("cf-connecting-ip");
    if (cfIp && cfIp.trim().length > 0) {
      const trimmed = cfIp.trim();
      if (ipaddr.isValid(trimmed)) return normalizeIp(trimmed);
    }
    return UNTRUSTED_IP_SENTINEL;
  }

  // 2. Vercel deployment:
  // Vercel edge guarantees that:
  // a) x-vercel-forwarded-for contains the client IP directly from Vercel's proxy layer
  // b) x-forwarded-for has client IP as the first comma-separated entry (overwritten by Vercel edge)
  // c) x-real-ip is also provided directly by Vercel edge
  if (proxyProvider === "vercel") {
    const vercelForwarded = headers.get("x-vercel-forwarded-for");
    if (vercelForwarded && vercelForwarded.trim().length > 0) {
      const firstIp = vercelForwarded.split(",")[0]?.trim();
      if (firstIp && ipaddr.isValid(firstIp)) return normalizeIp(firstIp);
    }

    const forwarded = headers.get("x-forwarded-for");
    if (forwarded && forwarded.trim().length > 0) {
      const firstIp = forwarded.split(",")[0]?.trim();
      if (firstIp && ipaddr.isValid(firstIp)) return normalizeIp(firstIp);
    }

    const realIp = headers.get("x-real-ip");
    if (realIp && realIp.trim().length > 0) {
      const trimmed = realIp.trim();
      if (ipaddr.isValid(trimmed)) return normalizeIp(trimmed);
    }

    if (isProduction) {
      logger.warn(
        {
          method: request.method,
          route: extractRouteLabel(request.url),
        },
        "[SECURITY_ALERT] [RATE_LIMIT_SENTINEL] Request on Vercel proxy provider missing or malformed trusted IP headers. Assigning UNTRUSTED_IP_SENTINEL.",
      );
      return UNTRUSTED_IP_SENTINEL;
    }
    return "127.0.0.1";
  }

  // 3. Direct mode (only permitted in local development and automated testing)
  if (proxyProvider === "direct") {
    if (isProduction) {
      console.error(
        "[SECURITY_ALERT] TRUSTED_PROXY_PROVIDER='direct' is strictly forbidden in production. Failing safe to untrusted sentinel.",
      );
      return UNTRUSTED_IP_SENTINEL;
    }
    const realIp = headers.get("x-real-ip");
    if (realIp && realIp.trim().length > 0) return normalizeIp(realIp);
    return "127.0.0.1";
  }

  return UNTRUSTED_IP_SENTINEL;
}

interface RateLimitRecord {
  timestamps: number[];
}

const hitStore = new Map<string, RateLimitRecord>();

// Clean up expired records every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    hitStore.forEach((record, key) => {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 3600000); // 1 hour window
      if (record.timestamps.length === 0) {
        hitStore.delete(key);
      }
    });
  }, 300000);
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}

const MAX_LOCAL_ENTRIES = 5000;

/**
 * Check and record an action for a given identifier (IP / phone / token) using sliding window.
 * Scoped to individual server process/lambda instance memory.
 * Bounded to 5,000 entries max to prevent memory exhaustion under spoofed ID attacks.
 * @param identifier Unique key (e.g. `rsvp:slug:192.168.1.1` or `login:acc:ip:email`)
 * @param maxHits Maximum allowed submissions in the window
 * @param windowMs Window duration in milliseconds (default: 60,000ms = 1 minute)
 */
export function checkRateLimit(
  identifier: string,
  maxHits = 10,
  windowMs = 60000,
): RateLimitResult {
  const now = Date.now();
  let record = hitStore.get(identifier);

  if (!record) {
    if (hitStore.size >= MAX_LOCAL_ENTRIES) {
      // Bounded memory protection: prune oldest 10% of entries to prevent memory exhaustion
      const keysToDelete = Array.from(hitStore.keys()).slice(0, 500);
      keysToDelete.forEach((k) => hitStore.delete(k));
    }
    record = { timestamps: [] };
    hitStore.set(identifier, record);
  }

  // Filter timestamps within current sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxHits) {
    const oldest = record.timestamps[0] ?? now;
    const resetMs = Math.max(0, windowMs - (now - oldest));
    return {
      success: false,
      limit: maxHits,
      remaining: 0,
      resetMs,
    };
  }

  record.timestamps.push(now);

  return {
    success: true,
    limit: maxHits,
    remaining: maxHits - record.timestamps.length,
    resetMs: windowMs,
  };
}

import crypto from "crypto";

/**
 * Generates a privacy-preserving cryptographic hash of an IP address.
 * Ensures raw IP addresses are never transmitted to or stored in external distributed caches (Upstash).
 */
export function hashIpForStorage(ip: string): string {
  if (ip === UNTRUSTED_IP_SENTINEL) {
    return "untrusted_proxy_client_hash";
  }
  const normalized = normalizeIp(ip);
  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.BUILD_TARGET === "production";

  const salt = process.env.RATE_LIMIT_HASH_SECRET;
  if (!salt || salt.trim().length === 0) {
    if (isProduction) {
      console.error(
        "[FATAL_CONFIG_ERROR] RATE_LIMIT_HASH_SECRET is missing in production. Refusing to hash IP with insecure fallback.",
      );
      throw new Error(
        "FATAL_CONFIG_ERROR: RATE_LIMIT_HASH_SECRET is required in production for privacy-preserving IP hashing.",
      );
    }
    // Safe deterministic secret strictly for local development and unit tests
    return crypto
      .createHmac("sha256", "dev-test-rate-limit-hash-secret-min32chars")
      .update(normalized)
      .digest("hex")
      .slice(0, 16);
  }
  return crypto.createHmac("sha256", salt).update(normalized).digest("hex").slice(0, 16);
}

export interface DistributedRateLimitOptions {
  isLogin?: boolean;
  failClosed?: boolean; // Explicit policy: true for login/PIN; false for RSVP/guestbook
  fallbackLocalLimit?: number;
}

/**
 * Distributed rate limiting via Upstash Redis REST API using an atomic Lua script.
 * Guarantees atomicity: INCR, conditional EXPIRE, and TTL check occur in a single Redis transaction.
 * Completely eliminates race conditions between incrementing and setting expiry, preventing orphaned keys.
 */
export async function checkRateLimitDistributed(
  identifier: string,
  maxHits = 10,
  windowSeconds = 60,
  options?: DistributedRateLimitOptions,
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.BUILD_TARGET === "production";

  if (!url || !token) {
    if (isProduction) {
      logger.error(
        { identifier },
        "[SECURITY_ALERT] Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN in production! Distributed rate limiting cannot connect to shared backend.",
      );
      const shouldFailClosed =
        options?.failClosed !== undefined
          ? options.failClosed
          : isProduction && process.env.RATE_LIMIT_FAIL_CLOSED === "true";
      if (shouldFailClosed) {
        return {
          success: false,
          limit: maxHits,
          remaining: 0,
          resetMs: windowSeconds * 1000,
        };
      }
      const strictLimit = options?.fallbackLocalLimit ?? Math.min(maxHits, 30);
      return checkRateLimit(identifier, strictLimit, windowSeconds * 1000);
    }
    return checkRateLimit(identifier, maxHits, windowSeconds * 1000);
  }

  try {
    const key = `shadify:rl:${identifier}`;
    const luaScript =
      "local current = redis.call('INCR', KEYS[1]) if current == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end local ttl = redis.call('TTL', KEYS[1]) return {current, ttl}";

    const timeoutMs = Number(process.env.RATE_LIMIT_TIMEOUT_MS ?? 1500);
    const res = await fetch(`${url}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["EVAL", luaScript, 1, key, windowSeconds]),
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (res.ok) {
      const data = (await res.json()) as { result?: [number, number] };
      if (Array.isArray(data.result) && data.result.length >= 2) {
        const count = Number(data.result[0]) || 1;
        const ttlSeconds = Number(data.result[1]) || windowSeconds;
        return {
          success: count <= maxHits,
          limit: maxHits,
          remaining: Math.max(0, maxHits - count),
          resetMs: Math.max(0, ttlSeconds * 1000),
        };
      }
      throw new Error(`Upstash Redis returned invalid JSON format: ${JSON.stringify(data)}`);
    } else {
      throw new Error(`Upstash Redis returned HTTP ${res.status}: ${res.statusText}`);
    }
  } catch (err) {
    const shouldFailClosed =
      options?.failClosed !== undefined
        ? options.failClosed
        : isProduction && process.env.RATE_LIMIT_FAIL_CLOSED === "true";

    if (shouldFailClosed) {
      logger.error(
        { identifier, error: err instanceof Error ? err.message : String(err) },
        "[RATE_LIMIT_OUTAGE] Critical endpoint failing closed during Redis outage.",
      );
      return {
        success: false,
        limit: maxHits,
        remaining: 0,
        resetMs: windowSeconds * 1000,
      };
    }

    // Graceful degradation for guest-facing endpoints (RSVP, guestbook)
    logger.warn(
      { identifier, error: err instanceof Error ? err.message : String(err) },
      "[RATE_LIMIT_DEGRADED] Guest endpoint degrading to local sliding window limiter during Redis outage.",
    );
    const strictFallback = options?.fallbackLocalLimit ?? Math.min(maxHits, 30);
    return checkRateLimit(identifier, strictFallback, windowSeconds * 1000);
  }

  // Fallback to local sliding window
  const fallbackLimit = options?.isLogin
    ? (options?.fallbackLocalLimit ?? Math.min(maxHits, 5))
    : maxHits;
  return checkRateLimit(identifier, fallbackLimit, windowSeconds * 1000);
}

/**
 * Validates rate limit configuration for production deployments.
 * Rejects startup or deployment if Upstash Redis credentials or fail-closed enforcement are missing in production.
 */
export function validateRateLimitConfiguration(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.BUILD_TARGET === "production";

  if (isProduction && process.env.NEXT_PHASE !== "phase-production-build") {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    const failClosed = process.env.RATE_LIMIT_FAIL_CLOSED;

    if (!url || url.trim().length === 0) {
      errors.push(
        "UPSTASH_REDIS_REST_URL is required in production for distributed rate limiting across serverless instances.",
      );
    } else {
      try {
        new URL(url);
      } catch {
        errors.push("UPSTASH_REDIS_REST_URL must be a valid URL (e.g. https://*.upstash.io).");
      }
    }

    if (!token || token.trim().length === 0) {
      errors.push(
        "UPSTASH_REDIS_REST_TOKEN is required in production for distributed rate limiting.",
      );
    }

    if (failClosed !== "true") {
      errors.push(
        "RATE_LIMIT_FAIL_CLOSED must be explicitly set to 'true' in production to guarantee fail-closed enforcement under Redis outages.",
      );
    }

    const proxyProvider = (process.env.TRUSTED_PROXY_PROVIDER?.toLowerCase() ?? "vercel") as
      "cloudflare" | "vercel" | "direct";

    if (proxyProvider === "direct") {
      errors.push(
        "TRUSTED_PROXY_PROVIDER cannot be 'direct' in production. Must be 'cloudflare' or 'vercel' behind a verified edge proxy.",
      );
    }

    if (proxyProvider === "cloudflare") {
      const secret = process.env.CLOUDFLARE_ORIGIN_VERIFY_SECRET;
      if (!secret || secret.trim().length === 0) {
        errors.push(
          "CLOUDFLARE_ORIGIN_VERIFY_SECRET is required in production when TRUSTED_PROXY_PROVIDER='cloudflare' to prevent origin header spoofing.",
        );
      }
    }

    const hashSecret = process.env.RATE_LIMIT_HASH_SECRET;
    if (!hashSecret || hashSecret.trim().length < 32) {
      errors.push(
        "RATE_LIMIT_HASH_SECRET (at least 32 characters) is required in production for privacy-preserving IP hashing.",
      );
    }
  }

  return { valid: errors.length === 0, errors };
}
