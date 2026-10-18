import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const SESSION_COOKIE_NAME = "shadify_admin_session";
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET ?? "fallback-dev-secret-do-not-use-in-production";

/**
 * Signs a payload with HMAC-SHA256
 */
export function signSessionToken(userId: string, role: string): string {
  const payload = JSON.stringify({ userId, role, iat: Date.now() });
  const encodedPayload = Buffer.from(payload).toString("base64url");
  const signature = createHmac("sha256", SESSION_SECRET)
    .update(encodedPayload)
    .digest("base64url");
  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies an HMAC-SHA256 signed session token
 */
export function verifySessionToken(token: string): { userId: string; role: string } | null {
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

    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf-8"));
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

/**
 * Server helper to get current admin session from cookies
 */
export async function getAdminSession(): Promise<{ userId: string; role: string } | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!sessionCookie?.value) return null;
  return verifySessionToken(sessionCookie.value);
}

/**
 * Signs a temporary preview token for a wedding slug
 */
export function signPreviewToken(slug: string, ttlMs = 24 * 60 * 60 * 1000): string {
  const expiresAt = Date.now() + ttlMs;
  const payload = Buffer.from(JSON.stringify({ slug, exp: expiresAt })).toString("base64url");
  const signature = createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

/**
 * Verifies a temporary preview token for a wedding slug
 */
export function verifyPreviewToken(token?: string | null, slug?: string): boolean {
  if (!token || !slug) return false;
  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return false;

    const expectedSig = createHmac("sha256", SESSION_SECRET)
      .update(payloadB64)
      .digest("base64url");

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return false;
    }

    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
    if (payload.slug !== slug) return false;
    if (Date.now() > payload.exp) return false;

    return true;
  } catch {
    return false;
  }
}

