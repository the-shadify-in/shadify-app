/**
 * Cloudflare Turnstile Server-Side Verification
 * Verifies non-interactive CAPTCHA challenge tokens on public endpoints (RSVP, Guestbook).
 */

const TURNSTILE_VERIFY_ENDPOINT = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileVerifyResult {
  success: boolean;
  error?: string;
  errorCodes?: string[];
}

export function isTurnstileEnforced(): boolean {
  if (process.env.NODE_ENV === "production") return true;
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

/**
 * Validates a Turnstile response token with Cloudflare's verification endpoint.
 * In development / automated tests without a configured secret key, allows mock test tokens.
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string,
): Promise<TurnstileVerifyResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // Local development / CI fallback
  if (!secretKey) {
    if (process.env.NODE_ENV !== "production") {
      // In dev/test, accept test tokens or pass-through if not in production
      if (token === "test-turnstile-token" || token === "dummy-token" || !token) {
        return { success: true };
      }
    }
    // In production without a secret key, fail safe
    return {
      success: false,
      error: "Turnstile secret key is not configured on the server.",
    };
  }

  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return {
      success: false,
      error: "Missing or invalid bot protection verification token.",
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token.trim());
    if (remoteIp && remoteIp !== "127.0.0.1" && remoteIp !== "::1") {
      formData.append("remoteip", remoteIp);
    }

    const res = await fetch(TURNSTILE_VERIFY_ENDPOINT, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!res.ok) {
      return {
        success: false,
        error: `Cloudflare Turnstile service returned status ${res.status}`,
      };
    }

    const data = (await res.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };

    if (data.success) {
      return { success: true };
    }

    return {
      success: false,
      error: "Bot protection verification failed. Please refresh and try again.",
      errorCodes: data["error-codes"],
    };
  } catch (err) {
    console.error("Turnstile verification error:", err);
    return {
      success: false,
      error: "Verification service temporarily unreachable.",
    };
  }
}
