/**
 * Groups IPv6 addresses to their /64 routing prefix to prevent address cycling,
 * while leaving IPv4 addresses unchanged.
 */
export function normalizeIp(ip: string): string {
  const trimmed = ip.trim();
  if (trimmed.includes(":")) {
    const hextets = trimmed.split(":");
    return hextets.slice(0, 4).join(":") + "::/64";
  }
  return trimmed;
}

/**
 * Safely extracts client IP from trusted edge proxy headers.
 * Prioritizes Vercel and Cloudflare platform edge headers.
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;

  // 1. Vercel's edge-injected client IP (cannot be spoofed from client)
  const vercelIp = headers.get("x-vercel-ip");
  if (vercelIp && vercelIp.trim().length > 0) return normalizeIp(vercelIp);

  // 2. Cloudflare's connecting IP (if behind Cloudflare)
  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp && cfIp.trim().length > 0) return normalizeIp(cfIp);

  // 3. Fallback edge headers
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
 * Check and record an action for a given identifier (IP / phone / token)
 * @param identifier Unique key (e.g. `rsvp:192.168.1.1` or `shagun:phone`)
 * @param maxHits Maximum allowed submissions in the window
 * @param windowMs Window duration in milliseconds (default: 60,000ms = 1 minute)
 */
export function checkRateLimit(
  identifier: string,
  maxHits: number = 10,
  windowMs: number = 60000,
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
    const oldest = record.timestamps[0];
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
