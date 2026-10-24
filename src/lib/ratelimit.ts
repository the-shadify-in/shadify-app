import ipaddr from "ipaddr.js";

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

/**
 * Safely extracts client IP from trusted edge proxy headers.
 * Avoids spoofing by strictly checking the configured proxy provider:
 * - If behind Cloudflare, uses 'cf-connecting-ip' ONLY when TRUSTED_PROXY_PROVIDER === "cloudflare".
 * - In standard Vercel deployments, relies on Vercel's sanitized 'x-real-ip' and 'x-forwarded-for'.
 * - Rejects unverified client-supplied headers.
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  const proxyProvider = process.env.TRUSTED_PROXY_PROVIDER?.toLowerCase();

  // 1. Cloudflare's connecting IP (only if explicitly configured as trusted proxy)
  if (proxyProvider === "cloudflare") {
    const cfIp = headers.get("cf-connecting-ip");
    if (cfIp && cfIp.trim().length > 0) return normalizeIp(cfIp);
  }

  // 2. Vercel / Standard reverse proxy platform headers (sanitized by edge)
  const realIp = headers.get("x-real-ip");
  if (realIp && realIp.trim().length > 0) return normalizeIp(realIp);

  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor && forwardedFor.trim().length > 0) {
    const candidate = forwardedFor.split(",")[0]?.trim();
    if (candidate) return normalizeIp(candidate);
  }

  return "127.0.0.1";
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

/**
 * Check and record an action for a given identifier (IP / phone / token) using sliding window.
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

/**
 * Distributed rate limiting via Upstash Redis REST API using an atomic Lua script.
 * Guarantees atomicity: INCR, conditional EXPIRE, and TTL check occur in a single Redis transaction.
 * Completely eliminates race conditions between incrementing and setting expiry, preventing orphaned keys.
 */
export async function checkRateLimitDistributed(
  identifier: string,
  maxHits = 10,
  windowSeconds = 60,
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      const key = `shadify:rl:${identifier}`;
      const luaScript =
        "local current = redis.call('INCR', KEYS[1]) if current == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end local ttl = redis.call('TTL', KEYS[1]) return {current, ttl}";

      const res = await fetch(`${url}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(["EVAL", luaScript, 1, key, windowSeconds]),
        cache: "no-store",
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
      }
    } catch {
      // If fail-closed is configured in production, reject requests on limiter outage
      if (process.env.NODE_ENV === "production" && process.env.RATE_LIMIT_FAIL_CLOSED === "true") {
        return {
          success: false,
          limit: maxHits,
          remaining: 0,
          resetMs: windowSeconds * 1000,
        };
      }
    }
  }

  return checkRateLimit(identifier, maxHits, windowSeconds * 1000);
}
