import { createHmac, createHash, timingSafeEqual, scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { z } from "zod";

const scryptAsync = promisify(scrypt);

/**
 * Returns the RFC 6265bis __Host- cookie name in production to ensure
 * strict HTTPS-only, host-only, root-path session storage.
 */
export function getSessionCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Host-shadify_admin_session"
    : "shadify_admin_session";
}

export const SESSION_COOKIE_NAME = getSessionCookieName();

const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ?? "fallback-dev-secret-do-not-use-in-production";

export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

// Bumped to v2 to immediately invalidate any legacy or previously exposed session tokens
export const CURRENT_SESSION_VERSION = process.env.ADMIN_SESSION_VERSION || "v2";

/**
 * Hashes a plaintext password using crypto.scrypt with a random 16-byte salt.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifies a plaintext password against an scrypt salt:hash string using constant-time timingSafeEqual.
 */
export async function verifyPassword(password: string, combinedHash: string): Promise<boolean> {
  try {
    const [salt, key] = combinedHash.split(":");
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    if (keyBuffer.length !== derivedKey.length) return false;
    return timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

export interface AdminSession {
  userId: string;
  role: string;
  version?: string;
  exp: number;
}

/**
 * Signs a payload with HMAC-SHA256 and an explicit expiry timestamp.
 */
export function signSessionToken(
  userId: string,
  role: string,
  ttlMs = SESSION_MAX_AGE_SECONDS * 1000,
): string {
  const exp = Date.now() + ttlMs;
  const payload = JSON.stringify({
    userId,
    role,
    v: CURRENT_SESSION_VERSION,
    iat: Date.now(),
    exp,
  });
  const encodedPayload = Buffer.from(payload).toString("base64url");
  const signature = createHmac("sha256", SESSION_SECRET).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

const SessionPayloadSchema = z.object({
  userId: z.string(),
  role: z.string(),
  v: z.string().optional(),
  exp: z.number().optional(),
});

/**
 * Verifies an HMAC-SHA256 signed session token and checks expiration and session version.
 */
export function verifySessionToken(token: string): AdminSession | null {
  try {
    const [encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature) return null;

    const expectedSignature = createHmac("sha256", SESSION_SECRET)
      .update(encodedPayload)
      .digest("base64url");

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const rawPayload: unknown = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf-8"),
    );
    const parsed = SessionPayloadSchema.safeParse(rawPayload);
    if (!parsed.success) return null;
    const payload = parsed.data;

    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }

    // Invalidate if token version does not match current configured session version
    if (payload.v && payload.v !== CURRENT_SESSION_VERSION) {
      return null;
    }

    return {
      userId: payload.userId,
      role: payload.role,
      version: payload.v,
      exp: payload.exp ?? Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
    };
  } catch {
    return null;
  }
}

/**
 * Server helper to get current admin session from cookies
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = cookies();
    const sessionCookie =
      cookieStore.get(SESSION_COOKIE_NAME) ||
      cookieStore.get("__Host-shadify_admin_session") ||
      cookieStore.get("shadify_admin_session");
    if (!sessionCookie?.value) return null;
    return verifySessionToken(sessionCookie.value);
  } catch {
    return null;
  }
}

/**
 * Strict in-handler gate: requires a valid staff or super_admin session.
 */
export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session || (session.role !== "super_admin" && session.role !== "staff")) {
    throw new Error("UNAUTHORIZED_ADMIN");
  }
  return session;
}

/**
 * Signs a temporary preview token for a wedding slug
 */
export function signPreviewToken(slug: string, ttlMs = 24 * 60 * 60 * 1000): string {
  const expiresAt = Date.now() + ttlMs;
  const payload = Buffer.from(JSON.stringify({ slug, exp: expiresAt })).toString("base64url");
  const signature = createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

const PreviewPayloadSchema = z.object({
  slug: z.string(),
  exp: z.number(),
});

/**
 * Verifies a temporary preview token for a wedding slug
 */
export function verifyPreviewToken(token?: string | null, slug?: string): boolean {
  if (!token || !slug) return false;
  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return false;

    const expectedSig = createHmac("sha256", SESSION_SECRET).update(payloadB64).digest("base64url");

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return false;
    }

    const rawPayload: unknown = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
    const parsed = PreviewPayloadSchema.safeParse(rawPayload);
    if (!parsed.success) return false;
    const payload = parsed.data;

    if (payload.slug !== slug) return false;
    if (Date.now() > payload.exp) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Validates production security secrets at startup / request time.
 * Enforces dedicated key material for guest access tokens distinct from admin session tokens.
 */
export function getGuestAccessSecret(): string {
  const secret = process.env.GUEST_ACCESS_SECRET;
  if (process.env.NODE_ENV === "production") {
    // During Next.js static collection/build phase, allow build to complete if runtime secrets are not yet injected
    if (
      (process.env.NEXT_PHASE === "phase-production-build" || process.env.CI === "true") &&
      (!secret || secret.trim().length < 32)
    ) {
      return "shadify-build-placeholder-guest-access-secret-32-chars";
    }
    if (!secret || secret.trim().length < 32) {
      throw new Error(
        "FATAL_SECURITY_CONFIG_ERROR: GUEST_ACCESS_SECRET must be set to an independent, cryptographically random key of at least 32 characters in production.",
      );
    }
    const adminSecret = process.env.ADMIN_SESSION_SECRET;
    if (adminSecret && secret.trim() === adminSecret.trim()) {
      throw new Error(
        "FATAL_SECURITY_CONFIG_ERROR: GUEST_ACCESS_SECRET cannot share the same key material as ADMIN_SESSION_SECRET. Use independent secrets.",
      );
    }
    return secret.trim();
  }
  return secret?.trim() || "shadify-dev-guest-access-secret-minimum-32-chars-long";
}

/**
 * Startup validator to fail deployment or health check if secrets are missing or weak.
 */
export function validateSecurityConfiguration(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (process.env.NODE_ENV === "production") {
    const adminSecret = process.env.ADMIN_SESSION_SECRET;
    if (!adminSecret || adminSecret.trim().length < 32) {
      errors.push("ADMIN_SESSION_SECRET must be at least 32 characters in production.");
    }
    const guestSecret = process.env.GUEST_ACCESS_SECRET;
    if (!guestSecret || guestSecret.trim().length < 32) {
      errors.push("GUEST_ACCESS_SECRET must be at least 32 characters in production.");
    }
    if (adminSecret && guestSecret && adminSecret.trim() === guestSecret.trim()) {
      errors.push("GUEST_ACCESS_SECRET must not share the same value as ADMIN_SESSION_SECRET.");
    }
    const erasureSecret = process.env.ERASURE_HMAC_SECRET;
    if (!erasureSecret || erasureSecret.trim().length < 32) {
      errors.push("ERASURE_HMAC_SECRET must be at least 32 characters in production.");
    }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Lazy accessor for guest PIN HMAC secret dedicated specifically to guest PIN access sessions.
 */
export function getGuestPinSecret(): string {
  return getGuestAccessSecret();
}

/**
 * Computes a deterministic 16-character SHA-256 fingerprint of the wedding's active private PIN hash.
 * If the owner changes or clears the PIN, the fingerprint changes, immediately invalidating old tokens.
 */
export function computePinFingerprint(privatePinHash?: string | null): string {
  if (!privatePinHash) return "none";
  return createHash("sha256").update(privatePinHash).digest("hex").slice(0, 16);
}

/**
 * Unified RFC 6265bis __Host- cookie name for guest private wedding access.
 * Single cookie name avoids accumulating one cookie per wedding.
 */
export const GUEST_PIN_COOKIE_NAME =
  process.env.NODE_ENV === "production" ? "__Host-shadify_guest_access" : "shadify_guest_access";

export function getGuestPinCookieName(): string {
  return GUEST_PIN_COOKIE_NAME;
}

export interface GuestAccessEntry {
  weddingId: string;
  pinFingerprint: string;
  iat: number;
  exp: number;
}

const HEX_16_REGEX = /^[a-f0-9]{16}$/;

const GuestAccessEntrySchema = z.object({
  weddingId: z.string().min(1).max(64),
  pinFingerprint: z.string().regex(HEX_16_REGEX, "Fingerprint must be 16 lowercase hex characters"),
  iat: z.number().int().positive(),
  exp: z.number().int().positive(),
});

const GuestPinPayloadSchema = z.object({
  purpose: z.literal("guest_pin_access"),
  weddingId: z.string().min(1).max(64).optional(),
  pinFingerprint: z.string().regex(HEX_16_REGEX).optional(),
  iat: z.number().int().positive().optional(),
  exp: z.number().int().positive().optional(),
  accesses: z.array(GuestAccessEntrySchema).max(10).optional(),
});

/**
 * Signs an HMAC-SHA256 authenticated guest PIN access session token for a private wedding.
 * Incorporates a separate purpose claim and binds to the current PIN fingerprint.
 * Merges with existing valid sessions if the guest is attending multiple weddings (up to 10 max).
 */
export function signGuestPinToken(
  weddingId: string,
  privatePinHash: string,
  existingCookieToken?: string | null,
  ttlMs = 24 * 60 * 60 * 1000,
): string {
  const now = Date.now();
  const exp = now + ttlMs;
  const pinFingerprint = computePinFingerprint(privatePinHash);

  const newEntry: GuestAccessEntry = {
    weddingId,
    pinFingerprint,
    iat: now,
    exp,
  };

  const existingEntries: GuestAccessEntry[] = [];
  const seenWeddingIds = new Set<string>([weddingId]);

  if (existingCookieToken) {
    try {
      const [payloadB64, signature] = existingCookieToken.split(".");
      if (payloadB64 && signature) {
        // Cryptographically verify existing cookie before trusting its contents
        const expectedSig = createHmac("sha256", getGuestPinSecret())
          .update(payloadB64)
          .digest("base64url");
        const sigBuf = Buffer.from(signature);
        const expBuf = Buffer.from(expectedSig);

        if (sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf)) {
          const rawPayload: unknown = JSON.parse(
            Buffer.from(payloadB64, "base64url").toString("utf-8"),
          );
          const parsed = GuestPinPayloadSchema.safeParse(rawPayload);
          if (parsed.success && parsed.data.purpose === "guest_pin_access") {
            if (parsed.data.accesses) {
              for (const item of parsed.data.accesses) {
                if (!seenWeddingIds.has(item.weddingId) && item.exp > now) {
                  seenWeddingIds.add(item.weddingId);
                  existingEntries.push(item);
                }
              }
            } else if (
              parsed.data.weddingId &&
              !seenWeddingIds.has(parsed.data.weddingId) &&
              parsed.data.pinFingerprint &&
              parsed.data.exp &&
              parsed.data.exp > now
            ) {
              seenWeddingIds.add(parsed.data.weddingId);
              existingEntries.push({
                weddingId: parsed.data.weddingId,
                pinFingerprint: parsed.data.pinFingerprint,
                iat: parsed.data.iat || now,
                exp: parsed.data.exp,
              });
            }
          }
        }
      }
    } catch {
      // Ignore parsing errors for existing cookie token
    }
  }

  // Keep up to 9 previous accesses plus the new one (strict max 10 entries)
  const accesses = [newEntry, ...existingEntries.slice(0, 9)];

  const payloadObj = {
    purpose: "guest_pin_access" as const,
    weddingId,
    pinFingerprint,
    iat: now,
    exp,
    accesses,
  };

  const payload = Buffer.from(JSON.stringify(payloadObj)).toString("base64url");
  const signature = createHmac("sha256", getGuestPinSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

/**
 * Verifies that a guest PIN session token is authentic, unexpired, matches purpose 'guest_pin_access',
 * is strictly bound to the target weddingId, and matches the current PIN fingerprint.
 */
export function verifyGuestPinToken(
  token?: string | null,
  weddingId?: string,
  currentPinHash?: string | null,
): boolean {
  if (!token || !weddingId) return false;
  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return false;

    const expectedSig = createHmac("sha256", getGuestPinSecret())
      .update(payloadB64)
      .digest("base64url");
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return false;
    }

    const rawPayload: unknown = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
    const parsed = GuestPinPayloadSchema.safeParse(rawPayload);
    if (!parsed.success) return false;

    const payload = parsed.data;
    if (payload.purpose !== "guest_pin_access") return false;

    // Check accesses list or single-wedding fallback
    let match: GuestAccessEntry | null = null;
    if (payload.accesses && payload.accesses.length > 0) {
      match = payload.accesses.find((a) => a.weddingId === weddingId) || null;
    } else if (payload.weddingId === weddingId && payload.pinFingerprint && payload.exp) {
      match = {
        weddingId: payload.weddingId,
        pinFingerprint: payload.pinFingerprint,
        iat: payload.iat || 0,
        exp: payload.exp,
      };
    }

    if (!match) return false;
    if (Date.now() > match.exp) return false;

    // Verify PIN configuration fingerprint: if owner changed or removed the PIN, reject session
    const expectedFingerprint = computePinFingerprint(currentPinHash);
    if (match.pinFingerprint !== expectedFingerprint) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Server helper to check if the current guest holds a valid verified PIN session for a given wedding.
 */
export async function getGuestPinSession(
  weddingId: string,
  currentPinHash?: string | null,
): Promise<boolean> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = cookies();
    const pinCookie =
      cookieStore.get(GUEST_PIN_COOKIE_NAME) ||
      cookieStore.get("__Host-shadify_guest_access") ||
      cookieStore.get("shadify_guest_access") ||
      // Legacy fallback
      cookieStore.get(`__Host-shadify_pin_${weddingId}`) ||
      cookieStore.get(`shadify_pin_${weddingId}`);

    if (!pinCookie?.value) return false;
    return verifyGuestPinToken(pinCookie.value, weddingId, currentPinHash);
  } catch {
    return false;
  }
}
