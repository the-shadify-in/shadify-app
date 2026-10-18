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
