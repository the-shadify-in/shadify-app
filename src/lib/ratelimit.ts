/**
 * Lightweight in-memory sliding window rate limiter
 * Protects open public forms (RSVP, Shagun, Guestbook) against spam bursts
 */

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
