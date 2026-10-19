import { createHmac, timingSafeEqual, scrypt, randomBytes } from "crypto";
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
